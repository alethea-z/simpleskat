import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const cucumber = spawnSync(
  resolve(root, 'node_modules/.bin/cucumber-js'),
  [
    'tests/cucumber/features',
    '--require', 'tests/cucumber/support/browser.mjs',
    '--require', 'tests/cucumber/steps/game.steps.mjs',
    '--format', 'progress',
  ],
  { cwd: root, stdio: 'inherit' },
);
const report = spawnSync(process.execPath, ['scripts/build-cucumber-report.mjs'], { cwd: root, stdio: 'inherit' });

const cucumberStatus = cucumber.status ?? 1;
const reportStatus = report.status ?? 1;
process.exit(cucumberStatus !== 0 ? cucumberStatus : reportStatus);
