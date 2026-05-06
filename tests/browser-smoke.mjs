import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://127.0.0.1:4173/?seed=BrowserSmoke', { waitUntil: 'networkidle' });

let sawPrivacySafeDiscard = false;

async function snapshot() {
  return page.evaluate(() => ({
    phase: document.querySelector('#phaseLabel')?.textContent,
    bid: document.querySelector('#bidLabel')?.textContent,
    declarer: document.querySelector('#declarerLabel')?.textContent,
    score: document.querySelector('#scoreLabel')?.textContent,
    result: document.querySelector('#result')?.textContent,
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

for (let i = 0; i < 600; i += 1) {
  const s = await snapshot();
  if (s.log.some((line) => /legt 2 Karten ab\./.test(line))) {
    sawPrivacySafeDiscard = true;
  }
  if (s.phase === 'Ergebnis') break;

  const bidButton = page.locator('#controls button[data-action="bid"]:not([disabled])').first();
  if (await bidButton.count()) {
    await bidButton.click();
    await page.waitForTimeout(25);
    continue;
  }

  const passButton = page.locator('#controls button[data-action="pass"]:not([disabled])').first();
  if (await passButton.count()) {
    await passButton.click();
    await page.waitForTimeout(25);
    continue;
  }

  const contractButton = page.locator('#controls button[data-contract]:not([disabled])').first();
  if (await contractButton.count()) {
    const firstContract = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('#controls button[data-contract]'));
      const grand = buttons.find((button) => button.dataset.contract === 'grand' && !button.disabled);
      return grand ? { contract: grand.dataset.contract, suit: grand.dataset.suit || null } : null;
    });
    const target = firstContract
      ? page.locator('#controls button[data-contract="grand"]')
      : contractButton;
    await target.first().click();
    await page.waitForTimeout(25);
    continue;
  }

  const discard = page.locator('#controls button[data-action="discard"]:not([disabled])').first();
  if (await discard.count()) {
    const selected = s.cards.filter((card) => card.classes.includes('selected')).length;
    if (selected < 2) {
      const nextCard = page.locator('#hand button:not(.selected):not([disabled])').first();
      if (await nextCard.count()) {
        await nextCard.click();
        await page.waitForTimeout(25);
        continue;
      }
    }
    await discard.click();
    await page.waitForTimeout(25);
    continue;
  }

  const playable = page.locator('#hand button.playable:not([disabled])').first();
  if (await playable.count()) {
    await playable.click();
    await page.waitForTimeout(25);
    continue;
  }

  await page.waitForTimeout(25);
}

const final = await snapshot();
if (final.phase !== 'Ergebnis') {
  throw new Error(`Game did not finish. Last phase: ${final.phase}`);
}
if (!/gewinnt/i.test(final.result || '')) {
  throw new Error(`Result missing winner text: ${final.result}`);
}
if (!sawPrivacySafeDiscard) {
  throw new Error('Did not observe a privacy-safe discard log line during the game.');
}

console.log(JSON.stringify({ ...final, sawPrivacySafeDiscard }));
await browser.close();
