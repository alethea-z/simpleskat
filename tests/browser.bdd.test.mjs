import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';

function startServer() {
  const server = spawn(process.execPath, ['tests/serve.mjs'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: '4173' },
  });

  return server;
}

async function waitForServer(url, attempts = 40, delayMs = 100) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error(`Server did not become ready: ${url}`);
}

test('Given the web app is opened on a mobile viewport, when a full game is automated in a browser, then the MVP reaches a valid result without leaking hidden discard cards', async (t) => {
  const server = startServer();

  t.after(() => {
    server.kill('SIGTERM');
  });

  await waitForServer('http://127.0.0.1:4173/');

  const output = execFileSync('podman', [
    'run',
    '--rm',
    '--network=host',
    '-e', 'PLAYWRIGHT_BROWSERS_PATH=/ms-playwright',
    '-v', `${process.cwd()}:/work:Z`,
    '-w', '/work',
    'mcr.microsoft.com/playwright:v1.56.1-noble',
    'node',
    'tests/browser-smoke.mjs',
  ], { encoding: 'utf8' });

  const result = JSON.parse(output.trim());
  assert.equal(result.phase, 'Ergebnis');
  assert.match(result.result, /gewinnt/i);
  assert.equal(result.sawPrivacySafeDiscard, true, 'expected a privacy-safe discard log line during the browser flow');
});
