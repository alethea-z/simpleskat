import test from 'node:test';
import assert from 'node:assert/strict';

import { runBddSuite } from './bdd/runner.mjs';

const report = runBddSuite();

test('BDD feature files are executable and fully green', async (t) => {
  assert.equal(report.summary.status, 'PASS');
  assert.equal(report.summary.featureCount, 5);
  assert.equal(report.summary.failCount, 0);

  for (const row of report.cases) {
    await t.test(`${row.file} :: ${row.title}`, () => {
      assert.equal(row.status, 'pass', row.error || 'expected pass');
    });
  }
});
