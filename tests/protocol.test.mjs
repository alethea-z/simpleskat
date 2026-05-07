import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

import { runBddSuite } from './bdd/runner.mjs';

const protocolPath = new URL('./protocol.html', import.meta.url);
const reportPath = new URL('./protocol.json', import.meta.url);

if (!existsSync(reportPath)) {
  runBddSuite();
}

const html = readFileSync(protocolPath, 'utf8');
const report = JSON.parse(readFileSync(reportPath, 'utf8'));

test('the static protocol page reflects the current rule coverage snapshot', () => {
  assert.match(html, /<title>SimpleSkat Test Protocol<\/title>/);
  assert.ok(html.includes(`PASS · ${report.summary.passCount}/${report.summary.scenarioCount} cases green`));
  assert.ok(html.includes(`<div class="label">Feature files</div><div class="value">${report.summary.featureCount}</div>`));
  assert.ok(html.includes(`<div class="label">Executable cases</div><div class="value">${report.summary.scenarioCount}</div>`));
  assert.ok(html.includes(`<div class="label">Passing cases</div><div class="value">${report.summary.passCount}</div>`));
  assert.ok(html.includes(`<div class="label">Failing cases</div><div class="value">${report.summary.failCount}</div>`));

  for (const feature of report.cases.map((row) => row.feature).filter((value, index, array) => array.indexOf(value) === index)) {
    assert.match(html, new RegExp(feature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  const passBadges = html.match(/<span class="badge status">PASS<\/span>/g) ?? [];
  assert.equal(passBadges.length, 5);
});
