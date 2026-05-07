import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const engine = spawnSync('sh', ['-lc', 'command -v podman >/dev/null 2>&1 && echo podman || echo docker'], {
  cwd: root,
  encoding: 'utf8',
});

if (engine.status !== 0) {
  console.error(engine.stderr || engine.stdout);
  process.exit(engine.status || 1);
}

const container = (engine.stdout || '').trim() || 'docker';
const image = 'mcr.microsoft.com/playwright:v1.56.1-noble';
const args = [
  'run',
  '--rm',
  '--network=host',
  '-e', 'PLAYWRIGHT_BROWSERS_PATH=/ms-playwright',
  '-v', `${root}:/work:Z`,
  '-w', '/work',
  image,
  'node',
  'scripts/browser-game-report.mjs',
];

const result = spawnSync(container, args, { cwd: root, stdio: 'inherit' });
process.exit(result.status ?? 1);
