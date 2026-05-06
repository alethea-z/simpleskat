const SUITS = [
  { key: 'Clubs', label: 'Kreuz', symbol: '♣', base: 12 },
  { key: 'Spades', label: 'Pik', symbol: '♠', base: 11 },
  { key: 'Hearts', label: 'Herz', symbol: '♥', base: 10 },
  { key: 'Diamonds', label: 'Karo', symbol: '♦', base: 9 },
];

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
const TRUMP_ORDER = ['J-Clubs', 'J-Spades', 'J-Hearts', 'J-Diamonds'];
const NULL_ORDER = ['A', '10', 'K', 'Q', 'J', '9', '8', '7'];
const SUIT_ORDER = ['A', '10', 'K', 'Q', '9', '8', '7'];
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

function isTrump(card, contract) {
  if (!contract) return false;
  if (contract.type === 'grand') return isJack(card);
  if (contract.type === 'suit') return isJack(card) || card.suitKey === contract.suitKey;
  return false;
}

function trumpRank(card, contract) {
  if (contract.type === 'grand') {
    return TRUMP_ORDER.indexOf(`J-${card.suitKey}`);
  }
  if (contract.type === 'suit') {
    if (isJack(card)) return TRUMP_ORDER.indexOf(`J-${card.suitKey}`);
    const order = ['A', '10', 'K', 'Q', '9', '8', '7'];
    return 4 + order.indexOf(card.rankKey);
  }
  return 999;
}

function nonTrumpRank(card, contract) {
  if (contract.type === 'null') {
    return cardRankIndex(card.rankKey, NULL_ORDER);
  }
  return cardRankIndex(card.rankKey, SUIT_ORDER);
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
  const leadSuitCards = hand.filter((card) => !isTrump(card, contract) && card.suitKey === lead.suitKey);
  return leadSuitCards.length ? leadSuitCards : hand;
}

function compareTrickCards(a, b, leadSuitKey, contract) {
  const aTrump = isTrump(a.card, contract);
  const bTrump = isTrump(b.card, contract);
  if (aTrump && !bTrump) return 1;
  if (!aTrump && bTrump) return -1;
  if (aTrump && bTrump) {
    return trumpRank(a.card, contract) - trumpRank(b.card, contract);
  }
  if (a.card.suitKey !== leadSuitKey && b.card.suitKey === leadSuitKey) return -1;
  if (a.card.suitKey === leadSuitKey && b.card.suitKey !== leadSuitKey) return 1;
  if (a.card.suitKey !== leadSuitKey && b.card.suitKey !== leadSuitKey) return 0;
  return nonTrumpRank(b.card, contract) - nonTrumpRank(a.card, contract);
}

function trickWinner(trick, contract) {
  const leadSuitKey = trick[0].card.suitKey;
  return trick.reduce((best, current) => {
    if (!best) return current;
    return compareTrickCards(current, best, leadSuitKey, contract) > 0 ? current : best;
  }, null);
}

function removeCardById(hand, cardId) {
  const index = hand.findIndex((card) => card.id === cardId);
  if (index === -1) return null;
  return hand.splice(index, 1)[0];
}

function sortForUI(cards, contract) {
  return cards.slice().sort((a, b) => {
    const aTrump = isTrump(a, contract);
    const bTrump = isTrump(b, contract);
    if (aTrump && !bTrump) return -1;
    if (!aTrump && bTrump) return 1;
    if (aTrump && bTrump) return trumpRank(a, contract) - trumpRank(b, contract);
    if (contract.type === 'null') {
      const suitDiff = a.suitKey.localeCompare(b.suitKey);
      if (suitDiff !== 0) return suitDiff;
      return cardRankIndex(a.rankKey, NULL_ORDER) - cardRankIndex(b.rankKey, NULL_ORDER);
    }
    const suitDiff = a.suitKey.localeCompare(b.suitKey);
    if (suitDiff !== 0) return suitDiff;
    return cardRankIndex(a.rankKey, SUIT_ORDER) - cardRankIndex(b.rankKey, SUIT_ORDER);
  });
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

function contractValueEstimate(contract, hand) {
  if (contract.type === 'null') {
    const danger = hand.filter((card) => ['A', '10', 'K', 'Q'].includes(card.rankKey)).length;
    return Math.max(23, 23 - danger);
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
  const ranked = sortForUI(hand, contract).slice().reverse();
  return ranked.slice(0, 2).map((card) => card.id);
}

function simpleCardScore(card, contract, trick) {
  if (contract.type === 'null') {
    return cardRankIndex(card.rankKey, NULL_ORDER);
  }
  if (isTrump(card, contract)) return 50 - trumpRank(card, contract);
  if (trick.length > 0 && trick[0].card.suitKey === card.suitKey) {
    return 30 - nonTrumpRank(card, contract);
  }
  return 10 - nonTrumpRank(card, contract);
}

function aiChooseBidAction(game, seatIndex) {
  const seat = game.seats[seatIndex];
  const canStay = game.currentBid <= seat.bidCeiling;
  return canStay ? 'stay' : 'pass';
}

function aiChooseContract(game, seatIndex) {
  const hand = game.seats[seatIndex].hand;
  return bestContractForHand(hand);
}

function aiChooseDiscard(game, seatIndex) {
  return chooseDiscardCards(game.seats[seatIndex].hand, game.contract);
}

function aiChooseCard(game, seatIndex) {
  const seat = game.seats[seatIndex];
  const legal = legalCards(seat.hand, game.currentTrick, game.contract);
  const canWin = game.currentTrick.length > 0;
  const scores = legal.map((card) => ({ card, score: simpleCardScore(card, game.contract, game.currentTrick) }));
  scores.sort((a, b) => {
    if (game.contract.type === 'null') {
      return a.score - b.score;
    }
    if (canWin) return b.score - a.score;
    if (game.currentTrick.length === 0 && game.contract.type !== 'null') {
      return b.score - a.score;
    }
    return a.score - b.score;
  });
  return scores[0]?.card ?? legal[0];
}

function createGame(seed = 'SimpleSkat') {
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
    human() {
      return this.seats[0];
    },
    declarer() {
      return this.seats[this.declarerIndex];
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
    totalPoints(index) {
      return this.seats[index].trickPoints;
    },
    sidePoints(index) {
      if (this.declarerIndex === null) return 0;
      return index === this.declarerIndex
        ? this.seats[index].trickPoints
        : this.defenderIndices().reduce((sum, defenderIndex) => sum + this.seats[defenderIndex].trickPoints, 0);
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
    biddingStateText() {
      const active = [0, 1, 2].filter((index) => this.activeBidders[index]);
      return `Aktiv: ${active.map((index) => this.seatName(index)).join(', ')}`;
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
    logLine(text) {
      this.log.push(text);
    },
    setPhase(nextPhase) {
      this.phase = nextPhase;
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
        const discardIds = aiChooseDiscard(this, this.declarerIndex);
        this.discardSelection = discardIds;
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
    autoAdvance() {
      let guard = 0;
      while (guard < 200) {
        guard += 1;
        const acted = this.aiMove();
        if (!acted) break;
        if (this.phase === 'result') break;
      }
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
      if (!this.canHumanAct() || this.phase !== 'bidding') return;
      if (!this.allowedHumanBids()) return;
      this.highestBidder = 0;
      this.logLine(`Du reizt auf ${this.currentBid}.`);
      this.currentBid = nextBidValue(this.currentBid);
      this.advanceBidding();
      this.autoAdvance();
    },
    humanBidPass() {
      if (!this.canHumanAct() || this.phase !== 'bidding') return;
      this.activeBidders[0] = false;
      this.logLine('Du passt.');
      this.advanceBidding();
      this.autoAdvance();
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
      const idx = this.discardSelection.indexOf(cardId);
      if (idx >= 0) {
        this.discardSelection.splice(idx, 1);
      } else if (this.discardSelection.length < 2) {
        this.discardSelection.push(cardId);
      }
    },
    commitDiscard() {
      const declarer = this.seats[this.declarerIndex];
      if (this.discardSelection.length !== 2) return;
      const discarded = [];
      this.discardSelection.forEach((cardId) => {
        const removed = removeCardById(declarer.hand, cardId);
        if (removed) discarded.push(removed.short);
      });
      this.logLine(`${this.seatName(this.declarerIndex)} legt ${discarded.join(' und ')} ab.`);
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
      const winningPlay = trickWinner(this.currentTrick, this.contract);
      const winnerIndex = winningPlay.seatIndex;
      const trickPoints = this.currentTrick.reduce((sum, play) => sum + play.card.points, 0);
      this.seats[winnerIndex].trickPoints += trickPoints;
      this.seats[winnerIndex].tricksWon += 1;
      this.trickHistory.push({
        leader: this.currentTrick[0].seatIndex,
        winner: winnerIndex,
        points: trickPoints,
        cards: this.currentTrick.map((play) => play.card.short),
      });
      this.logLine(`${this.seatName(winnerIndex)} gewinnt den Stich mit ${trickPoints} Punkten.`);
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
    resultLabel() {
      if (!this.result) return '—';
      if (this.result.winner === 'declarer') return `${this.seatName(this.declarerIndex)} gewinnt`;
      return 'Die Gegenspieler gewinnen';
    },
    scoreLabel() {
      if (!this.result) {
        const declarerPoints = this.declarerIndex === null ? 0 : this.seats[this.declarerIndex].trickPoints;
        const defenderPoints = this.declarerIndex === null ? 0 : this.defenderIndices().reduce((sum, index) => sum + this.seats[index].trickPoints, 0);
        return `Alleinspieler ${declarerPoints} : ${defenderPoints} Gegner`;
      }
      return `Alleinspieler ${this.result.declarerPoints} : ${this.result.defenderPoints} Gegner`;
    },
  };

  game.autoAdvance();
  return game;
}

export {
  createGame,
  contractLabel,
  makeContract,
  legalCards,
  nextBidValue,
  bidCeilingForHand,
  contractValueEstimate,
  bestContractForHand,
  sortForUI,
};
