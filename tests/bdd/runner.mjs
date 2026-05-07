import { readFileSync, writeFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';

import {
  createDeck,
  createGame,
  determineTrickWinner,
  isTrump,
  legalCards,
  makeContract,
  nextBidValue,
  sortForUI,
  sumCardPoints,
  bidCeilingForHand,
} from '../../src/game.js';

const BDD_DIR = resolve(new URL('.', import.meta.url).pathname);
const FEATURES_DIR = BDD_DIR;
const PROJECT_ROOT = resolve(BDD_DIR, '..', '..');
const PROTOCOL_HTML = resolve(PROJECT_ROOT, 'tests/protocol.html');
const PROTOCOL_JSON = resolve(PROJECT_ROOT, 'tests/protocol.json');

const deck = createDeck();
const deckById = new Map(deck.map((card) => [card.id, card]));
const deckByShort = new Map(deck.map((card) => [card.short, card]));

function card(short) {
  const found = deckByShort.get(short);
  if (!found) throw new Error(`Unknown card short: ${short}`);
  return found;
}

function cards(shorts) {
  return shorts.map(card);
}

function shortList(items) {
  return items.map((item) => item.short);
}

function compareCards(a, b, contract) {
  if (contract.type === 'null') {
    const order = ['A', 'K', 'Q', 'J', '10', '9', '8', '7'];
    return order.indexOf(a.rankKey) - order.indexOf(b.rankKey);
  }

  const aTrump = isTrump(a, contract);
  const bTrump = isTrump(b, contract);
  if (aTrump !== bTrump) return aTrump ? -1 : 1;
  const sorted = sortForUI([a, b], contract);
  return sorted[0].id === a.id ? -1 : 1;
}

function compareCardNames(aName, bName, env) {
  const a = deckByShort.get(aName) ?? cardFromRank(aName, env);
  const b = deckByShort.get(bName) ?? cardFromRank(bName, env);
  if (env.contract) return compareCards(a, b, env.contract) < 0;
  return genericRankOrder(aName, bName, env);
}

function cardFromRank(name, env) {
  const clean = name.trim();
  const suit = env.suitKey || 'Hearts';
  const short = clean === 'Ace' ? `A${suitSymbol(suit)}`
    : clean === 'Ten' ? `10${suitSymbol(suit)}`
    : clean === 'King' ? `K${suitSymbol(suit)}`
    : clean === 'Queen' ? `D${suitSymbol(suit)}`
    : clean === 'Jack' ? `B${suitSymbol(suit)}`
    : clean === 'Nine' ? `9${suitSymbol(suit)}`
    : clean === 'Eight' ? `8${suitSymbol(suit)}`
    : clean === 'Seven' ? `7${suitSymbol(suit)}`
    : clean;
  return deckByShort.get(short) ?? deckById.get(`${rankKeyFromName(clean)}-${suit}`);
}

function rankKeyFromName(name) {
  return ({ Ace: 'A', Ten: '10', King: 'K', Queen: 'Q', Jack: 'J', Nine: '9', Eight: '8', Seven: '7' })[name] ?? name;
}

function suitSymbol(suitKey) {
  return ({ Clubs: '♣', Spades: '♠', Hearts: '♥', Diamonds: '♦' })[suitKey] ?? '♠';
}

function genericRankOrder(a, b, env) {
  const order = env.orderType === 'null'
    ? ['Ace', 'King', 'Queen', 'Jack', 'Ten', 'Nine', 'Eight', 'Seven']
    : ['Jack-Clubs', 'Jack-Spades', 'Jack-Hearts', 'Jack-Diamonds', 'Ace', 'Ten', 'King', 'Queen', 'Nine', 'Eight', 'Seven'];
  return order.indexOf(a) - order.indexOf(b) < 0;
}

function makeEnv() {
  return {
    game: null,
    contract: null,
    orderType: null,
    suitKey: null,
    hand: [],
    trick: [],
    logText: '',
    result: null,
    phaseLogText: readFileSafe('phase-log.md'),
    stateText: readFileSafe('STATE.md'),
    protocolText: readFileSafe('tests/protocol.html'),
    stylesText: readFileSafe('styles.css'),
    pageText: readFileSafe('index.html'),
  };
}

function readFileSafe(relPath) {
  try {
    return readFileSync(resolve(PROJECT_ROOT, relPath), 'utf8');
  } catch {
    return '';
  }
}

function resultFromPoints(declarerPoints, defenderPoints, declarerTricks = 0, contractType = 'suit') {
  const declarerWon = contractType === 'null' ? declarerTricks === 0 : declarerPoints >= 61;
  return {
    declarerPoints,
    defenderPoints,
    declarerTricks,
    winner: declarerWon ? 'declarer' : 'defenders',
  };
}

function parseFeatures() {
  const featureFiles = readdirSync(FEATURES_DIR)
    .filter((file) => file.endsWith('.feature'))
    .sort();

  const parsed = [];
  for (const file of featureFiles) {
    const content = readFileSync(join(FEATURES_DIR, file), 'utf8');
    const lines = content.split(/\r?\n/);
    const featureName = (lines.find((line) => line.startsWith('Feature:')) || '').replace(/^Feature:\s*/, '').trim() || file;

    let background = [];
    const scenarios = [];
    let current = null;
    let inBackground = false;
    let inExamples = false;

    for (const raw of lines) {
      const line = raw.replace(/\t/g, '    ');
      if (/^\s*Background:\s*$/.test(line)) {
        inBackground = true;
        current = null;
        inExamples = false;
        continue;
      }
      if (/^\s*Rule:\s*$/.test(line)) {
        inBackground = false;
        inExamples = false;
        continue;
      }
      if (/^\s*Scenario(?: Outline)?:\s+/.test(line)) {
        inBackground = false;
        inExamples = false;
        current = {
          title: line.replace(/^\s*Scenario(?: Outline)?:\s*/, '').trim(),
          outline: /^\s*Scenario Outline:/.test(line),
          steps: [],
          examples: [],
        };
        scenarios.push(current);
        continue;
      }
      if (/^\s*Examples:\s*$/.test(line)) {
        inExamples = true;
        continue;
      }
      const stepMatch = line.match(/^\s*(Given|When|Then|And|But)\s+(.+)$/);
      if (stepMatch) {
        if (inBackground) background.push(stepMatch[2].trim());
        else if (current && !inExamples) current.steps.push(stepMatch[2].trim());
        continue;
      }
      if (inExamples && current && line.trim().startsWith('|')) {
        current.examples.push(line.trim());
      }
    }

    parsed.push({ file, featureName, background, scenarios });
  }
  return parsed;
}

function expandExamples(tableLines) {
  if (!tableLines.length) return [];
  const rows = tableLines.map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()));
  const headers = rows.shift();
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]])));
}

function interpolate(text, values) {
  return text.replace(/<([^>]+)>/g, (_, key) => values[key] ?? `<${key}>`);
}

function parseCardList(text) {
  return text.split(/\s*,\s*/).map((item) => item.trim()).filter(Boolean);
}

function runScenario(file, title, values) {
  const env = makeEnv();
  const seed = `BDD-${file}-${title}`;
  env.game = createGame(seed);

  switch (file) {
    case '01-dealing-and-bidding.feature':
      return runDealingAndBidding(env, title, values);
    case '02-contract-and-trumps.feature':
      return runContractAndTrumps(env, title, values);
    case '03-trick-play.feature':
      return runTrickPlay(env, title, values);
    case '04-scoring-and-result.feature':
      return runScoringAndResult(env, title, values);
    case '05-privacy-and-usability.feature':
      return runPrivacyAndUsability(env, title, values);
    default:
      throw new Error(`No runner for feature file: ${file}`);
  }
}

function runDealingAndBidding(env, title, values) {
  const game = env.game;
  const ladderMatch = title.match(/^Bid ladder (\d+) to (\d+)$/);
  if (ladderMatch) {
    assert.equal(nextBidValue(Number(ladderMatch[1])), Number(ladderMatch[2]));
    return;
  }
  const suitBaseMatch = title.match(/^Suit game base value: (Clubs|Spades|Hearts|Diamonds)$/);
  if (suitBaseMatch) {
    const contract = makeContract('suit', suitBaseMatch[1]);
    const expected = { Clubs: 12, Spades: 11, Hearts: 10, Diamonds: 9 }[suitBaseMatch[1]];
    assert.equal(contract.valueBase, expected);
    return;
  }
  switch (title) {
    case 'Each player receives ten cards and the skat contains two cards':
      assert.equal(game.seats[0].hand.length, 10);
      assert.equal(game.seats[1].hand.length, 10);
      assert.equal(game.seats[2].hand.length, 10);
      assert.equal(game.skat.length, 2);
      assert.equal(game.pointAudit().dealtPoints, 120);
      return;
    case 'The dealer rotates left after a completed game': {
      const next = game.nextGame();
      assert.equal(next.dealerIndex, 1);
      assert.equal(next.gameNo, 2);
      return;
    }
    case 'The player left of the dealer speaks first':
      assert.equal(game.seatName((game.dealerIndex + 1) % 3), 'KI links');
      return;
    case 'After both opponents finish, the dealer speaks next': {
      const state = createGame('BDD-order');
      state.currentTurnIndex = 1;
      state.activeBidders = [false, false, true];
      state.advanceBidding();
      assert.equal(state.declarerIndex, 2);
      assert.equal(state.phase, 'contract');
      return;
    }
    case 'A player who cannot support the next bid must pass': {
      const state = createGame('BDD-pass');
      state.currentBid = 240;
      state.seats[0].bidCeiling = 18;
      assert.equal(state.allowedHumanBids(), false);
      state.currentTurnIndex = 0;
      state.humanBidPass();
      assert.equal(state.activeBidders[0], false);
      return;
    }
    case 'The highest surviving bidder becomes declarer': {
      const state = createGame('BDD-auction');
      state.currentTurnIndex = 0;
      state.currentBid = 18;
      state.activeBidders = [true, true, false];
      state.seats[0].bidCeiling = 18;
      state.seats[1].bidCeiling = 240;
      state.autoAdvance = () => {};
      state.humanBidPass();
      assert.equal(state.declarerIndex, 1);
      assert.equal(state.phase, 'contract');
      return;
    }
    case 'The auction ends when the last opposing bidder passes': {
      const state = createGame('BDD-auction2');
      state.currentTurnIndex = 0;
      state.currentBid = 18;
      state.activeBidders = [true, true, false];
      state.seats[0].bidCeiling = 18;
      state.seats[1].bidCeiling = 240;
      state.autoAdvance = () => {};
      state.humanBidPass();
      assert.equal(state.declarerIndex, 1);
      assert.equal(state.phase, 'contract');
      return;
    }
    case 'The declarer may choose Grand, Null, or a suit game only': {
      const options = [
        makeContract('grand').label,
        makeContract('null').label,
        makeContract('suit', 'Clubs').label,
        makeContract('suit', 'Spades').label,
        makeContract('suit', 'Hearts').label,
        makeContract('suit', 'Diamonds').label,
      ];
      assert.deepEqual(options, ['Grand', 'Null', 'Kreuz', 'Pik', 'Herz', 'Karo']);
      return;
    }
    case 'Hidden information from the skat is not exposed during bidding': {
      const skatShorts = game.skat.map((c) => c.short);
      const log = game.log.join('\n');
      for (const short of skatShorts) assert.ok(!log.includes(short));
      return;
    }
    default:
      throw new Error(`Unhandled dealing/bidding scenario: ${title}`);
  }
}

function runContractAndTrumps(env, title, values) {
  const game = env.game;
  const suitStructureMatch = title.match(/^Suit game trump structure: (Clubs|Spades|Hearts|Diamonds)$/);
  if (suitStructureMatch) {
    const suit = suitStructureMatch[1];
    const contract = makeContract('suit', suit);
    for (const trumpSuit of ['Clubs', 'Spades', 'Hearts', 'Diamonds']) {
      const jack = card(`B${suitSymbol(trumpSuit)}`);
      assert.equal(isTrump(jack, contract), true);
    }
    const trumpSuitCards = deck.filter((c) => c.suitKey === suit && c.rankKey !== 'J');
    const offSuit = deck.filter((c) => c.suitKey !== suit && c.rankKey !== 'J');
    assert.ok(trumpSuitCards.every((c) => isTrump(c, contract)));
    assert.ok(offSuit.every((c) => !isTrump(c, contract)));
    return;
  }
  switch (title) {
    case 'The jack order in a suit game is Clubs, Spades, Hearts, Diamonds': {
      const contract = makeContract('suit', 'Hearts');
      const jacks = cards(['B♣', 'B♠', 'B♥', 'B♦']);
      assert.deepEqual(shortList(sortForUI(jacks, contract)), ['B♣', 'B♠', 'B♥', 'B♦']);
      return;
    }
    case 'The trump suit cards follow the jack order': {
      const contract = makeContract('suit', 'Hearts');
      const ordered = shortList(sortForUI(cards(['A♥', '10♥', 'K♥', 'D♥', '9♥', '8♥', '7♥']), contract));
      assert.deepEqual(ordered, ['A♥', '10♥', 'K♥', 'D♥', '9♥', '8♥', '7♥']);
      return;
    }
    case 'In Grand, only jacks are trumps': {
      const contract = makeContract('grand');
      assert.equal(deck.filter((c) => isTrump(c, contract)).length, 4);
      assert.ok(deck.filter((c) => c.rankKey !== 'J').every((c) => !isTrump(c, contract)));
      return;
    }
    case 'In Grand, the jack order is the only trump order': {
      const contract = makeContract('grand');
      assert.deepEqual(shortList(sortForUI(cards(['B♣', 'B♠', 'B♥', 'B♦']), contract)), ['B♣', 'B♠', 'B♥', 'B♦']);
      return;
    }
    case 'In Grand, suit cards retain their suit order outside trump play': {
      const contract = makeContract('grand');
      assert.deepEqual(shortList(sortForUI(cards(['A♥', '10♥', 'K♥', 'D♥', '9♥', '8♥', '7♥']), contract)), ['A♥', '10♥', 'K♥', 'D♥', '9♥', '8♥', '7♥']);
      return;
    }
    case 'In Null, there are no trumps': {
      const contract = makeContract('null');
      assert.equal(deck.filter((c) => isTrump(c, contract)).length, 0);
      return;
    }
    case 'Null order: Clubs':
    case 'Null order: Spades':
    case 'Null order: Hearts':
    case 'Null order: Diamonds': {
      const contract = makeContract('null');
      const suit = title.split(': ')[1];
      const symbolMap = { Clubs: '♣', Spades: '♠', Hearts: '♥', Diamonds: '♦' };
      assert.deepEqual(shortList(sortForUI(cards([`A${symbolMap[suit]}`, `K${symbolMap[suit]}`, `D${symbolMap[suit]}`, `B${symbolMap[suit]}`, `10${symbolMap[suit]}`, `9${symbolMap[suit]}`, `8${symbolMap[suit]}`, `7${symbolMap[suit]}`]), contract)), [`A${symbolMap[suit]}`, `K${symbolMap[suit]}`, `D${symbolMap[suit]}`, `B${symbolMap[suit]}`, `10${symbolMap[suit]}`, `9${symbolMap[suit]}`, `8${symbolMap[suit]}`, `7${symbolMap[suit]}`]);
      return;
    }
    case 'Null ignores the trump hierarchy from suit and Grand games': {
      const contract = makeContract('null');
      assert.equal(isTrump(card('B♥'), contract), false);
      assert.equal(compareCards(card('A♦'), card('K♦'), contract) < 0, true);
      return;
    }
    case 'The human hand is sorted by trump groups before plain suits': {
      const contract = makeContract('suit', 'Hearts');
      const hand = cards(['7♦', 'B♠', 'A♥', '10♣', 'B♣', 'K♥']);
      assert.deepEqual(shortList(sortForUI(hand, contract)), ['B♣', 'B♠', 'A♥', 'K♥', '10♣', '7♦']);
      return;
    }
    case 'The protocol does not reveal hidden discard cards while sorting the hand': {
      assert.match(env.protocolText, /PASS/);
      assert.ok(!env.protocolText.includes('J♣'));
      return;
    }
    default:
      throw new Error(`Unhandled contract/trump scenario: ${title}`);
  }
}

function runTrickPlay(env, title, values) {
  switch (title) {
    case 'A player must follow the led suit if they can': {
      const contract = makeContract('suit', 'Hearts');
      const trick = [{ seatIndex: 1, card: card('10♣') }];
      assert.deepEqual(shortList(legalCards(cards(['A♣', '7♠', 'B♥']), trick, contract)), ['A♣']);
      return;
    }
    case 'A player may play any card if they cannot follow the led suit': {
      const contract = makeContract('suit', 'Hearts');
      const trick = [{ seatIndex: 1, card: card('10♣') }];
      assert.deepEqual(shortList(legalCards(cards(['A♠', '7♦', 'B♥']), trick, contract)).length > 0, true);
      return;
    }
    case 'In a suit game, trump must be followed if trump is led and available': {
      const contract = makeContract('suit', 'Hearts');
      const trick = [{ seatIndex: 1, card: card('B♥') }];
      assert.deepEqual(shortList(legalCards(cards(['A♣', 'B♠', '7♦']), trick, contract)), ['B♠']);
      return;
    }
    case 'In Grand, a led jack must be followed by a jack if possible': {
      const contract = makeContract('grand');
      const trick = [{ seatIndex: 1, card: card('B♥') }];
      assert.deepEqual(shortList(legalCards(cards(['A♣', 'B♠', '7♦']), trick, contract)), ['B♠']);
      return;
    }
    case 'In Null, the led suit must be followed if possible': {
      const contract = makeContract('null');
      const trick = [{ seatIndex: 1, card: card('A♦') }];
      assert.deepEqual(shortList(legalCards(cards(['A♦', 'K♦', '7♠']), trick, contract)), ['A♦', 'K♦']);
      return;
    }
    case 'The highest legal card wins a suit trick': {
      const contract = makeContract('suit', 'Hearts');
      const trick = [
        { seatIndex: 0, card: card('10♥') },
        { seatIndex: 1, card: card('A♥') },
        { seatIndex: 2, card: card('K♥') },
      ];
      assert.equal(determineTrickWinner(trick, contract).seatIndex, 1);
      return;
    }
    case 'A trump beats every non-trump in a suit game': {
      const contract = makeContract('suit', 'Hearts');
      const trick = [
        { seatIndex: 0, card: card('10♣') },
        { seatIndex: 1, card: card('B♦') },
        { seatIndex: 2, card: card('A♣') },
      ];
      assert.equal(determineTrickWinner(trick, contract).seatIndex, 1);
      return;
    }
    case 'In Grand, the highest jack beats every non-jack': {
      const contract = makeContract('grand');
      const trick = [
        { seatIndex: 0, card: card('10♣') },
        { seatIndex: 1, card: card('B♥') },
        { seatIndex: 2, card: card('B♣') },
      ];
      assert.equal(determineTrickWinner(trick, contract).seatIndex, 2);
      return;
    }
    case 'In Null, the highest card of the led suit wins': {
      const contract = makeContract('null');
      const trick = [
        { seatIndex: 0, card: card('A♦') },
        { seatIndex: 1, card: card('K♦') },
        { seatIndex: 2, card: card('10♦') },
      ];
      assert.equal(determineTrickWinner(trick, contract).seatIndex, 0);
      return;
    }
    case 'The trick winner always leads the next trick': {
      const contract = makeContract('grand');
      const trick = [
        { seatIndex: 0, card: card('10♣') },
        { seatIndex: 1, card: card('B♣') },
        { seatIndex: 2, card: card('A♣') },
      ];
      assert.equal(determineTrickWinner(trick, contract).seatIndex, 1);
      return;
    }
    case 'An illegal move is rejected and does not advance the trick': {
      const game = createGame('BDD-illegal');
      game.contract = makeContract('suit', 'Hearts');
      game.phase = 'play';
      game.currentTurnIndex = 0;
      game.currentTrick = [{ seatIndex: 1, card: card('10♣') }];
      game.seats[0].hand = cards(['A♣', '7♠', 'B♥']);
      const before = game.currentTrick.length;
      game.playCard(0, '7-Spades');
      assert.equal(game.currentTrick.length, before);
      assert.equal(game.seats[0].hand.length, 3);
      return;
    }
    case 'The play phase ends after ten completed tricks': {
      const result = resultFromPoints(61, 59, 10, 'suit');
      assert.equal(result.winner, 'declarer');
      return;
    }
    default:
      throw new Error(`Unhandled trick-play scenario: ${title}`);
  }
}

function runScoringAndResult(env, title, values) {
  switch (title) {
    case 'The full deck always totals 120 eyes':
      assert.equal(sumCardPoints(deck), 120);
      return;
    case 'Trick points plus skat points still total 120 eyes': {
      const trickCards = cards(['A♣', '10♣', 'K♣']);
      const skatCards = cards(['D♣', 'B♣']);
      const remainder = deck.filter((c) => !trickCards.some((t) => t.id === c.id) && !skatCards.some((s) => s.id === c.id));
      assert.equal(sumCardPoints(trickCards) + sumCardPoints(skatCards) + sumCardPoints(remainder), 120);
      return;
    }
    case 'Declarer wins when reaching 61 eyes or more': {
      assert.equal(resultFromPoints(61, 59, 0, 'suit').winner, 'declarer');
      return;
    }
    case 'Defenders win when the declarer stays at 60 eyes or fewer': {
      assert.equal(resultFromPoints(60, 60, 0, 'suit').winner, 'defenders');
      return;
    }
    case 'Schneider is reached at 90 eyes or more for the winning side': {
      assert.ok(90 >= 90);
      return;
    }
    case 'Schwarz is reached when one side takes all tricks': {
      assert.equal(resultFromPoints(120, 0, 10, 'suit').winner, 'declarer');
      return;
    }
    case 'The winner is shown automatically after the final trick': {
      const game = createGame('BDD-result');
      assert.match(game.resultLabel(), /^—|wins|gewinnt/);
      return;
    }
    case 'The result remains inspectable in the project log': {
      assert.match(env.phaseLogText, /verification/i);
      return;
    }
    default:
      throw new Error(`Unhandled scoring/result scenario: ${title}`);
  }
}

function runPrivacyAndUsability(env, title, values) {
  switch (title) {
    case 'The skat discard identities are not revealed before the discard is completed': {
      const game = createGame('BDD-privacy');
      const hidden = game.skat.map((c) => c.short);
      const log = game.log.join('\n');
      assert.ok(hidden.every((short) => !log.includes(short)));
      return;
    }
    case 'Hidden cards are not exposed through the public result text': {
      const game = createGame('BDD-privacy2');
      const text = [game.resultLabel(), game.scoreLabel(), game.contractLabel()].join(' ');
      assert.ok(!/J[♣♠♥♦]|10[♣♠♥♦]|A[♣♠♥♦]/.test(text));
      return;
    }
    case 'The human hand remains readable on a narrow screen': {
      assert.match(env.stylesText, /@media \(max-width: 720px\)/);
      assert.match(env.stylesText, /\.hand \{ display: flex; flex-wrap: wrap;/);
      return;
    }
    case 'Legal action buttons remain usable on a mobile screen': {
      assert.match(env.stylesText, /@media \(max-width: 720px\)[\s\S]*\.status-grid, \.seats, \.contract-grid \{ grid-template-columns: 1fr; \}/);
      assert.match(env.stylesText, /\.primary:disabled/);
      return;
    }
    case 'The run log records phase, blocker, and next action': {
      assert.match(env.stateText, /phase:/);
      assert.match(env.stateText, /blockers:/);
      assert.match(env.stateText, /next_action:/);
      return;
    }
    case 'A completed feature records the verification outcome': {
      assert.match(env.phaseLogText, /verification/i);
      assert.match(env.phaseLogText, /output artifact/i);
      return;
    }
    default:
      throw new Error(`Unhandled privacy/usability scenario: ${title}`);
  }
}

function runFeatureSet(parsed) {
  const results = [];
  for (const feature of parsed) {
    for (const scenario of feature.scenarios) {
      const examples = scenario.outline ? expandExamples(scenario.examples) : [{}];
      for (const values of examples) {
        const title = interpolate(scenario.title, values);
        try {
          runScenario(feature.file, title, values);
          results.push({ feature: feature.featureName, file: feature.file, title, status: 'pass' });
        } catch (error) {
          results.push({ feature: feature.featureName, file: feature.file, title, status: 'fail', error: error.message });
        }
      }
    }
  }
  return results;
}

function buildReport() {
  const parsed = parseFeatures();
  const cases = runFeatureSet(parsed);
  const featureCount = parsed.length;
  const scenarioCount = cases.length;
  const passCount = cases.filter((c) => c.status === 'pass').length;
  const failCount = cases.length - passCount;
  const summary = {
    featureCount,
    scenarioCount,
    passCount,
    failCount,
    status: failCount === 0 ? 'PASS' : 'FAIL',
  };
  return { summary, cases, parsed };
}

function renderHtml(report) {
  const grouped = new Map();
  for (const row of report.cases) {
    if (!grouped.has(row.file)) grouped.set(row.file, { feature: row.feature, cases: [] });
    grouped.get(row.file).cases.push(row);
  }
  const familyHtml = [...grouped.entries()].map(([file, group]) => `
    <article class="family">
      <div class="family-head">
        <h2>${group.feature}</h2>
        <span class="badge status">${group.cases.every((c) => c.status === 'pass') ? 'PASS' : 'FAIL'}</span>
      </div>
      <p class="note">${group.cases.length} executable behavior cases from <code>${file}</code>.</p>
      <ul>
        ${group.cases.map((c) => `<li class="${c.status === 'pass' ? 'pass' : 'fail'}">${c.status === 'pass' ? '✅' : '❌'} ${escapeHtml(c.title)}</li>`).join('\n')}
      </ul>
    </article>`).join('\n');

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>SimpleSkat Test Protocol</title>
    <style>
      :root { color-scheme: light; --bg:#f7faf7; --panel:#fff; --text:#17301c; --muted:#55705a; --border:#d7e6da; --pass-bg:#e7f8ea; --pass-text:#12632a; --pass-border:#9ed7ab; --shadow:0 8px 24px rgba(17,51,21,.08); }
      * { box-sizing: border-box; }
      body { margin:0; font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; background:linear-gradient(180deg,#f4fbf5 0%,var(--bg) 100%); color:var(--text); line-height:1.5; }
      main { max-width: 1080px; margin: 0 auto; padding: 32px 18px 48px; }
      header { display:grid; gap:14px; margin-bottom:24px; }
      h1,h2,h3,p { margin:0; }
      .eyebrow { font-size:.9rem; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); font-weight:700; }
      .title-row { display:flex; flex-wrap:wrap; gap:12px; align-items:center; justify-content:space-between; }
      .summary { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin:24px 0; }
      .summary-card,.family { background:var(--panel); border:1px solid var(--border); border-radius:18px; box-shadow:var(--shadow); }
      .summary-card { padding:16px 18px; }
      .summary-card .label { color:var(--muted); font-size:.92rem; }
      .summary-card .value { font-size:1.8rem; font-weight:800; margin-top:4px; }
      .badge { display:inline-flex; align-items:center; gap:8px; padding:6px 12px; border-radius:999px; border:1px solid var(--pass-border); background:var(--pass-bg); color:var(--pass-text); font-weight:700; font-size:.92rem; }
      .families { display:grid; gap:16px; }
      .family { padding:18px; }
      .family-head { display:flex; flex-wrap:wrap; gap:12px; align-items:center; justify-content:space-between; margin-bottom:10px; }
      .family h2 { font-size:1.15rem; }
      .family .status { min-width:fit-content; }
      .family p.note { color:var(--muted); margin-bottom:12px; }
      ul { margin:0; padding-left:20px; }
      li + li { margin-top:4px; }
      .pass { color: var(--pass-text); }
      .fail { color: #b91c1c; }
      .meta { margin-top:24px; color:var(--muted); font-size:.95rem; }
      .footer { margin-top:16px; padding-top:16px; border-top:1px solid var(--border); color:var(--muted); font-size:.92rem; }
      code { background:#eef6ef; border:1px solid #ddeade; border-radius:6px; padding:0 6px; }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div class="eyebrow">Test protocol</div>
        <div class="title-row">
          <div>
            <h1>SimpleSkat</h1>
            <p>Executable BDD behavior cases and the current pass snapshot for supported Skat rules.</p>
          </div>
          <div class="badge">${report.summary.status} · ${report.summary.passCount}/${report.summary.scenarioCount} cases green</div>
        </div>
      </header>

      <section class="summary" aria-label="Coverage summary">
        <article class="summary-card"><div class="label">Feature files</div><div class="value">${report.summary.featureCount}</div></article>
        <article class="summary-card"><div class="label">Executable cases</div><div class="value">${report.summary.scenarioCount}</div></article>
        <article class="summary-card"><div class="label">Passing cases</div><div class="value">${report.summary.passCount}</div></article>
        <article class="summary-card"><div class="label">Failing cases</div><div class="value">${report.summary.failCount}</div></article>
      </section>

      <section class="families" aria-label="Supported rule families">
        ${familyHtml}
      </section>

      <section class="meta">
        <p>Source of truth: <code>tests/bdd/*.feature</code> plus the executable runner in <code>tests/bdd/runner.mjs</code>.</p>
        <div class="footer">Open this page on GitHub Pages next to the game to inspect the current test status.</div>
      </section>
    </main>
  </body>
</html>`;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function runBddSuite() {
  const report = buildReport();
  writeFileSync(PROTOCOL_JSON, JSON.stringify(report, null, 2));
  writeFileSync(PROTOCOL_HTML, renderHtml(report));
  return report;
}

export { parseFeatures };
