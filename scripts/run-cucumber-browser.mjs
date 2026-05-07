import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const engineProbe = spawnSync('sh', ['-lc', 'command -v podman >/dev/null 2>&1 && echo podman || echo docker'], {
  cwd: root,
  encoding: 'utf8',
});

if (engineProbe.status !== 0) {
  console.error(engineProbe.stderr || engineProbe.stdout);
  process.exit(engineProbe.status || 1);
}

const engine = (engineProbe.stdout || '').trim() || 'docker';
const image = 'mcr.microsoft.com/playwright:v1.56.1-noble';
const cucumberArgs = [
  'run',
  '--rm',
  '--network=host',
  '-e', 'PLAYWRIGHT_BROWSERS_PATH=/ms-playwright',
  '-v', `${root}:/work:Z`,
  '-w', '/work',
  image,
  'node_modules/.bin/cucumber-js',
  'tests/cucumber/features',
  '--require', 'tests/cucumber/support/browser.mjs',
  '--require', 'tests/cucumber/steps/game.steps.mjs',
  '--format', 'progress',
];

const cucumber = spawnSync(engine, cucumberArgs, { cwd: root, stdio: 'inherit' });
const report = spawnSync(process.execPath, ['scripts/build-cucumber-report.mjs'], { cwd: root, stdio: 'inherit' });

const cucumberStatus = cucumber.status ?? 1;
const reportStatus = report.status ?? 1;
process.exit(cucumberStatus !== 0 ? cucumberStatus : reportStatus);
