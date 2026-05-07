import { BeforeAll, AfterAll, Before, After, AfterStep, setWorldConstructor } from '@cucumber/cucumber';
import { spawn } from 'node:child_process';
import { appendFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(process.cwd());
const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const ARTIFACT_DIR = resolve(ROOT, 'tests/browser-artifacts/cucumber');
const SCREENSHOT_DIR = join(ARTIFACT_DIR, 'screenshots');
const EXECUTION_LOG = resolve(ROOT, 'tests/cucumber-execution.ndjson');

let server;
let browser;

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'step';
}

function seatIndex(label) {
  return ({ 'Du': 0, 'KI links': 1, 'KI rechts': 2 })[label];
}

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(BASE_URL);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server did not become ready at ${BASE_URL}`);
}

class BrowserWorld {
  constructor() {
    this.page = null;
    this.context = null;
    this.featureName = 'unknown-feature';
    this.scenarioName = 'unknown-scenario';
    this.scenarioId = 'unknown-scenario-id';
    this.stepIndex = 0;
    this.scenarioDir = null;
  }

  async loadGame(seed = 'Cucumber') {
    await this.page.goto(`${BASE_URL}/?seed=${encodeURIComponent(seed)}`, { waitUntil: 'networkidle' });
    await this.page.evaluate((gameSeed) => window.__simpleSkatTest.reset(gameSeed));
    await this.page.evaluate(() => window.__simpleSkatTest.patch({
      phase: 'bidding',
      dealerIndex: 0,
      currentTurnIndex: 1,
      currentBid: 18,
      highestBidder: null,
      activeBidders: [true, true, true],
      declarerIndex: null,
      contract: null,
      result: null,
    }));
  }

  async patchGame(patch) {
    return this.page.evaluate((statePatch) => window.__simpleSkatTest.patch(statePatch), patch);
  }

  async advanceGame() {
    return this.page.evaluate(() => window.__simpleSkatTest.advance());
  }

  async screenshotStep(stepText, status) {
    const fileName = `${String(this.stepIndex).padStart(3, '0')}-${slugify(stepText)}.png`;
    const screenshotPath = join(this.scenarioDir, fileName);
    await this.page.screenshot({ path: screenshotPath, fullPage: false });
    const screenshotFile = join('browser-artifacts/cucumber', basename(this.scenarioDir), fileName).replace(/\\/g, '/');
    appendFileSync(EXECUTION_LOG, `${JSON.stringify({
      feature: this.featureName,
      scenario: this.scenarioName,
      scenarioId: this.scenarioId,
      stepIndex: this.stepIndex,
      stepText,
      status,
      screenshotFile,
      screenshotDataUri: `data:image/png;base64,${readFileSync(screenshotPath).toString('base64')}`,
    })}\n`);
    this.stepIndex += 1;
    return fileName;
  }

  snapshot() {
    return this.page.evaluate(() => window.__simpleSkatTest.snapshot());
  }
}

setWorldConstructor(BrowserWorld);

BeforeAll(async function () {
  rmSync(ARTIFACT_DIR, { recursive: true, force: true });
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  writeFileSync(EXECUTION_LOG, '');

  server = spawn(process.execPath, ['tests/serve.mjs'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  await waitForServer();
  browser = await chromium.launch({ headless: true });
});

AfterAll(async function () {
  if (browser) await browser.close();
  if (server) server.kill('SIGTERM');
});

Before(async function (hook) {
  const uri = hook?.pickle?.uri || hook?.gherkinDocument?.uri || hook?.uri || 'feature.feature';
  this.featureName = basename(uri);
  this.scenarioName = hook?.pickle?.name || hook?.name || 'scenario';
  this.scenarioId = hook?.pickle?.id || `${this.featureName}-${this.scenarioName}`;
  this.stepIndex = 0;
  this.scenarioDir = join(SCREENSHOT_DIR, `${slugify(this.featureName)}-${slugify(this.scenarioId)}-${slugify(this.scenarioName)}`);
  mkdirSync(this.scenarioDir, { recursive: true });
  this.context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  this.page = await this.context.newPage();
});

After(async function () {
  if (this.context) {
    await this.context.close();
  }
  this.page = null;
  this.context = null;
});

AfterStep(async function ({ pickleStep, result }) {
  if (!this.page) return;
  const text = pickleStep?.text || pickleStep?.keyword?.trim() || 'step';
  await this.screenshotStep(text, result?.status || 'UNKNOWN');
});

export { seatIndex, slugify };
