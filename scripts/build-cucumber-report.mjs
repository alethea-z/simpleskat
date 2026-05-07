import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(process.cwd());
const LOG_PATH = resolve(ROOT, 'tests/cucumber-execution.ndjson');
const REPORT_JSON = resolve(ROOT, 'tests/browser-bdd-report.json');
const REPORT_HTML = resolve(ROOT, 'tests/browser-bdd-report.html');
const FEATURES_DIR = resolve(ROOT, 'tests/cucumber/features');
const FALLBACK_BASE = '/simpleskat/tests';

function parseLog() {
  if (!existsSync(LOG_PATH)) return [];
  return readFileSync(LOG_PATH, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function parseFeatureFile(path) {
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  const feature = (lines.find((line) => line.startsWith('Feature:')) || path).replace(/^Feature:\s*/, '').trim();
  const scenarios = [];
  let current = null;
  let background = [];
  let inBackground = false;
  for (const line of lines) {
    if (/^\s*Background:\s*$/.test(line)) {
      inBackground = true;
      current = null;
      continue;
    }
    const scenarioMatch = line.match(/^\s*Scenario(?: Outline)?:\s*(.+)$/);
    if (scenarioMatch) {
      inBackground = false;
      current = { title: scenarioMatch[1].trim(), steps: [] };
      scenarios.push(current);
      continue;
    }
    const stepMatch = line.match(/^\s*(Given|When|Then|And|But)\s+(.+)$/);
    if (stepMatch) {
      const step = { keyword: stepMatch[1], text: stepMatch[2].trim() };
      if (inBackground) background.push(step);
      else if (current) current.steps.push(step);
    }
  }
  return { feature, background, scenarios };
}

function parseFeatures() {
  const files = readdirSync(FEATURES_DIR).filter((file) => file.endsWith('.feature')).sort();
  return new Map(files.map((file) => {
    const parsed = parseFeatureFile(resolve(FEATURES_DIR, file));
    return [file, parsed];
  }));
}

function buildReport(records) {
  const featureSpecs = parseFeatures();
  const groups = new Map();
  for (const record of records) {
    const key = `${record.feature}::${record.scenarioId || record.scenario}`;
    if (!groups.has(key)) groups.set(key, { feature: record.feature, scenario: record.scenario, steps: [] });
    groups.get(key).steps.push(record);
  }

  const scenarios = [...groups.values()].map((scenario) => {
    const featureSpec = featureSpecs.get(scenario.feature);
    const scenarioSpec = featureSpec?.scenarios.find((item) => item.title === scenario.scenario) || featureSpec?.scenarios[0] || { steps: [] };
    return { ...scenario, featureSpec, scenarioSpec, background: featureSpec?.background || [] };
  });
  const totalSteps = records.length;
  const passedSteps = records.filter((row) => row.status === 'PASSED').length;
  const failedSteps = totalSteps - passedSteps;
  const scenarioStatus = scenarios.map((scenario) => ({
    ...scenario,
    status: scenario.steps.every((step) => step.status === 'PASSED') ? 'PASS' : 'FAIL',
  }));

  const html = `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SimpleSkat Browser BDD Report</title>
  <style>
    :root { color-scheme: light; --bg:#f7faf7; --panel:#fff; --text:#17301c; --muted:#55705a; --border:#d7e6da; --pass-bg:#e7f8ea; --pass-text:#12632a; --pass-border:#9ed7ab; --fail-bg:#fef2f2; --fail-text:#991b1b; --fail-border:#fca5a5; --given-bg:#e8f2ff; --given-text:#1d4ed8; --when-bg:#fff7e6; --when-text:#b45309; --then-bg:#ecfdf5; --then-text:#166534; }
    body { margin:0; font-family: system-ui, -apple-system, Segoe UI, sans-serif; background: linear-gradient(180deg, #f4fbf5 0%, var(--bg) 100%); color: var(--text); }
    main { max-width: 1200px; margin: 0 auto; padding: 28px 18px 48px; }
    .badge { display:inline-flex; padding:6px 12px; border-radius:999px; border:1px solid var(--pass-border); background:var(--pass-bg); color:var(--pass-text); font-weight:700; }
    .badge.fail { border-color: var(--fail-border); background: var(--fail-bg); color: var(--fail-text); }
    .summary { display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin: 20px 0 24px; }
    .card, .scenario, .step { background:var(--panel); border:1px solid var(--border); border-radius:18px; padding:16px; }
    .value { font-size:1.8rem; font-weight:800; margin-top:4px; }
    .muted { color: var(--muted); }
    .scenario { margin-top: 16px; }
    .scenario-head { display:flex; justify-content:space-between; gap:12px; align-items:center; margin-bottom:12px; }
    .steps { display:grid; gap:12px; }
    .step img { width:100%; display:block; border-radius:12px; border:1px solid var(--border); margin-top:10px; }
    .kw { display:inline-flex; padding:2px 8px; border-radius:999px; font-size:0.8rem; font-weight:700; margin-right:8px; }
    .kw.given { background:var(--given-bg); color:var(--given-text); }
    .kw.when { background:var(--when-bg); color:var(--when-text); }
    .kw.then { background:var(--then-bg); color:var(--then-text); }
    .kw.and { background:#f1f5f9; color:#334155; }
    .step-link { display:inline-block; margin-top:8px; font-size:0.92rem; }
    code { background:#eef6ef; border:1px solid #ddeade; border-radius:6px; padding:0 6px; }
    ul { margin: 8px 0 0 18px; }
  </style>
</head>
<body>
  <main>
    <h1>SimpleSkat Browser BDD Report</h1>
    <p class="muted">Browser-run acceptance scenarios with screenshots from the actual game UI.</p>
    <section class="summary">
      <div class="card"><div class="muted">Scenarios</div><div class="value">${scenarioStatus.length}</div></div>
      <div class="card"><div class="muted">Steps</div><div class="value">${totalSteps}</div></div>
      <div class="card"><div class="muted">Passing steps</div><div class="value">${passedSteps}</div></div>
      <div class="card"><div class="muted">Failing steps</div><div class="value">${failedSteps}</div></div>
    </section>
    ${scenarioStatus.map((scenario) => `
      <section class="scenario">
        <div class="scenario-head">
          <div>
            <h2>${escapeHtml(scenario.feature)}</h2>
            <div class="muted">${escapeHtml(scenario.scenario)}</div>
          </div>
          <span class="badge ${scenario.status === 'FAIL' ? 'fail' : ''}">${scenario.status}</span>
        </div>
        ${scenario.background.length ? `<div class="muted" style="margin-bottom:8px;">Background</div>` : ''}
        ${scenario.background.length ? `<div class="steps" style="margin-bottom:12px;">${scenario.background.map((specStep, index) => {
          const step = scenario.steps[index];
          const keywordClass = String(specStep.keyword || 'given').toLowerCase();
          const screenshot = step?.screenshotFile ? `/${FALLBACK_BASE}/${step.screenshotFile}` : '';
          const rel = step?.screenshotFile ? `./${step.screenshotFile}` : '';
          return `<article class="step">
              <div><span class="kw ${keywordClass}">${escapeHtml(specStep.keyword)}</span><strong>${escapeHtml(specStep.text)}</strong></div>
              ${step?.screenshotFile ? `<div class="muted">${escapeHtml(step.status)} · ${escapeHtml(step.screenshotFile)}</div><img src="${escapeHtml(rel)}" data-fallback="${escapeHtml(screenshot)}" onerror="if(!this.dataset.fallbackUsed){this.dataset.fallbackUsed='1';this.src=this.dataset.fallback;}" alt="${escapeHtml(specStep.keyword)} ${escapeHtml(specStep.text)}"><a class="step-link" href="${escapeHtml(rel)}">Open screenshot</a>` : ''}
            </article>`;
        }).join('')}</div>` : ''}
        ${scenario.scenarioSpec?.steps?.length ? `<div class="muted" style="margin-bottom:8px;">Scenario steps</div>` : ''}
        <div class="steps">
          ${(scenario.scenarioSpec?.steps || scenario.steps.map((_, i) => ({ keyword: 'Then', text: `Step ${i + 1}` }))).map((specStep, index) => {
            const step = scenario.steps[index + scenario.background.length];
            const keywordClass = String(specStep.keyword || 'then').toLowerCase();
            const screenshot = step?.screenshotFile ? `/${FALLBACK_BASE}/${step.screenshotFile}` : '';
            const rel = step?.screenshotFile ? `./${step.screenshotFile}` : '';
            return `
            <article class="step">
              <div><span class="kw ${keywordClass}">${escapeHtml(specStep.keyword || 'Then')}</span><strong>${escapeHtml(specStep.text || step?.stepText || '')}</strong></div>
              <div class="muted">${escapeHtml(step?.status || '')} · ${escapeHtml(step?.screenshotFile || '')}</div>
              ${step?.screenshotFile ? `<img src="${escapeHtml(rel)}" data-fallback="${escapeHtml(screenshot)}" onerror="if(!this.dataset.fallbackUsed){this.dataset.fallbackUsed='1';this.src=this.dataset.fallback;}" alt="${escapeHtml(specStep.keyword || '')} ${escapeHtml(specStep.text || step?.stepText || '')}">
              <a class="step-link" href="${escapeHtml(rel)}">Open screenshot</a>` : ''}
            </article>`;
          }).join('')}
        </div>
      </section>`).join('')}
    <p class="muted" style="margin-top:20px;">Source: <code>tests/cucumber-execution.ndjson</code>.</p>
  </main>
</body>
</html>`;

  const json = { summary: { scenarios: scenarioStatus.length, steps: totalSteps, passedSteps, failedSteps }, scenarios: scenarioStatus };
  writeFileSync(REPORT_JSON, JSON.stringify(json, null, 2));
  writeFileSync(REPORT_HTML, html);
  return json;
}

const report = buildReport(parseLog());
console.log(JSON.stringify(report.summary));
