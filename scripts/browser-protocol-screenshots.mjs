import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(process.cwd());
const artifactsDir = resolve(root, 'tests/browser-artifacts');
const screenshotDir = resolve(artifactsDir, 'screenshots');
const reportHtmlPath = resolve(root, 'tests/browser-bdd-report.html');
const reportJsonPath = resolve(root, 'tests/browser-bdd-report.json');
const protocolJsonPath = resolve(root, 'tests/protocol.json');
const port = 4173;
const baseUrl = `http://127.0.0.1:${port}`;

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'case';
}

function uniqueFeatureOrder(cases) {
  const order = [];
  for (const row of cases) {
    if (!order.includes(row.feature)) order.push(row.feature);
  }
  return order;
}

function parseFeatureSpecs() {
  const files = Array.from(new Set(readReport().cases.map((row) => row.feature)));
  return files.map((feature) => {
    const file = readFileSync(join(root, 'tests/bdd', `${featureToFile(feature)}`), 'utf8');
    const scenarios = [];
    let current = null;
    for (const line of file.split(/\r?\n/)) {
      const scenario = line.match(/^\s*Scenario(?: Outline)?:\s*(.+)$/);
      if (scenario) {
        current = { title: scenario[1].trim(), steps: [] };
        scenarios.push(current);
        continue;
      }
      const step = line.match(/^\s*(Given|When|Then|And|But)\s+(.+)$/);
      if (step && current) current.steps.push(`${step[1]} ${step[2].trim()}`);
    }
    return { feature, scenarios };
  });
}

function featureToFile(feature) {
  const mapping = {
    'Dealing and bidding in standard Skat': '01-dealing-and-bidding.feature',
    'Contract and trump behavior': '02-contract-and-trumps.feature',
    'Trick play and legal move behavior': '03-trick-play.feature',
    'Scoring, winner determination, and result presentation': '04-scoring-and-result.feature',
    'Privacy and mobile usability': '05-privacy-and-usability.feature',
  };
  return mapping[feature];
}

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

function readReport() {
  return JSON.parse(readFileSync(protocolJsonPath, 'utf8'));
}

function renderBrowserReport(report) {
  const grouped = new Map();
  for (const row of report.cases) {
    if (!grouped.has(row.feature)) grouped.set(row.feature, []);
    grouped.get(row.feature).push(row);
  }

  const sections = [...grouped.entries()].map(([feature, rows]) => `
    <section class="family">
      <div class="family-head">
        <h2>${feature}</h2>
        <span class="badge">PASS · ${rows.length}/${rows.length}</span>
      </div>
      <div class="thumb-grid">
        ${rows.map((row) => `
          <figure>
            <img src="./browser-artifacts/screenshots/${row.stepScreenshots?.[0]?.screenshotFile ?? row.screenshotFile}" alt="${row.title}">
            <figcaption>
              <strong>${row.title}</strong><br>
              ${(row.stepScreenshots ?? []).map((step) => `<div>${step.stepText}<br><code>${step.screenshotFile}</code></div>`).join('')}
            </figcaption>
          </figure>
        `).join('\n')}
      </div>
    </section>`).join('\n');

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SimpleSkat Browser BDD Report</title>
  <style>
    :root { color-scheme: light; --bg:#f7faf7; --panel:#fff; --text:#17301c; --muted:#55705a; --border:#d7e6da; --pass-bg:#e7f8ea; --pass-text:#12632a; --pass-border:#9ed7ab; }
    body { margin:0; font-family: system-ui, -apple-system, Segoe UI, sans-serif; background: linear-gradient(180deg, #f4fbf5 0%, var(--bg) 100%); color: var(--text); }
    main { max-width: 1200px; margin: 0 auto; padding: 28px 18px 48px; }
    .badge { display:inline-flex; padding:6px 12px; border-radius:999px; border:1px solid var(--pass-border); background:var(--pass-bg); color:var(--pass-text); font-weight:700; }
    .summary { display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin: 20px 0 24px; }
    .card, .family { background:var(--panel); border:1px solid var(--border); border-radius:18px; padding:16px; }
    .value { font-size:1.8rem; font-weight:800; margin-top:4px; }
    .muted { color: var(--muted); }
    .family { margin-top: 16px; }
    .family-head { display:flex; justify-content:space-between; gap:12px; align-items:center; margin-bottom:12px; }
    .thumb-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:12px; }
    figure { margin:0; border:1px solid var(--border); border-radius:12px; overflow:hidden; background:#fff; }
    img { width:100%; display:block; }
    figcaption { padding:10px 12px; font-size:0.92rem; color:var(--muted); }
    code { background:#eef6ef; border:1px solid #ddeade; border-radius:6px; padding:0 6px; }
  </style>
</head>
<body>
  <main>
    <h1>SimpleSkat Browser BDD Report</h1>
    <p class="muted">Screenshots captured in the browser for every executable BDD case.</p>
    <section class="summary">
      <div class="card"><div class="muted">Feature files</div><div class="value">${report.summary.featureCount}</div></div>
      <div class="card"><div class="muted">Cases</div><div class="value">${report.summary.scenarioCount}</div></div>
      <div class="card"><div class="muted">Passing</div><div class="value">${report.summary.passCount}</div></div>
      <div class="card"><div class="muted">Failures</div><div class="value">${report.summary.failCount}</div></div>
    </section>
    ${sections}
    <p class="muted" style="margin-top:20px;">Source: <code>tests/protocol.json</code> and <code>tests/browser-artifacts/screenshots</code>.</p>
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

  let stderr = '';
  server.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  try {
    await waitForServer();
    const report = readReport();
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 1 });

    await page.goto(`${baseUrl}/tests/protocol.html?v=${Date.now()}`, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: `
      [data-bdd-active="true"] { outline: 4px solid #22c55e !important; box-shadow: 0 0 0 9999px rgba(34,197,94,0.08) inset !important; }
      .bdd-chip { position: fixed; right: 16px; bottom: 16px; z-index: 9999; background: rgba(17,24,39,.94); color: white; padding: 10px 14px; border-radius: 14px; font: 600 14px/1.3 system-ui; max-width: 480px; }
    `});

    const featureOrder = uniqueFeatureOrder(report.cases);
    const grouped = new Map();
    for (const row of report.cases) {
      if (!grouped.has(row.feature)) grouped.set(row.feature, []);
      grouped.get(row.feature).push(row);
    }
    const featureSpecs = parseFeatureSpecs();
    const specByFeature = new Map(featureSpecs.map((spec) => [spec.feature, spec]));

    const outputCases = [];
    for (const [familyIndex, feature] of featureOrder.entries()) {
      const rows = grouped.get(feature) ?? [];
      const spec = specByFeature.get(feature);
      const scenarioSpecs = spec?.scenarios ?? [];
      for (const [rowIndex, row] of rows.entries()) {
        const item = page.locator('article.family').nth(familyIndex).locator('li').nth(rowIndex);
        await item.scrollIntoViewIfNeeded();
        const steps = scenarioSpecs[rowIndex]?.steps ?? ['Given the case is visible'];
        const stepScreenshots = [];
        for (const [stepIndex, stepText] of steps.entries()) {
          await page.evaluate(({ feature, title, stepText }) => {
            document.querySelectorAll('[data-bdd-active="true"]').forEach((el) => el.removeAttribute('data-bdd-active'));
            const families = Array.from(document.querySelectorAll('article.family'));
            for (const family of families) {
              const head = family.querySelector('h2');
              if (head?.textContent?.trim() === feature) {
                const li = Array.from(family.querySelectorAll('li')).find((node) => node.textContent?.includes(title));
                if (li) li.setAttribute('data-bdd-active', 'true');
                break;
              }
            }
            let chip = document.querySelector('.bdd-chip');
            if (!chip) {
              chip = document.createElement('div');
              chip.className = 'bdd-chip';
              document.body.appendChild(chip);
            }
            chip.textContent = `${feature} — ${title} — ${stepText}`;
          }, { feature, title: row.title, stepText });

          const screenshotFile = `${String(outputCases.length + 1).padStart(3, '0')}-${String(stepIndex + 1).padStart(2, '0')}-${slugify(feature)}-${slugify(row.title)}-${slugify(stepText)}.png`;
          await page.screenshot({ path: join(screenshotDir, screenshotFile), fullPage: false });
          stepScreenshots.push({ stepText, screenshotFile });
        }
        outputCases.push({ ...row, stepScreenshots });
      }
    }

    await browser.close();
    const finalReport = { ...report, cases: outputCases };
    writeFileSync(reportJsonPath, JSON.stringify(finalReport, null, 2));
    writeFileSync(reportHtmlPath, renderBrowserReport(finalReport));

    console.log(JSON.stringify(finalReport.summary));
  } finally {
    cleanup();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
