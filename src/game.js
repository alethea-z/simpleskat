const SUITS = [
  { name: 'Clubs', short: '♣' },
  { name: 'Spades', short: '♠' },
  { name: 'Hearts', short: '♥' },
  { name: 'Diamonds', short: '♦' },
];

const RANKS = [
  { name: 'A', points: 11 },
  { name: '10', points: 10 },
  { name: 'K', points: 4 },
  { name: 'Q', points: 3 },
  { name: 'J', points: 2 },
  { name: '9', points: 0 },
  { name: '8', points: 0 },
  { name: '7', points: 0 },
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
    suit: suit.name,
    suitShort: suit.short,
    rank: rank.name,
    points: rank.points,
    short: `${rank.name}${suit.short}`,
  })));
}

function seatTemplate(id, label, role, ai) {
  return { id, label, role, ai, hand: [] };
}

function createGame(seed = 'SimpleSkat') {
  const rng = mulberry32(hashSeed(seed));
  const deck = shuffle(createDeck(), rng);

  const seats = [
    seatTemplate('human', 'Du', 'Spieler', 'none'),
    seatTemplate('left-ai', 'KI links', 'Gegner', 'simple'),
    seatTemplate('right-ai', 'KI rechts', 'Gegner', 'simple'),
  ];

  const dealerIndex = 0;
  const gameNo = 1;
  const currentTurnIndex = (dealerIndex + 1) % 3;

  // Simple static deal scaffold for now: 10 cards each, 2 in skat.
  // Full phase logic will refine bidding, taking the skat, and trick play.
  seats[0].hand = deck.slice(0, 10);
  seats[1].hand = deck.slice(10, 20);
  seats[2].hand = deck.slice(20, 30);
  const skat = deck.slice(30, 32);

  return {
    gameNo,
    dealerIndex,
    currentTurnIndex,
    phase: 'deal',
    contract: null,
    skat,
    seats,
    log: [
      'Neues Spiel gestartet.',
      'Karten deterministisch gemischt und verteilt.',
      'Nächster Schritt: Biet- und Spielphasen implementieren.',
    ],
    seatName(index) {
      return this.seats[index]?.label ?? 'Unbekannt';
    },
    get human() {
      return this.seats[0];
    },
    phaseLabel() {
      return 'Austeilen';
    },
    contractLabel() {
      return this.contract ?? 'Noch kein Spieltyp gewählt';
    },
    nextGame() {
      const next = createGame(`SimpleSkat-${this.gameNo + 1}`);
      next.dealerIndex = (this.dealerIndex + 1) % 3;
      next.currentTurnIndex = (next.dealerIndex + 1) % 3;
      next.gameNo = this.gameNo + 1;
      next.log.unshift(`Dealer rolliert nach links auf ${next.seatName(next.dealerIndex)}.`);
      return next;
    },
  };
}

export { createGame };
