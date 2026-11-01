// Stage 2 (Leadership) end-to-end test. Needs the built site served on BASE (default http://localhost:4173).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || path.join(__dirname, 'out', 'stage2');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
function check(name, ok, detail = '') {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -> ' + detail : ''}`);
}

const toolRoutes = ['/leadership/preparing', '/leadership/responsibilities', '/leadership/checklist', '/leadership/sheets', '/leadership/group', '/leadership/risk', '/leadership/equipment', '/leadership/review'];

async function newPage(browser, viewport = { width: 390, height: 844 }, opts = {}) {
  const context = await browser.newContext({ viewport, acceptDownloads: true, ...opts });
  const page = await context.newPage();
  const problems = [];
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && problems.push(`console ${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`));
  return { context, page, problems };
}
const keys = (page) => page.evaluate(() => Object.keys(localStorage).sort());
const waitSaved = (page) => page.waitForTimeout(700); // the debounce is 400 ms

(async () => {
  const browser = await chromium.launch();

  // 1. Visiting writes nothing.
  {
    const { context, page, problems } = await newPage(browser);
    for (const r of toolRoutes) await page.goto(BASE + r, { waitUntil: 'networkidle' });
    check('visiting every Leadership page stores nothing', (await keys(page)).length === 0, JSON.stringify(await keys(page)));
    check('no console errors or warnings while visiting', problems.length === 0, problems.join(' | '));
    await context.close();
  }

  // 2. Checklist: tick, reload, still ticked; untick; progress text.
  {
    const { context, page, problems } = await newPage(browser);
    await page.goto(BASE + '/leadership/checklist', { waitUntil: 'networkidle' });
    const boxes = page.locator('main input[type="checkbox"]');
    const total = await boxes.count();
    check('checklist has items to tick', total > 10, `count=${total}`);
    check('progress starts at 0', /^0 of \d+ ticked/.test((await page.locator('.progress-line').innerText()).trim()));
    await boxes.nth(0).check();
    await boxes.nth(2).check();
    await waitSaved(page);
    check('save status says it saved on this device', /Saved on this device at \d\d:\d\d/.test(await page.locator('.save-status').first().innerText()), await page.locator('.save-status').first().innerText());
    const k = await keys(page);
    check('only skh:ecskc:* keys are written', k.length === 1 && k[0] === 'skh:ecskc:leader-checklist', JSON.stringify(k));
    await page.reload({ waitUntil: 'networkidle' });
    check('ticks survive a reload', (await page.locator('main input[type="checkbox"]:checked').count()) === 2);
    check('progress shows 2 ticked after reload', /^2 of \d+ ticked/.test((await page.locator('.progress-line').innerText()).trim()));
    check('restored message shown', /Restored your earlier entries/.test(await page.locator('.save-status').first().innerText()));
    await page.locator('main input[type="checkbox"]').nth(0).uncheck();
    await waitSaved(page);
    await page.reload({ waitUntil: 'networkidle' });
    check('unticking is saved too', (await page.locator('main input[type="checkbox"]:checked').count()) === 1);
    // Every item names its source.
    const metas = await page.locator('.check__meta').count();
    check('every checklist item shows a source', metas === total, `${metas}/${total}`);
    // Clear with confirm.
    await page.getByRole('button', { name: 'Clear this checklist' }).click().catch(() => {});
    const clearBtn = page.getByRole('button', { name: /^Clear/ }).first();
    if (await clearBtn.count()) {
      await clearBtn.click();
      check('clear asks for confirmation first', (await page.locator('.confirm').count()) === 1);
      await page.getByRole('button', { name: 'Keep it' }).click();
      check('"Keep it" keeps the ticks', (await page.locator('main input[type="checkbox"]:checked').count()) === 1);
      await page.getByRole('button', { name: /^Clear/ }).first().click();
      await page.locator('.confirm .btn--danger').click();
      await page.waitForTimeout(200);
      check('confirmed clear removes ticks', (await page.locator('main input[type="checkbox"]:checked').count()) === 0);
      check('confirmed clear removes the stored key', (await keys(page)).length === 0, JSON.stringify(await keys(page)));
    } else {
      check('checklist page has a clear button', false);
    }
    check('no console problems on checklist', problems.length === 0, problems.join(' | '));
    await context.close();
  }

  // 3. SHEETS: fill, briefing builds, missing list, download, print, reload, clear.
  {
    const { context, page, problems } = await newPage(browser);
    await page.goto(BASE + '/leadership/sheets', { waitUntil: 'networkidle' });
    check('SHEETS shows the six headings from the source', await page.evaluate(() => ['Safety and Signals', 'Humans', 'Equipment', 'Environment', 'Timings'].every((h) => document.body.innerText.includes(h))));
    const bodyBefore = await page.locator('.briefing').innerText();
    check('briefing starts with blanks marked, not invented text', /Still to fill in \(\d+\)/.test(bodyBefore));
    await page.getByLabel(/^Trip name/).fill('Howth to Ireland’s Eye');
    await page.getByLabel(/^Leader/).first().fill('Pat Murphy');
    await page.getByLabel(/^Distance/).fill('8 nautical miles');
    await page.getByLabel('Everyone knows to keep each other in sight').check();
    await page.getByLabel(/^Expected return time/).fill('15:30');
    await waitSaved(page);
    const briefing = await page.locator('.briefing').innerText();
    check('briefing shows what was typed', briefing.includes('Howth to Ireland’s Eye') && briefing.includes('Pat Murphy') && briefing.includes('8 nautical miles') && briefing.includes('15:30'));
    check('distance is reused under Timings', (briefing.match(/8 nautical miles/g) || []).length >= 2, `count=${(briefing.match(/8 nautical miles/g) || []).length}`);
    check('briefing lists what is still missing', /Still to fill in \(\d+\)/.test(briefing) && /Date/.test(briefing));
    check('the app adds no content of its own (no "Recommended" or "Suggested")', !/Recommended|Suggested/i.test(briefing));

    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download text file' }).click()]);
    const file = path.join(OUT, 'sheets.txt');
    await dl.saveAs(file);
    const txt = fs.readFileSync(file, 'utf8');
    check('download is named from the trip', /\.txt$/.test(dl.suggestedFilename()) && /howth/i.test(dl.suggestedFilename()), dl.suggestedFilename());
    check('download contains the entries and the gaps', txt.includes('Pat Murphy') && /not filled in|to fill in|\[ \]|MISSING/i.test(txt), txt.slice(0, 200).replace(/\n/g, ' / '));
    check('download credits the source', /saturnbull/i.test(txt));

    // Print view.
    await page.emulateMedia({ media: 'print' });
    check('print hides the form', !(await page.locator('.sheets-form').isVisible()));
    check('print hides the header, footer and export buttons', !(await page.locator('.site-header').isVisible()) && !(await page.locator('.export-bar').isVisible()));
    check('print shows the briefing', await page.locator('.briefing').isVisible());
    await page.screenshot({ path: `${OUT}/sheets-print.png`, fullPage: true });
    await page.emulateMedia({ media: 'screen' });

    await page.reload({ waitUntil: 'networkidle' });
    check('SHEETS entries survive a reload', (await page.getByLabel(/^Trip name/).inputValue()) === 'Howth to Ireland’s Eye');
    check('SHEETS checkbox survives a reload', await page.getByLabel('Everyone knows to keep each other in sight').isChecked());
    await page.screenshot({ path: `${OUT}/sheets-mobile.png`, fullPage: true });
    await page.getByRole('button', { name: 'Clear this briefing' }).click();
    await page.locator('.confirm .btn--danger').click();
    await page.waitForTimeout(200);
    check('clear empties the form and the store', (await page.getByLabel(/^Trip name/).inputValue()) === '' && (await keys(page)).length === 0, JSON.stringify(await keys(page)));
    check('no console problems on SHEETS', problems.length === 0, problems.join(' | '));
    await context.close();
  }

  // 4. Risk assessment.
  {
    const { context, page, problems } = await newPage(browser);
    await page.goto(BASE + '/leadership/risk', { waitUntil: 'networkidle' });
    const addButtons = page.getByRole('button', { name: /^Add .* to the form$/ });
    const nPrompts = await addButtons.count();
    check('hazard prompts are listed, each with a source', nPrompts >= 8 && (await page.locator('.prompt-item .check__meta').count()) === nPrompts, `prompts=${nPrompts}`);
    await addButtons.first().click();
    check('adding a prompt creates a hazard row', (await page.locator('.risk-row').count()) === 1);
    check('the added prompt cannot be added twice', (await page.getByRole('button', { name: /is already on the form/ }).count()) === 1);
    await page.getByRole('button', { name: 'Add a blank hazard' }).click();
    check('a blank hazard can be added', (await page.locator('.risk-row').count()) === 2);
    await page.locator('.risk-row').first().getByLabel(/^Controls already in place/).fill('Stay inside the headland.');
    await waitSaved(page);
    check('risk assessment is saved under its own key', JSON.stringify(await keys(page)) === '["skh:ecskc:risk-assessment"]', JSON.stringify(await keys(page)));
    await page.reload({ waitUntil: 'networkidle' });
    check('risk rows and text survive a reload', (await page.locator('.risk-row').count()) === 2 && (await page.getByLabel(/^Controls already in place/).first().inputValue()) === 'Stay inside the headland.');
    check('gaps are listed', /Still to fill in/.test(await page.locator('.briefing').innerText()));
    await page.getByRole('button', { name: 'Remove hazard 2' }).click();
    check('a hazard can be removed', (await page.locator('.risk-row').count()) === 1);
    await page.emulateMedia({ media: 'print' });
    check('print shows the assessment text and hides the form', (await page.locator('.print-text').isVisible()) && !(await page.locator('.risk-row').first().isVisible()));
    await page.emulateMedia({ media: 'screen' });
    await page.screenshot({ path: `${OUT}/risk-mobile.png`, fullPage: true });
    check('no console problems on risk page', problems.length === 0, problems.join(' | '));
    await context.close();
  }

  // 5. Post-trip review.
  {
    const { context, page, problems } = await newPage(browser);
    await page.goto(BASE + '/leadership/review', { waitUntil: 'networkidle' });
    await page.getByLabel('Trip name').fill('Test trip');
    await page.getByLabel('What went well').fill('Kept the group together.');
    await page.locator('.rating-area').first().locator('summary').click();
    const sel = page.locator('.rating-area').first().locator('select').first();
    const opts = await sel.locator('option').allInnerTexts();
    check('ratings offer exactly Strong, Competent, Develop (and Not rated)', JSON.stringify(opts) === JSON.stringify(['Not rated', 'Strong', 'Competent', 'Develop']), JSON.stringify(opts));
    await sel.selectOption('Develop');
    await waitSaved(page);
    await page.reload({ waitUntil: 'networkidle' });
    check('review text and rating survive a reload', (await page.getByLabel('Trip name').inputValue()) === 'Test trip' && (await page.locator('.rating-area').first().locator('summary').innerText()).includes('1 of'));
    await page.screenshot({ path: `${OUT}/review-mobile.png`, fullPage: true });
    check('no console problems on review', problems.length === 0, problems.join(' | '));
    await context.close();
  }

  // 6. My plans: list, export, delete, import round trip, bad file refused.
  {
    const { context, page, problems } = await newPage(browser);
    await page.goto(BASE + '/leadership/checklist', { waitUntil: 'networkidle' });
    await page.locator('main input[type="checkbox"]').nth(1).check();
    await waitSaved(page);
    await page.goto(BASE + '/leadership/review', { waitUntil: 'networkidle' });
    await page.getByLabel('Trip name').fill('Round trip');
    await waitSaved(page);
    await page.goto(BASE + '/my-plans', { waitUntil: 'networkidle' });
    check('My plans lists two saved items', (await page.locator('.saved-item', { hasText: /^[\s\S]*Saved,/ }).count()) === 2, await page.locator('.saved-list').innerText());
    check('My plans says storage is on this device only', /Saved on this device only/.test(await page.locator('main').innerText()));
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download everything' }).click()]);
    const file = path.join(OUT, 'export.json');
    await dl.saveAs(file);
    const exported = JSON.parse(fs.readFileSync(file, 'utf8'));
    check('export file is valid JSON naming the app, club and 2 items', exported.app === 'sea-kayaking-hub' && exported.club === 'ecskc' && Object.keys(exported.items).length === 2, JSON.stringify(Object.keys(exported.items)));
    // Delete one with confirmation.
    await page.getByRole('button', { name: 'Delete Post-trip review' }).click();
    await page.locator('.confirm .btn--danger').click();
    check('deleting one item removes only that key', JSON.stringify(await keys(page)) === '["skh:ecskc:leader-checklist"]', JSON.stringify(await keys(page)));
    // Delete everything, then import the file.
    await page.getByRole('button', { name: 'Delete everything' }).click();
    await page.locator('.confirm .btn--danger').click();
    check('delete everything empties storage', (await keys(page)).length === 0);
    await page.setInputFiles('#import-file', file);
    await page.waitForTimeout(400);
    check('import restores both items', JSON.stringify(await keys(page)) === '["skh:ecskc:leader-checklist","skh:ecskc:post-trip-review"]', JSON.stringify(await keys(page)));
    check('import reports what it did', /Imported 2/.test(await page.locator('.export-bar__message').innerText()));
    await page.goto(BASE + '/leadership/review', { waitUntil: 'networkidle' });
    check('imported review content is back', (await page.getByLabel('Trip name').inputValue()) === 'Round trip');

    // Bad files are refused whole.
    await page.goto(BASE + '/my-plans', { waitUntil: 'networkidle' });
    const before = JSON.stringify(await page.evaluate(() => ({ ...localStorage })));
    const bads = {
      'not-json.json': 'this is not json',
      'wrong-club.json': JSON.stringify({ ...exported, club: 'other' }),
      'bad-item.json': JSON.stringify({ ...exported, items: { ...exported.items, 'sheets-briefing': { v: 1, savedAt: '2026-01-01T00:00:00Z', data: { x: { y: 1 } } } } }),
      'unknown-item.json': JSON.stringify({ ...exported, items: { ...exported.items, 'something-else': { v: 1, savedAt: '2026-01-01T00:00:00Z', data: {} } } }),
    };
    for (const [name, content] of Object.entries(bads)) {
      const f = path.join(OUT, name);
      fs.writeFileSync(f, content);
      await page.setInputFiles('#import-file', f);
      await page.waitForTimeout(300);
      const after = JSON.stringify(await page.evaluate(() => ({ ...localStorage })));
      check(`refused import changes nothing: ${name}`, after === before, (await page.locator('.export-bar__message').innerText()).slice(0, 100));
    }
    await page.screenshot({ path: `${OUT}/my-plans-mobile.png`, fullPage: true });
    const cookies = await context.cookies();
    check('no cookies set at any point', cookies.length === 0, JSON.stringify(cookies));
    check('only skh:ecskc:* keys exist', (await keys(page)).every((k) => k.startsWith('skh:ecskc:')));
    check('no console problems on My plans', problems.length === 0, problems.join(' | '));
    await context.close();
  }

  // 7. Layout and labels at 320 px with 200% text, plus blocked storage.
  {
    const { context, page, problems } = await newPage(browser, { width: 320, height: 640 });
    for (const r of toolRoutes.concat(['/my-plans'])) {
      await page.goto(BASE + r, { waitUntil: 'networkidle' });
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`${r} has no sideways scroll at 320 px with 200% text`, overflow <= 0, `overflow=${overflow}px`);
      const unlabeled = await page.evaluate(() =>
        Array.from(document.querySelectorAll('main input, main select, main textarea')).filter((el) => {
          if (el.type === 'hidden') return false;
          const byFor = el.id && document.querySelector(`label[for="${el.id}"]`);
          const wrapped = el.closest('label');
          return !(byFor || wrapped || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby'));
        }).map((el) => el.id || el.name || el.tagName),
      );
      check(`${r} every form control has a label`, unlabeled.length === 0, unlabeled.join(','));
      const small = await page.evaluate(() =>
        Array.from(document.querySelectorAll('main button, main a, main input[type="checkbox"], main select, main summary')).filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && (r.height < 24 || r.width < 24);
        }).map((el) => (el.textContent || el.id || el.tagName).trim().slice(0, 30)),
      );
      check(`${r} no touch target under 24 px`, small.length === 0, small.join(' | '));
    }
    check('no console problems at 320 px', problems.length === 0, problems.join(' | '));
    await context.close();
  }

  // 8. Browser storage blocked: the page still works and says so.
  {
    const { context, page, problems } = await newPage(browser);
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } });
    });
    await page.goto(BASE + '/leadership/checklist', { waitUntil: 'networkidle' });
    await page.locator('main input[type="checkbox"]').first().check();
    await page.waitForTimeout(700);
    check('with storage blocked, ticking still works', await page.locator('main input[type="checkbox"]').first().isChecked());
    const status = await page.locator('.save-status').first().innerText();
    check('with storage blocked, the page does not claim to have saved', !/^Saved on this device at/.test(status), status);
    await page.goto(BASE + '/my-plans', { waitUntil: 'networkidle' });
    check('My plans explains that saving is blocked', /blocking saving/.test(await page.locator('main').innerText()));
    check('no uncaught errors with storage blocked', !problems.some((p) => p.startsWith('pageerror')), problems.join(' | '));
    await context.close();
  }

  await browser.close();
  console.log(failures === 0 ? '\nAll Stage 2 checks passed.' : `\n${failures} Stage 2 check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
})();
