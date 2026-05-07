import { spawn } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(process.cwd());
const artifactsDir = resolve(root, 'tests/browser-artifacts');
const screenshotDir = resolve(artifactsDir, 'screenshots');
const reportHtmlPath = resolve(root, 'tests/browser-bdd-report.html');
const reportJsonPath = resolve(root, 'tests/browser-bdd-report.json');
const port = 4173;
const baseUrl = `http://127.0.0.1:${port}`;

function startServer() {
  return spawn(process.execPath, ['tests/serve.mjs'], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(baseUrl);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server did not become ready at ${baseUrl}`);
}

async function snapshot(page) {
  return page.evaluate(() => ({
    phase: document.querySelector('#phaseLabel')?.textContent,
    bid: document.querySelector('#bidLabel')?.textContent,
    declarer: document.querySelector('#declarerLabel')?.textContent,
    score: document.querySelector('#scoreLabel')?.textContent,
    result: document.querySelector('#result')?.textContent,
    trick: document.querySelector('#trickLabel')?.textContent,
    log: Array.from(document.querySelectorAll('#log li')).map((li) => li.textContent),
    controls: Array.from(document.querySelectorAll('#controls button')).map((b) => ({
      text: b.textContent,
      disabled: b.disabled,
      action: b.dataset.action,
      contract: b.dataset.contract,
      suit: b.dataset.suit,
    })),
    cards: Array.from(document.querySelectorAll('#hand button')).map((b) => ({
      text: b.textContent,
      disabled: b.disabled,
      classes: b.className,
      id: b.dataset.cardId,
    })),
  }));
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'step';
}

function renderHtml(report) {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SimpleSkat Browser App Report</title>
  <style>
    :root { color-scheme: light; --bg:#f7faf7; --panel:#fff; --text:#17301c; --muted:#55705a; --border:#d7e6da; --pass-bg:#e7f8ea; --pass-text:#12632a; --pass-border:#9ed7ab; }
    body { margin:0; font-family: system-ui, -apple-system, Segoe UI, sans-serif; background: linear-gradient(180deg, #f4fbf5 0%, var(--bg) 100%); color: var(--text); }
    main { max-width: 1200px; margin: 0 auto; padding: 28px 18px 48px; }
    .badge { display:inline-flex; padding:6px 12px; border-radius:999px; border:1px solid var(--pass-border); background:var(--pass-bg); color:var(--pass-text); font-weight:700; }
    .summary { display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin: 20px 0 24px; }
    .card, .step { background:var(--panel); border:1px solid var(--border); border-radius:18px; padding:16px; }
    .value { font-size:1.8rem; font-weight:800; margin-top:4px; }
    .muted { color: var(--muted); }
    .step { margin-top: 16px; }
    .step-head { display:flex; justify-content:space-between; gap:12px; align-items:center; margin-bottom:12px; }
    .thumb { width:100%; border:1px solid var(--border); border-radius:12px; overflow:hidden; background:#fff; display:block; }
    .steps { display:grid; gap:16px; }
    code { background:#eef6ef; border:1px solid #ddeade; border-radius:6px; padding:0 6px; }
    ul { margin: 10px 0 0; }
  </style>
</head>
<body>
  <main>
    <h1>SimpleSkat Browser App Report</h1>
    <p class="muted">Screenshots are captured from the real game UI after each browser step.</p>
    <section class="summary">
      <div class="card"><div class="muted">Steps</div><div class="value">${report.summary.steps}</div></div>
      <div class="card"><div class="muted">Final phase</div><div class="value">${report.summary.phase}</div></div>
      <div class="card"><div class="muted">Winner</div><div class="value">${report.summary.result}</div></div>
      <div class="card"><div class="muted">Privacy-safe discard</div><div class="value">${report.summary.sawPrivacySafeDiscard ? 'Yes' : 'No'}</div></div>
    </section>
    <section class="steps">
      ${report.steps.map((step) => `
        <article class="step">
          <div class="step-head">
            <strong>${step.index}. ${step.action}</strong>
            <span class="badge">${step.phase}</span>
          </div>
          <img class="thumb" src="./browser-artifacts/screenshots/${step.screenshotFile}" alt="${step.action}">
          <ul>
            ${step.notes.map((note) => `<li>${note}</li>`).join('')}
          </ul>
          <p class="muted">Screenshot: <code>${step.screenshotFile}</code></p>
        </article>
      `).join('')}
    </section>
  </main>
</body>
</html>`;
}

async function main() {
  await rm(artifactsDir, { recursive: true, force: true });
  await mkdir(screenshotDir, { recursive: true });

  const server = startServer();
  const cleanup = () => {
    if (!server.killed) server.kill('SIGTERM');
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  try {
    await waitForServer();
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${baseUrl}/?seed=BrowserSmoke`, { waitUntil: 'networkidle' });

    const steps = [];
    let sawPrivacySafeDiscard = false;

    async function capture(action, notes = []) {
      const state = await snapshot(page);
      if (state.log.some((line) => /legt 2 Karten ab\./.test(line))) {
        sawPrivacySafeDiscard = true;
      }
      const screenshotFile = `${String(steps.length + 1).padStart(3, '0')}-${slugify(action)}.png`;
      await page.screenshot({ path: join(screenshotDir, screenshotFile), fullPage: false });
      steps.push({
        index: steps.length + 1,
        action,
        phase: state.phase || '—',
        screenshotFile,
        notes: [...notes, `Phase: ${state.phase || '—'}`, `Bietstand: ${state.bid || '—'}`, `Alleinspieler: ${state.declarer || '—'}`, `Punkte: ${state.score || '—'}`, `Protokoll: ${state.log.slice(-1)[0] || '—'}`],
      });
    }

    await capture('Initial state');

    for (let i = 0; i < 600; i += 1) {
      const s = await snapshot(page);
      if (s.phase === 'Ergebnis') break;

      const bidButton = page.locator('#controls button[data-action="bid"]:not([disabled])').first();
      if (await bidButton.count()) {
        await bidButton.click();
        await page.waitForTimeout(50);
        await capture(`Clicked bid ${s.bid ?? ''}`.trim());
        continue;
      }

      const passButton = page.locator('#controls button[data-action="pass"]:not([disabled])').first();
      if (await passButton.count()) {
        await passButton.click();
        await page.waitForTimeout(50);
        await capture('Clicked pass');
        continue;
      }

      const contractButton = page.locator('#controls button[data-contract]:not([disabled])').first();
      if (await contractButton.count()) {
        const grand = page.locator('#controls button[data-contract="grand"]:not([disabled])').first();
        if (await grand.count()) {
          await grand.click();
          await page.waitForTimeout(50);
          await capture('Selected Grand contract');
          continue;
        }
        await contractButton.click();
        await page.waitForTimeout(50);
        await capture('Selected contract');
        continue;
      }

      const discard = page.locator('#controls button[data-action="discard"]:not([disabled])').first();
      if (await discard.count()) {
        const selected = s.cards.filter((card) => card.classes.includes('selected')).length;
        if (selected < 2) {
          const nextCard = page.locator('#hand button:not(.selected):not([disabled])').first();
          if (await nextCard.count()) {
            await nextCard.click();
            await page.waitForTimeout(50);
            await capture('Selected discard card');
            continue;
          }
        }
        await discard.click();
        await page.waitForTimeout(50);
        await capture('Committed discard');
        continue;
      }

      const playable = page.locator('#hand button.playable:not([disabled])').first();
      if (await playable.count()) {
        await playable.click();
        await page.waitForTimeout(50);
        await capture('Played a card');
        continue;
      }

      await page.waitForTimeout(50);
    }

    const final = await snapshot(page);
    await browser.close();

    if (final.phase !== 'Ergebnis') {
      throw new Error(`Game did not finish. Last phase: ${final.phase}`);
    }
    if (!/gewinnt/i.test(final.result || '')) {
      throw new Error(`Result missing winner text: ${final.result}`);
    }
    if (!sawPrivacySafeDiscard) {
      throw new Error('Did not observe a privacy-safe discard log line during the game.');
    }

    const report = {
      summary: {
        steps: steps.length,
        phase: final.phase,
        result: final.result,
        sawPrivacySafeDiscard,
      },
      steps,
    };

    writeFileSync(reportJsonPath, JSON.stringify(report, null, 2));
    writeFileSync(reportHtmlPath, renderHtml(report));

    console.log(JSON.stringify(report.summary));
  } finally {
    cleanup();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
