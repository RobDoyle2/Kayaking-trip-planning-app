// End-to-end smoke test. Needs the built site served on BASE (default http://localhost:4173):
//   npm run build && node scripts/serve.mjs dist 4173 &
//   npm install --no-save playwright && npx playwright install chromium
//   node e2e/smoke.cjs
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || require('path').join(__dirname, 'out', 'shots');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -> ' + detail : ''}`);
}

const routes = [
  ['/', 'Sea Kayaking Hub'],
  ['/leadership', 'Leadership'],
  ['/trip-planning', 'Trip Planning'],
  ['/training', 'Training and Skills'],
  ['/navigation', 'Navigation and Tides'],
  ['/vhf', 'VHF Radio'],
  ['/knowledge', 'Knowledge Centre'],
  ['/emergency', 'Emergency card'],
  ['/sources', 'Sources and limits'],
  ['/my-plans', 'My plans'],
  ['/leadership/preparing', 'Preparing to lead a trip'],
  ['/leadership/responsibilities', 'Leadership responsibilities'],
  ['/leadership/checklist', 'Leader preparation checklist'],
  ['/leadership/sheets', 'SHEETS briefing'],
  ['/leadership/group', 'Group management'],
  ['/leadership/risk', 'Risk assessment'],
  ['/leadership/equipment', 'Equipment and safety check'],
  ['/leadership/review', 'Post-trip review'],
  ['/trip-planning/day', 'Day trip'],
  ['/trip-planning/multi-day', 'Multi-day expedition without camping'],
  ['/trip-planning/camping', 'Multi-day expedition with camping'],
];

(async () => {
  const browser = await chromium.launch();

  for (const [label, viewport] of [
    ['mobile', { width: 390, height: 844 }],
    ['tablet', { width: 820, height: 1180 }],
    ['desktop', { width: 1280, height: 800 }],
  ]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const problems = [];
    page.on('console', (m) => {
      if (['error', 'warning'].includes(m.type())) problems.push(`console ${m.type()}: ${m.text()}`);
    });
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`));
    page.on('response', (r) => {
      if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`);
    });

    // Every route loads directly (single-page-app fallback), has one h1, no overflow, no errors.
    for (const [route, h1] of routes) {
      await page.goto(BASE + route, { waitUntil: 'networkidle' });
      const heading = await page.locator('main h1').first().innerText();
      check(`[${label}] ${route} shows h1 "${h1}"`, heading.trim() === h1, `got "${heading.trim()}"`);
      const h1count = await page.locator('h1').count();
      check(`[${label}] ${route} has exactly one h1`, h1count === 1, `count=${h1count}`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`[${label}] ${route} has no horizontal page overflow`, overflow <= 0, `overflow=${overflow}px`);
      const title = await page.title();
      check(`[${label}] ${route} sets a document title`, title.includes('Sea Kayaking Hub'), title);
      if (route === '/' || route === '/leadership' || route === '/emergency' || route === '/sources') {
        await page.screenshot({ path: `${OUT}/${label}${route === '/' ? '-home' : route.replace('/', '-')}.png`, fullPage: true });
      }
    }

    // Home content.
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    check(`[${label}] home has six section cards`, (await page.locator('.section-card').count()) === 6);
    const logoOk = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img')).every((i) => i.complete && i.naturalWidth > 0),
    );
    check(`[${label}] every image loads (club logo is the supplied file)`, logoOk);
    const logoSrc = await page.locator('.hero__logo img').getAttribute('src');
    check(`[${label}] hero shows the uploaded logo asset`, logoSrc === '/clubs/ecskc/logo.webp', logoSrc);
    const extLinks = await page.$$eval('a[target="_blank"]', (as) => as.map((a) => [a.href, a.rel]));
    check(
      `[${label}] external links open safely`,
      extLinks.length >= 2 && extLinks.every(([, rel]) => rel.includes('noopener') && rel.includes('noreferrer')),
      `${extLinks.length} links`,
    );
    check(
      `[${label}] a link to the club website is on the home page`,
      extLinks.some(([href]) => href === 'https://ecskc.eu/'),
    );

    // Menu: open, focus trap, Escape returns focus, navigate, close.
    const menuButton = page.getByRole('button', { name: 'Open the menu' });
    await menuButton.click();
    const dialog = page.getByRole('dialog', { name: 'Menu' });
    check(`[${label}] hamburger opens the menu`, await dialog.isVisible());
    const focusInside = await page.evaluate(() => !!document.activeElement.closest('#site-menu'));
    check(`[${label}] focus moves into the menu`, focusInside);
    for (let i = 0; i < 20; i++) await page.keyboard.press('Tab');
    check(`[${label}] Tab stays inside the menu`, await page.evaluate(() => !!document.activeElement.closest('#site-menu')));
    const itemTexts = await page.locator('#site-menu a').allInnerTexts();
    for (const expected of ['Home', 'Leadership', 'Trip Planning', 'Training and Skills', 'Navigation and Tides', 'VHF Radio', 'Knowledge Centre', 'My plans', 'Emergency card', 'Sources and limits']) {
      check(`[${label}] menu lists "${expected}"`, itemTexts.some((t) => t.trim().startsWith(expected)));
    }
    if (label === 'mobile') { await page.waitForTimeout(450); await page.screenshot({ path: `${OUT}/${label}-menu-open.png` }); }
    await page.keyboard.press('Escape');
    check(`[${label}] Escape closes the menu`, !(await dialog.isVisible().catch(() => false)));
    check(`[${label}] focus returns to the menu button`, await page.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Open the menu'));

    await menuButton.click();
    await page.locator('#site-menu a', { hasText: 'VHF Radio' }).click();
    await page.waitForURL('**/vhf');
    check(`[${label}] menu link navigates without reload and closes the menu`, !(await page.locator('#site-menu').count()));
    check(`[${label}] new page title is shown`, (await page.locator('main h1').innerText()) === 'VHF Radio');
    check(`[${label}] page content receives focus after navigation`, await page.evaluate(() => document.activeElement?.id === 'main'));
    await page.goBack();
    await page.waitForURL(BASE + '/');
    check(`[${label}] browser Back returns to Home`, (await page.locator('main h1').innerText()) === 'Sea Kayaking Hub');

    // Assistant: floating button on a section page.
    await page.goto(BASE + '/leadership', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Ask/ }).last().click();
    const sheet = page.getByRole('dialog', { name: 'Ask the Kayaking Assistant' });
    check(`[${label}] assistant button opens the assistant`, await sheet.isVisible());
    check(`[${label}] assistant knows the current section`, (await sheet.innerText()).includes('You are in Leadership'));
    check(`[${label}] assistant says it is not connected`, (await sheet.innerText()).includes('Not connected yet'));
    await page.getByRole('button', { name: 'Send' }).click();
    check(`[${label}] empty question shows a helpful error`, (await page.locator('#assistant-error').innerText()).includes('Type a question'));
    await page.locator('#assistant-question').fill('What should I consider before leading a trip?');
    await page.getByRole('button', { name: 'Send' }).click();
    const text = await sheet.innerText();
    check(`[${label}] question is acknowledged, not answered`, text.includes('not connected yet, so there is no answer') && text.includes('What should I consider'));
    if (label === 'mobile' || label === 'desktop') { await page.waitForTimeout(450); } if (label === 'mobile' || label === 'desktop') await page.screenshot({ path: `${OUT}/${label}-assistant.png` });
    await page.keyboard.press('Escape');
    check(`[${label}] Escape closes the assistant`, !(await sheet.isVisible().catch(() => false)));

    // Home question box seeds the assistant.
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.locator('#home-ask').fill('How do I prepare for a crossing?');
    await page.locator('.ask button[type=submit]').click();
    check(`[${label}] home question opens the assistant with the text`, (await page.locator('#assistant-question').inputValue()) === 'How do I prepare for a crossing?');
    await page.keyboard.press('Escape');

    // Unknown route.
    await page.goto(BASE + '/does-not-exist', { waitUntil: 'networkidle' });
    check(`[${label}] unknown address shows Page not found`, (await page.locator('main h1').innerText()) === 'Page not found');

    // Skip link is the first tab stop.
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.keyboard.press('Tab');
    check(`[${label}] first Tab stop is the skip link`, await page.evaluate(() => document.activeElement?.textContent?.trim() === 'Skip to content'));

    // Tap targets (44 px) for the main interactive controls.
    const small = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll('button, a.btn, .icon-btn, .drawer__link, .section-card, .fab').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width && r.height && (r.height < 43.5 || r.width < 43.5)) bad.push(`${el.className || el.tagName}:${Math.round(r.width)}x${Math.round(r.height)}`);
      });
      return bad;
    });
    check(`[${label}] buttons and cards are at least 44px`, small.length === 0, small.join(', '));

    check(`[${label}] no console errors, failed requests or CSP violations`, problems.length === 0, problems.slice(0, 5).join(' | '));
    await context.close();
  }

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('FAILED:');
    for (const f of failed) console.log(' -', f.name, f.detail);
    process.exit(1);
  }
})();
