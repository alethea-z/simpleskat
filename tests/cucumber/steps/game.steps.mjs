import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { seatIndex } from '../support/browser.mjs';

function contractPatchFromSpec(spec) {
  const [type, suitKey] = String(spec).split(':');
  if (type === 'grand') return { type: 'grand', label: 'Grand', valueBase: 24 };
  if (type === 'null') return { type: 'null', label: 'Null', valueBase: 23 };
  const suitMap = {
    Clubs: { label: 'Kreuz', valueBase: 12 },
    Spades: { label: 'Pik', valueBase: 11 },
    Hearts: { label: 'Herz', valueBase: 10 },
    Diamonds: { label: 'Karo', valueBase: 9 },
  };
  return { type: 'suit', suitKey, ...suitMap[suitKey] };
}

function normalizeTable(table) {
  return table.hashes();
}

Given('a browser game is loaded', async function () {
  await this.loadGame('Cucumber');
});

Given('the dealer is {string}', async function (dealer) {
  const idx = seatIndex(dealer);
  await this.patchGame({
    dealerIndex: idx,
    currentTurnIndex: (idx + 1) % 3,
    phase: 'bidding',
    currentBid: 18,
    highestBidder: null,
    activeBidders: [true, true, true],
    result: null,
    contract: null,
    declarerIndex: null,
  });
});

Given('the current bidding seat is {string}', async function (seat) {
  await this.patchGame({ currentTurnIndex: seatIndex(seat), phase: 'bidding' });
});

Given('the bid ceilings are:', async function (table) {
  const rows = normalizeTable(table);
  await this.page.evaluate((rows) => {
    const map = Object.fromEntries(rows.map((row) => [row.seat, Number(row.ceiling)]));
    return window.__simpleSkatTest.setBidCeilings(map);
  }, rows);
  await this.patchGame({
    phase: 'bidding',
    currentBid: 18,
    highestBidder: null,
    activeBidders: [true, true, true],
  });
});

When('the browser advances the bidding', async function () {
  await this.advanceGame();
});

When('the human bids once', async function () {
  await this.page.locator('#controls button[data-action="bid"]').click();
});

When('the human passes', async function () {
  await this.page.locator('#controls button[data-action="pass"]').click();
});

Then('the declarer is {string}', async function (dealer) {
  const snapshot = await this.snapshot();
  assert.equal(snapshot.declarerIndex, seatIndex(dealer));
});

Then('the phase is {string}', async function (phaseLabel) {
  const snapshot = await this.snapshot();
  assert.equal(snapshot.phaseLabel, phaseLabel);
});

Given('the declarer seat is {string}', async function (declarer) {
  const idx = seatIndex(declarer);
  await this.patchGame({
    declarerIndex: idx,
    currentTurnIndex: idx,
    contract: null,
    result: null,
  });
});

Given('the game phase is {string}', async function (phaseLabel) {
  const phaseMap = {
    'Spieltyp wählen': 'contract',
    'Skat aufnehmen / ablegen': 'skat',
    'Ergebnis': 'result',
    'Reizen': 'bidding',
    'Spiel': 'play',
  };
  await this.patchGame({ phase: phaseMap[phaseLabel] || phaseLabel });
});

Given('the result screen is prepared for the declarer {string}', async function (declarer) {
  const idx = seatIndex(declarer);
  await this.patchGame({
    declarerIndex: idx,
    phase: 'result',
    contract: { type: 'suit', label: 'Herz', suitKey: 'Hearts', valueBase: 10 },
    result: {
      declarerPoints: 0,
      defenderPoints: 0,
      declarerTricks: 0,
      winner: 'defenders',
    },
  });
});

When('the declarer chooses the contract {string}', async function (spec) {
  const contract = contractPatchFromSpec(spec);
  const target = contract.type === 'suit'
    ? `button[data-contract="suit"][data-suit="${contract.suitKey}"]`
    : `button[data-contract="${contract.type}"]`;
  await this.page.locator(target).click();
});

Then('the contract label is {string}', async function (expected) {
  const text = await this.page.locator('#contractLabel').textContent();
  assert.equal(text, expected);
});

Then('the contract label contains {string}', async function (expected) {
  const text = await this.page.locator('#contractLabel').textContent();
  assert.match(text || '', new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

Then('the score label is {string}', async function (expected) {
  const text = await this.page.locator('#scoreLabel').textContent();
  assert.equal(text, expected);
});

Given('the declarer has {int} eyes and the defenders have {int} eyes', async function (declarerPoints, defenderPoints) {
  const snapshot = await this.snapshot();
  const declarer = snapshot.declarerIndex ?? 0;
  const defenders = [0, 1, 2].filter((index) => index !== declarer);
  const perDefender = Math.floor(defenderPoints / defenders.length);
  const remainder = defenderPoints - perDefender * defenders.length;
  await this.page.evaluate(({ declarerPoints, defenderPoints, declarer, defenders, perDefender, remainder }) => {
    window.__simpleSkatTest.setTrickPoints({
      'Du': declarer === 0 ? declarerPoints : perDefender + (defenders[0] === 0 ? remainder : 0),
      'KI links': declarer === 1 ? declarerPoints : perDefender + (defenders[0] === 1 ? remainder : 0),
      'KI rechts': declarer === 2 ? declarerPoints : perDefender + (defenders[0] === 2 ? remainder : 0),
    });
    window.__simpleSkatTest.setResult({
      declarerPoints,
      defenderPoints,
      declarerTricks: 0,
      winner: declarerPoints >= 61 ? 'declarer' : 'defenders',
    });
    window.__simpleSkatTest.patch({ phase: 'result' });
  }, { declarerPoints, defenderPoints, declarer, defenders, perDefender, remainder });
});

When('the result screen is shown', async function () {
  await this.patchGame({ phase: 'result' });
});

Then('the result tier label is {string}', async function (expected) {
  const snapshot = await this.snapshot();
  assert.equal(snapshot.resultTierLabel, expected);
});
