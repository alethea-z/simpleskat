import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createDeck,
  createGame,
  determineTrickWinner,
  makeContract,
  sortForUI,
  sumCardPoints,
  legalCards,
  nextBidValue,
} from '../src/game.js';

function shortList(cards) {
  return cards.map((card) => card.short);
}

test('Given a suit contract, when a hand is sorted, then trumps lead the hand and groups stay ordered', () => {
  const contract = makeContract('suit', 'Hearts');
  const hand = [
    { short: '7♦', suitKey: 'Diamonds', rankKey: '7' },
    { short: 'B♠', suitKey: 'Spades', rankKey: 'J' },
    { short: 'A♥', suitKey: 'Hearts', rankKey: 'A' },
    { short: '10♣', suitKey: 'Clubs', rankKey: '10' },
    { short: 'B♣', suitKey: 'Clubs', rankKey: 'J' },
    { short: 'K♥', suitKey: 'Hearts', rankKey: 'K' },
  ];

  assert.deepEqual(shortList(sortForUI(hand, contract)), ['B♣', 'B♠', 'A♥', 'K♥', '10♣', '7♦']);
});

test('Given a Grand trick, when two jacks and a suit card are played, then the highest trump wins', () => {
  const contract = makeContract('grand');
  const trick = [
    { seatIndex: 1, card: { short: '10♣', suitKey: 'Clubs', rankKey: '10' } },
    { seatIndex: 2, card: { short: 'B♥', suitKey: 'Hearts', rankKey: 'J' } },
    { seatIndex: 0, card: { short: 'B♣', suitKey: 'Clubs', rankKey: 'J' } },
  ];

  assert.equal(determineTrickWinner(trick, contract).seatIndex, 0);
});

test('Given a Null trick, when the lead suit is followed, then the highest Null rank wins', () => {
  const contract = makeContract('null');
  const trick = [
    { seatIndex: 1, card: { short: 'A♦', suitKey: 'Diamonds', rankKey: 'A' } },
    { seatIndex: 2, card: { short: 'K♦', suitKey: 'Diamonds', rankKey: 'K' } },
    { seatIndex: 0, card: { short: '10♦', suitKey: 'Diamonds', rankKey: '10' } },
  ];

  assert.equal(determineTrickWinner(trick, contract).seatIndex, 1);
});

test('Given the full deck, when points are added up, then the deck contains exactly 120 eyes', () => {
  assert.equal(sumCardPoints(createDeck()), 120);
});

test('Given an initial deal, when cards are redistributed, then all dealt eyes are still accounted for', () => {
  const game = createGame('UnitTestSeed');
  const dealt = sumCardPoints(game.seats.flatMap((seat) => seat.hand)) + sumCardPoints(game.skat);
  assert.equal(dealt, 120);
});

test('Given a legal move requirement, when a suit can be followed, then only that suit is legal', () => {
  const contract = makeContract('suit', 'Hearts');
  const trick = [{ seatIndex: 1, card: { short: '10♣', suitKey: 'Clubs', rankKey: '10' } }];
  const hand = [
    { short: 'A♣', suitKey: 'Clubs', rankKey: 'A' },
    { short: '7♠', suitKey: 'Spades', rankKey: '7' },
    { short: 'B♥', suitKey: 'Hearts', rankKey: 'J' },
  ];

  assert.deepEqual(shortList(legalCards(hand, trick, contract)), ['A♣']);
});

test('Given the bid ladder is advanced, when the last step is reached, then the next bid caps at 240', () => {
  assert.equal(nextBidValue(216), 240);
  assert.equal(nextBidValue(240), 240);
});

test('Given a fresh game, when a next game is created, then the dealer rotates left and the round advances', () => {
  const game = createGame('RotateSeed');
  const next = game.nextGame();

  assert.equal(next.gameNo, game.gameNo + 1);
  assert.equal(next.dealerIndex, 1);
  assert.equal(next.seatName(next.dealerIndex), 'KI links');
});

test('Given a fresh game, when the point audit runs, then every eye is still accounted for', () => {
  const game = createGame('AuditSeed');
  assert.equal(game.pointAudit().dealtPoints, 120);
});

test('Given a Null trick, when the lead suit can be followed, then only that suit is legal', () => {
  const contract = makeContract('null');
  const trick = [{ seatIndex: 1, card: { short: 'A♦', suitKey: 'Diamonds', rankKey: 'A' } }];
  const hand = [
    { short: 'A♦', suitKey: 'Diamonds', rankKey: 'A' },
    { short: 'K♦', suitKey: 'Diamonds', rankKey: 'K' },
    { short: '7♠', suitKey: 'Spades', rankKey: '7' },
  ];

  assert.deepEqual(shortList(legalCards(hand, trick, contract)), ['A♦', 'K♦']);
});

test('Given a suit trick with trump led, when a trump exists in hand, then only trumps are legal', () => {
  const contract = makeContract('suit', 'Hearts');
  const trick = [{ seatIndex: 1, card: { short: 'B♥', suitKey: 'Hearts', rankKey: 'J' } }];
  const hand = [
    { short: 'A♣', suitKey: 'Clubs', rankKey: 'A' },
    { short: 'B♠', suitKey: 'Spades', rankKey: 'J' },
    { short: '7♦', suitKey: 'Diamonds', rankKey: '7' },
  ];

  assert.deepEqual(shortList(legalCards(hand, trick, contract)), ['B♠']);
});
