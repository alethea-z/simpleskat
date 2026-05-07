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
  assert.match(html, /PASS · 103\/103 cases green/);
  assert.match(html, /Feature files[\s\S]*>5<\/div>/);
  assert.match(html, /Executable cases[\s\S]*>103<\/div>/);
  assert.match(html, /Passing cases[\s\S]*>103<\/div>/);
  assert.match(html, /Failing cases[\s\S]*>0<\/div>/);

  for (const feature of report.cases.map((row) => row.feature).filter((value, index, array) => array.indexOf(value) === index)) {
    assert.match(html, new RegExp(feature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  const passBadges = html.match(/<span class="badge status">PASS<\/span>/g) ?? [];
  assert.equal(passBadges.length, 5);
});
