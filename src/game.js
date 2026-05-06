const SUITS = [
  { key: 'Clubs', label: 'Kreuz', symbol: '♣', base: 12 },
  { key: 'Spades', label: 'Pik', symbol: '♠', base: 11 },
  { key: 'Hearts', label: 'Herz', symbol: '♥', base: 10 },
  { key: 'Diamonds', label: 'Karo', symbol: '♦', base: 9 },
];

const SUIT_DISPLAY_ORDER = ['Clubs', 'Spades', 'Hearts', 'Diamonds'];
const SUIT_CARD_ORDER = ['A', '10', 'K', 'Q', '9', '8', '7'];
const NULL_CARD_ORDER = ['A', 'K', 'Q', 'J', '10', '9', '8', '7'];
const JACK_TRUMP_ORDER = ['J-Clubs', 'J-Spades', 'J-Hearts', 'J-Diamonds'];

const RANKS = [
  { key: 'A', label: 'Ass', short: 'A', points: 11 },
  { key: '10', label: '10', short: '10', points: 10 },
  { key: 'K', label: 'König', short: 'K', points: 4 },
  { key: 'Q', label: 'Dame', short: 'D', points: 3 },
  { key: 'J', label: 'Bube', short: 'B', points: 2 },
  { key: '9', label: '9', short: '9', points: 0 },
  { key: '8', label: '8', short: '8', points: 0 },
  { key: '7', label: '7', short: '7', points: 0 },
];

const BID_STEPS = [18, 20, 22, 23, 24, 27, 30, 33, 35, 36, 40, 44, 46, 48, 50, 54, 55, 60, 66, 70, 72, 77, 80, 84, 88, 90, 96, 99, 100, 108, 110, 121, 126, 130, 132, 135, 143, 144, 150, 154, 160, 165, 168, 176, 180, 192, 204, 216, 240];
const BID_INDEX = new Map(BID_STEPS.map((value, index) => [value, index]));

const GAME_TYPES = [
  { type: 'grand', label: 'Grand', base: 24 },
  { type: 'null', label: 'Null', base: 23 },
  { type: 'suit', suitKey: 'Clubs', label: 'Kreuz', base: 12 },
  { type: 'suit', suitKey: 'Spades', label: 'Pik', base: 11 },
  { type: 'suit', suitKey: 'Hearts', label: 'Herz', base: 10 },
  { type: 'suit', suitKey: 'Diamonds', label: 'Karo', base: 9 },
];

function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(array, rng) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createDeck() {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({
    id: `${rank.key}-${suit.key}`,
    suitKey: suit.key,
    suitLabel: suit.label,
    suitSymbol: suit.symbol,
    rankKey: rank.key,
    rankLabel: rank.label,
    short: `${rank.short}${suit.symbol}`,
    points: rank.points,
  })));
}

function sumCardPoints(cards) {
  return cards.reduce((sum, card) => sum + (card?.points ?? 0), 0);
}

function seatTemplate(id, label, role, ai) {
  return {
    id,
    label,
    role,
    ai,
    hand: [],
    bidCeiling: 18,
    trickPoints: 0,
    tricksWon: 0,
  };
}

function seatAt(seats, index) {
  return seats[(index + seats.length) % seats.length];
}

function nextIndex(index) {
  return (index + 1) % 3;
}

function bidIndex(value) {
  return BID_INDEX.get(value) ?? 0;
}

function nextBidValue(value) {
  const idx = bidIndex(value);
  return BID_STEPS[Math.min(idx + 1, BID_STEPS.length - 1)];
}

function cardRankIndex(rankKey, order) {
  const idx = order.indexOf(rankKey);
  return idx === -1 ? 999 : idx;
}

function isJack(card) {
  return card.rankKey === 'J';
}

function makeContract(type, suitKey = null) {
  if (type === 'grand') return { type: 'grand', label: 'Grand', valueBase: 24 };
  if (type === 'null') return { type: 'null', label: 'Null', valueBase: 23 };
  const suit = SUITS.find((item) => item.key === suitKey);
  return { type: 'suit', suitKey, label: suit?.label ?? 'Unbekannt', valueBase: suit?.base ?? 9 };
}

function contractLabel(contract) {
  if (!contract) return 'Noch kein Spieltyp gewählt';
  if (contract.type === 'grand') return 'Grand';
  if (contract.type === 'null') return 'Null';
  return `${contract.label} (${contract.suitKey})`;
}

function isTrump(card, contract) {
  if (!contract) return false;
  if (contract.type === 'grand') return isJack(card);
  if (contract.type === 'suit') return isJack(card) || card.suitKey === contract.suitKey;
  return false;
}

function trumpRankIndex(card, contract) {
  if (contract.type === 'grand') {
    return JACK_TRUMP_ORDER.indexOf(`J-${card.suitKey}`);
  }
  if (contract.type === 'suit') {
    if (isJack(card)) return JACK_TRUMP_ORDER.indexOf(`J-${card.suitKey}`);
    return 4 + cardRankIndex(card.rankKey, SUIT_CARD_ORDER);
  }
  return 999;
}

function compareRankAscending(cardA, cardB, order) {
  return cardRankIndex(cardA.rankKey, order) - cardRankIndex(cardB.rankKey, order);
}

function cardDisplayKey(card, contract) {
  if (contract.type === 'null') {
    return [
      0,
      SUIT_DISPLAY_ORDER.indexOf(card.suitKey),
      cardRankIndex(card.rankKey, NULL_CARD_ORDER),
      card.suitKey,
      card.rankKey,
    ];
  }

  if (isJack(card)) {
    return [0, JACK_TRUMP_ORDER.indexOf(`J-${card.suitKey}`), 0, card.suitKey, card.rankKey];
  }

  if (contract.type === 'suit' && card.suitKey === contract.suitKey) {
    return [1, 0, cardRankIndex(card.rankKey, SUIT_CARD_ORDER), card.suitKey, card.rankKey];
  }

  const suitOrder = contract.type === 'suit'
    ? SUIT_DISPLAY_ORDER.filter((suitKey) => suitKey !== contract.suitKey)
    : SUIT_DISPLAY_ORDER;

  return [
    contract.type === 'suit' ? 2 : 1,
    suitOrder.indexOf(card.suitKey),
    cardRankIndex(card.rankKey, SUIT_CARD_ORDER),
    card.suitKey,
    card.rankKey,
  ];
}

function sortForUI(cards, contract = makeContract('grand')) {
  return cards.slice().sort((a, b) => {
    const keyA = cardDisplayKey(a, contract);
    const keyB = cardDisplayKey(b, contract);
    for (let i = 0; i < keyA.length; i += 1) {
      if (keyA[i] < keyB[i]) return -1;
      if (keyA[i] > keyB[i]) return 1;
    }
    return 0;
  });
}

function beatsCard(candidate, current, leadSuitKey, contract) {
  if (contract.type === 'null') {
    const candidateLead = candidate.card.suitKey === leadSuitKey;
    const currentLead = current.card.suitKey === leadSuitKey;
    if (candidateLead !== currentLead) return candidateLead;
    if (!candidateLead) return false;
    return compareRankAscending(candidate.card, current.card, NULL_CARD_ORDER) < 0;
  }

  const candidateTrump = isTrump(candidate.card, contract);
  const currentTrump = isTrump(current.card, contract);
  if (candidateTrump !== currentTrump) return candidateTrump;

  if (candidateTrump && currentTrump) {
    return trumpRankIndex(candidate.card, contract) < trumpRankIndex(current.card, contract);
  }

  const candidateLead = candidate.card.suitKey === leadSuitKey;
  const currentLead = current.card.suitKey === leadSuitKey;
  if (candidateLead !== currentLead) return candidateLead;
  if (!candidateLead) return false;
  return compareRankAscending(candidate.card, current.card, SUIT_CARD_ORDER) < 0;
}

function determineTrickWinner(trick, contract) {
  if (!trick.length) return null;
  const leadSuitKey = trick[0].card.suitKey;
  let best = trick[0];
  for (let i = 1; i < trick.length; i += 1) {
    const candidate = trick[i];
    if (beatsCard(candidate, best, leadSuitKey, contract)) {
      best = candidate;
    }
  }
  return best;
}

function legalCards(hand, trick, contract) {
  if (trick.length === 0) return hand;
  const lead = trick[0].card;

  if (contract.type === 'null') {
    const matching = hand.filter((card) => card.suitKey === lead.suitKey);
    return matching.length ? matching : hand;
  }

  const leadIsTrump = isTrump(lead, contract);
  if (leadIsTrump) {
    const trumps = hand.filter((card) => isTrump(card, contract));
    return trumps.length ? trumps : hand;
  }

  const followSuit = hand.filter((card) => !isTrump(card, contract) && card.suitKey === lead.suitKey);
  return followSuit.length ? followSuit : hand;
}

function removeCardById(hand, cardId) {
  const index = hand.findIndex((card) => card.id === cardId);
  if (index === -1) return null;
  return hand.splice(index, 1)[0];
}

function contractValueEstimate(contract, hand) {
  if (contract.type === 'null') {
    const riskyHighCards = hand.filter((card) => ['A', 'K', 'Q'].includes(card.rankKey)).length;
    return Math.max(23, 23 - riskyHighCards);
  }

  const trumps = hand.filter((card) => isTrump(card, contract));
  const highTrumps = trumps.filter((card) => card.rankKey === 'J' || card.rankKey === 'A' || card.rankKey === '10').length;
  const aces = hand.filter((card) => !isTrump(card, contract) && card.rankKey === 'A').length;
  const tens = hand.filter((card) => !isTrump(card, contract) && card.rankKey === '10').length;
  const base = contract.valueBase;
  const multiplier = 1 + Math.min(8, trumps.length + highTrumps + aces + tens);
  return base * multiplier;
}

function bestContractForHand(hand) {
  const candidates = GAME_TYPES.map((candidate) => {
    const contract = makeContract(candidate.type, candidate.suitKey);
    return { contract, value: contractValueEstimate(contract, hand) };
  });
  candidates.sort((a, b) => b.value - a.value);
  return candidates[0].contract;
}

function bidCeilingForHand(hand) {
  const values = GAME_TYPES.map((candidate) => contractValueEstimate(makeContract(candidate.type, candidate.suitKey), hand));
  const best = Math.max(...values);
  return BID_STEPS.reduce((acc, bid) => (bid <= best ? bid : acc), 18);
}

function chooseDiscardCards(hand, contract) {
  return sortForUI(hand, contract).slice().reverse().slice(0, 2).map((card) => card.id);
}

function simpleCardScore(card, contract, trick) {
  if (contract.type === 'null') {
    return cardRankIndex(card.rankKey, NULL_CARD_ORDER);
  }
  if (isTrump(card, contract)) return 50 - trumpRankIndex(card, contract);
  if (trick.length > 0 && trick[0].card.suitKey === card.suitKey) {
    return 30 - cardRankIndex(card.rankKey, SUIT_CARD_ORDER);
  }
  return 10 - cardRankIndex(card.rankKey, SUIT_CARD_ORDER);
}

function aiChooseBidAction(game, seatIndex) {
  const seat = game.seats[seatIndex];
  return game.currentBid <= seat.bidCeiling ? 'stay' : 'pass';
}

function aiChooseContract(game, seatIndex) {
  return bestContractForHand(game.seats[seatIndex].hand);
}

function aiChooseDiscard(game, seatIndex) {
  return chooseDiscardCards(game.seats[seatIndex].hand, game.contract);
}

function aiChooseCard(game, seatIndex) {
  const legal = legalCards(game.seats[seatIndex].hand, game.currentTrick, game.contract);
  const scored = legal.map((card) => ({ card, score: simpleCardScore(card, game.contract, game.currentTrick) }));
  scored.sort((a, b) => {
    if (game.contract.type === 'null') return a.score - b.score;
    if (game.currentTrick.length === 0) return b.score - a.score;
    return b.score - a.score;
  });
  return scored[0]?.card ?? legal[0];
}

function defaultSeed() {
  if (typeof window === 'undefined') return 'SimpleSkat';
  try {
    const seed = new URLSearchParams(window.location.search).get('seed');
    return seed || 'SimpleSkat';
  } catch {
    return 'SimpleSkat';
  }
}

function createGame(seed = defaultSeed()) {
  const rng = mulberry32(hashSeed(seed));
  const deck = shuffle(createDeck(), rng);

  const seats = [
    seatTemplate('human', 'Du', 'Mensch', 'human'),
    seatTemplate('left-ai', 'KI links', 'Gegner', 'simple'),
    seatTemplate('right-ai', 'KI rechts', 'Gegner', 'simple'),
  ];

  seats[0].hand = deck.slice(0, 10);
  seats[1].hand = deck.slice(10, 20);
  seats[2].hand = deck.slice(20, 30);
  const skat = deck.slice(30, 32);

  seats.forEach((seat) => {
    seat.bidCeiling = bidCeilingForHand(seat.hand);
  });

  const game = {
    gameNo: 1,
    dealerIndex: 0,
    seats,
    skat,
    phase: 'bidding',
    currentTurnIndex: nextIndex(0),
    currentBid: 18,
    highestBidder: null,
    activeBidders: [true, true, true],
    declarerIndex: null,
    contract: null,
    contractChoice: null,
    discardSelection: [],
    currentTrick: [],
    trickHistory: [],
    result: null,
    log: [
      'Neues Spiel gestartet.',
      'Karten deterministisch gemischt und verteilt.',
      'Bietphase beginnt bei Vorhand.',
    ],
    seatName(index) {
      return seatAt(this.seats, index)?.label ?? 'Unbekannt';
    },
    get human() {
      return this.seats[0];
    },
    defenderIndices() {
      return [0, 1, 2].filter((index) => index !== this.declarerIndex);
    },
    phaseLabel() {
      if (this.phase === 'bidding') return 'Reizen';
      if (this.phase === 'contract') return 'Spieltyp wählen';
      if (this.phase === 'skat') return 'Skat aufnehmen / ablegen';
      if (this.phase === 'play') return 'Spiel';
      if (this.phase === 'result') return 'Ergebnis';
      return this.phase;
    },
    contractLabel() {
      return contractLabel(this.contract);
    },
    currentBidLabel() {
      if (this.phase !== 'bidding') return '—';
      return `${this.currentBid} (${this.highestBidder === null ? 'Start' : `Höchstbieter: ${this.seatName(this.highestBidder)}`})`;
    },
    playStateText() {
      if (this.phase === 'play' && this.currentTrick.length > 0) {
        return `Stich: ${this.currentTrick.map((play) => `${this.seatName(play.seatIndex)} ${play.card.short}`).join(' · ')}`;
      }
      return 'Kein laufender Stich';
    },
    handCards(index) {
      return sortForUI(this.seats[index].hand, this.contract ?? makeContract('grand'));
    },
    legalCardsFor(index) {
      return legalCards(this.seats[index].hand, this.currentTrick, this.contract ?? makeContract('grand'));
    },
    biddingStateText() {
      const active = [0, 1, 2].filter((index) => this.activeBidders[index]);
      return `Aktiv: ${active.map((index) => this.seatName(index)).join(', ')}`;
    },
    scoreLabel() {
      if (!this.result) {
        const declarerPoints = this.declarerIndex === null ? 0 : this.seats[this.declarerIndex].trickPoints;
        const defenderPoints = this.declarerIndex === null ? 0 : this.defenderIndices().reduce((sum, index) => sum + this.seats[index].trickPoints, 0);
        return `Alleinspieler ${declarerPoints} : ${defenderPoints} Gegner`;
      }
      return `Alleinspieler ${this.result.declarerPoints} : ${this.result.defenderPoints} Gegner`;
    },
    resultLabel() {
      if (!this.result) return '—';
      return this.result.winner === 'declarer'
        ? `${this.seatName(this.declarerIndex)} gewinnt`
        : 'Die Gegenspieler gewinnen';
    },
    logLine(text) {
      this.log.push(text);
    },
    setPhase(nextPhase) {
      this.phase = nextPhase;
    },
    autoAdvance() {
      let guard = 0;
      while (guard < 300) {
        guard += 1;
        const acted = this.aiMove();
        if (!acted || this.phase === 'result') break;
      }
    },
    aiMove() {
      if (this.phase === 'bidding' && this.currentTurnIndex !== 0) {
        const seat = this.seats[this.currentTurnIndex];
        const action = aiChooseBidAction(this, this.currentTurnIndex);
        if (action === 'stay') {
          this.highestBidder = this.currentTurnIndex;
          this.logLine(`${seat.label} reizt auf ${this.currentBid}.`);
          this.currentBid = nextBidValue(this.currentBid);
        } else {
          this.activeBidders[this.currentTurnIndex] = false;
          this.logLine(`${seat.label} passt.`);
        }
        this.advanceBidding();
        return true;
      }

      if (this.phase === 'contract' && this.declarerIndex !== 0) {
        this.contractChoice = aiChooseContract(this, this.declarerIndex);
        this.commitContract();
        return true;
      }

      if (this.phase === 'skat' && this.declarerIndex !== 0) {
        this.discardSelection = aiChooseDiscard(this, this.declarerIndex);
        this.commitDiscard();
        return true;
      }

      if (this.phase === 'play' && this.currentTurnIndex !== 0) {
        const card = aiChooseCard(this, this.currentTurnIndex);
        this.playCard(this.currentTurnIndex, card.id);
        return true;
      }

      return false;
    },
    advanceBidding() {
      const active = [0, 1, 2].filter((index) => this.activeBidders[index]);
      if (active.length === 1) {
        this.declarerIndex = active[0];
        this.contractChoice = null;
        this.logLine(`Bieten beendet. ${this.seatName(this.declarerIndex)} ist Alleinspieler.`);
        this.setPhase('contract');
        return;
      }

      this.currentTurnIndex = nextIndex(this.currentTurnIndex);
      let safety = 0;
      while (safety < 3 && !this.activeBidders[this.currentTurnIndex]) {
        this.currentTurnIndex = nextIndex(this.currentTurnIndex);
        safety += 1;
      }
    },
    humanBidStay() {
      if (this.phase !== 'bidding' || !this.canHumanAct()) return;
      if (!this.allowedHumanBids()) return;
      this.highestBidder = 0;
      this.logLine(`Du reizt auf ${this.currentBid}.`);
      this.currentBid = nextBidValue(this.currentBid);
      this.advanceBidding();
      this.autoAdvance();
    },
    humanBidPass() {
      if (this.phase !== 'bidding' || !this.canHumanAct()) return;
      this.activeBidders[0] = false;
      this.logLine('Du passt.');
      this.advanceBidding();
      this.autoAdvance();
    },
    canHumanAct() {
      if (this.phase === 'bidding') return this.currentTurnIndex === 0;
      if (this.phase === 'contract') return this.declarerIndex === 0;
      if (this.phase === 'skat') return this.declarerIndex === 0 && this.discardSelection.length < 2;
      if (this.phase === 'play') return this.currentTurnIndex === 0;
      return false;
    },
    allowedHumanBids() {
      const seat = this.seats[0];
      return this.currentBid <= seat.bidCeiling;
    },
    chooseContract(type, suitKey = null) {
      if (this.phase !== 'contract' || this.declarerIndex !== 0) return;
      this.contractChoice = makeContract(type, suitKey);
      this.commitContract();
      this.autoAdvance();
    },
    commitContract() {
      this.contract = this.contractChoice;
      this.seats[this.declarerIndex].hand.push(...this.skat);
      this.skat = [];
      this.discardSelection = [];
      this.logLine(`${this.seatName(this.declarerIndex)} wählt ${this.contractLabel()}.`);
      this.setPhase('skat');
      if (this.declarerIndex !== 0) {
        this.logLine(`${this.seatName(this.declarerIndex)} nimmt den Skat auf.`);
      }
    },
    toggleDiscard(cardId) {
      if (this.phase !== 'skat' || this.declarerIndex !== 0) return;
      const index = this.discardSelection.indexOf(cardId);
      if (index >= 0) {
        this.discardSelection.splice(index, 1);
        return;
      }
      if (this.discardSelection.length < 2) {
        this.discardSelection.push(cardId);
      }
    },
    commitDiscard() {
      if (this.discardSelection.length !== 2) return;
      const declarer = this.seats[this.declarerIndex];
      this.discardSelection.forEach((cardId) => {
        removeCardById(declarer.hand, cardId);
      });
      this.logLine(`${this.seatName(this.declarerIndex)} legt 2 Karten ab.`);
      this.discardSelection = [];
      this.currentTurnIndex = this.declarerIndex;
      this.currentTrick = [];
      this.setPhase('play');
      this.autoAdvance();
    },
    playCard(index, cardId) {
      if (this.phase !== 'play' || this.currentTurnIndex !== index) return;
      const hand = this.seats[index].hand;
      const legal = legalCards(hand, this.currentTrick, this.contract);
      const card = hand.find((entry) => entry.id === cardId);
      if (!card || !legal.some((entry) => entry.id === cardId)) return;

      removeCardById(hand, cardId);
      this.currentTrick.push({ seatIndex: index, card });
      this.logLine(`${this.seatName(index)} spielt ${card.short}.`);

      if (this.currentTrick.length < 3) {
        this.currentTurnIndex = nextIndex(index);
        this.autoAdvance();
        return;
      }

      const winningPlay = determineTrickWinner(this.currentTrick, this.contract);
      const winnerIndex = winningPlay.seatIndex;
      const trickPoints = sumCardPoints(this.currentTrick.map((play) => play.card));

      this.seats[winnerIndex].trickPoints += trickPoints;
      this.seats[winnerIndex].tricksWon += 1;
      this.trickHistory.push({
        leader: this.currentTrick[0].seatIndex,
        winner: winnerIndex,
        points: trickPoints,
        cards: this.currentTrick.map((play) => play.card.short),
      });
      this.logLine(`${this.seatName(winnerIndex)} gewinnt den Stich mit ${trickPoints} Augen.`);

      this.currentTrick = [];
      this.currentTurnIndex = winnerIndex;

      if (this.seats.every((seat) => seat.hand.length === 0)) {
        this.finishGame();
        return;
      }

      this.autoAdvance();
    },
    finishGame() {
      const declarerPoints = this.seats[this.declarerIndex].trickPoints;
      const defenderPoints = this.defenderIndices().reduce((sum, index) => sum + this.seats[index].trickPoints, 0);
      const declarerTricks = this.seats[this.declarerIndex].tricksWon;
      const declarerWon = this.contract.type === 'null'
        ? declarerTricks === 0
        : declarerPoints >= 61;

      this.result = {
        declarerPoints,
        defenderPoints,
        declarerTricks,
        winner: declarerWon ? 'declarer' : 'defenders',
      };
      this.logLine(declarerWon ? `${this.seatName(this.declarerIndex)} gewinnt das Spiel.` : 'Die Gegenspieler gewinnen das Spiel.');
      this.setPhase('result');
    },
    nextGame() {
      const next = createGame(`SimpleSkat-${this.gameNo + 1}-${this.dealerIndex + 1}`);
      next.gameNo = this.gameNo + 1;
      next.dealerIndex = nextIndex(this.dealerIndex);
      next.currentTurnIndex = nextIndex(next.dealerIndex);
      next.log.unshift(`Dealer rolliert nach links auf ${next.seatName(next.dealerIndex)}.`);
      next.autoAdvance();
      return next;
    },
    pointAudit() {
      const currentTrickPoints = sumCardPoints(this.currentTrick.map((play) => play.card));
      const handPoints = sumCardPoints(this.seats.flatMap((seat) => seat.hand));
      const skatPoints = sumCardPoints(this.skat);
      return {
        deckPoints: 120,
        dealtPoints: handPoints + skatPoints + currentTrickPoints,
      };
    },
  };

  game.autoAdvance();
  return game;
}

export {
  createDeck,
  createGame,
  contractLabel,
  makeContract,
  legalCards,
  nextBidValue,
  bidCeilingForHand,
  contractValueEstimate,
  bestContractForHand,
  sortForUI,
  determineTrickWinner,
  sumCardPoints,
  isTrump,
};
