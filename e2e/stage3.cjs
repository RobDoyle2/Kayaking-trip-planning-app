// Stage 3 (Trip Planning) end-to-end test. Needs the built site served on BASE (default http://localhost:4173).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || path.join(__dirname, 'out', 'stage3');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
function check(name, ok, detail = '') {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -> ' + detail : ''}`);
}

async function newPage(browser, viewport = { width: 390, height: 844 }) {
  const context = await browser.newContext({ viewport, acceptDownloads: true });
  const page = await context.newPage();
  const problems = [];
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && problems.push(`console ${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`));
  return { context, page, problems };
}
const keys = (page) => page.evaluate(() => Object.keys(localStorage).sort());
const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('skh:ecskc:trips') || 'null'));
const wait = (page) => page.waitForTimeout(700);
const gapCount = async (page) => {
  const t = (await page.locator('#missing-title').innerText()).trim();
  const m = /\((\d+)\)/.exec(t);
  return m ? Number(m[1]) : 0;
};
const fill = async (page, id, value) => page.locator('#' + id).fill(value);

async function fillTripLevel(page, withCampAndStay) {
  await fill(page, 'trip-name', 'Howth to Ireland’s Eye');
  await fill(page, 'trip-leader', 'Pat Murphy');
  await fill(page, 'trip-participants', 'Ann\nBen\nCara');
  await fill(page, 'trip-shoreContact', 'Dee 087 000 0000');
  await fill(page, 'trip-groupEquipment', 'First-aid kit, tow lines');
  await fill(page, 'trip-firstAid', 'Pat');
  await fill(page, 'trip-comms', 'VHF channel 16 and 67, phones');
  await fill(page, 'trip-emergencyPlan', 'Land at the harbour');
  await fill(page, 'trip-transport', 'Two cars, shuttle');
  if (withCampAndStay === 'stay') await fill(page, 'trip-accommodation', 'Hostel night 1');
  if (withCampAndStay === 'camp') {
    await fill(page, 'trip-campGear', 'Tents');
    await fill(page, 'trip-food', 'Dinner and breakfast');
    await fill(page, 'trip-water', '3 litres each');
  }
}
async function fillDay(page, n, camp) {
  const d = `day${n}-`;
  await fill(page, d + 'date', `2026-06-${13 + n}`);
  await fill(page, d + 'launch', 'Howth');
  await fill(page, d + 'landing', 'Malahide');
  await fill(page, d + 'route', 'Round the island');
  await fill(page, d + 'distance', '8 nautical miles');
  await fill(page, d + 'estTime', '4 hours');
  await fill(page, d + 'weather', 'Dry');
  await fill(page, d + 'wind', 'F3 westerly');
  await fill(page, d + 'seaState', 'Slight');
  await fill(page, d + 'tideTimes', 'HW 10:10 UT');
  await fill(page, d + 'streams', 'none');
  if (camp) {
    await fill(page, d + 'campSite', 'Island beach');
    await fill(page, d + 'campAccess', 'Landing checked with owner');
  }
}

(async () => {
  const browser = await chromium.launch();

  // 1. Visiting writes nothing; an unknown plan says so.
  {
    const { context, page, problems } = await newPage(browser);
    for (const r of ['/trip-planning', '/trip-planning/day', '/trip-planning/multi-day', '/trip-planning/camping']) await page.goto(BASE + r, { waitUntil: 'networkidle' });
    check('visiting the trip pages stores nothing', (await keys(page)).length === 0, JSON.stringify(await keys(page)));
    await page.goto(BASE + '/trip-planning/trip/tnotthere1', { waitUntil: 'networkidle' });
    check('an unknown plan says it is not on this device', /not saved on this device/.test(await page.locator('main').innerText()));
    check('no console problems visiting', problems.length === 0, problems.join(' | '));
    problems.length = 0;
    await page.goto(BASE + '/trip-planning/trip/..%2F..%2Fx', { waitUntil: 'networkidle' });
    check('a bad plan address is handled without a crash', /Page not found|Bad request|not found/i.test(await page.locator('body').innerText()));
    check('still nothing stored', (await keys(page)).length === 0);
    check('the bad address caused no script errors', !problems.some((p) => p.startsWith('pageerror')), problems.join(' | '));
    await context.close();
  }

  // 2. Day trip: create, edit, save, reopen, delete.
  let dayTripFile;
  {
    const { context, page, problems } = await newPage(browser);
    await page.goto(BASE + '/trip-planning/day', { waitUntil: 'networkidle' });
    check('list starts empty', /No day trip plans are saved/.test(await page.locator('main').innerText()));
    await page.getByRole('button', { name: 'Start a new plan' }).click();
    await page.waitForURL(/\/trip-planning\/trip\/t[a-z0-9]+$/);
    const url = page.url();
    const id = url.split('/').pop();
    check('creating a plan opens its editor at its own address', /^t[a-z0-9]{3,24}$/.test(id), id);
    check('the new plan is saved straight away, under one key', JSON.stringify(await keys(page)) === '["skh:ecskc:trips"]', JSON.stringify(await keys(page)));
    const startGaps = await gapCount(page);
    check('a new plan lists what is missing', startGaps >= 15, `gaps=${startGaps}`);
    check('no day tabs for a day trip', (await page.locator('.day-tab').count()) === 0);
    check('day trip has no accommodation or camping fields', (await page.locator('#trip-accommodation, #trip-campGear, #day1-campSite').count()) === 0);
    await fill(page, 'trip-name', 'Howth loop');
    await fill(page, 'day1-launch', 'Howth');
    await wait(page);
    check('filling two fields removes two gaps', (await gapCount(page)) === startGaps - 2, `${startGaps} -> ${await gapCount(page)}`);
    check('save status says saved on this device', /Saved on this device at \d\d:\d\d/.test(await page.locator('.save-status').first().innerText()));
    await page.reload({ waitUntil: 'networkidle' });
    check('edits survive a reload', (await page.locator('#trip-name').inputValue()) === 'Howth loop' && (await page.locator('#day1-launch').inputValue()) === 'Howth');
    check('gap count survives a reload', (await gapCount(page)) === startGaps - 2);
    const rec = await stored(page);
    check('stored data names the source of typed values only', rec.data[id].sources.name === 'user' && rec.data[id].days[0].sources.launch === 'user' && !rec.data[id].sources.leader, JSON.stringify(rec.data[id].sources));

    // The gap list jumps to the field.
    await page.getByRole('button', { name: 'Trip: Leader', exact: true }).click();
    check('a gap link moves focus to its field', (await page.evaluate(() => document.activeElement && document.activeElement.id)) === 'trip-leader');

    // Fill everything in.
    await fillTripLevel(page);
    await fillDay(page, 1, false);
    await wait(page);
    check('with every required field filled, nothing is missing', (await gapCount(page)) === 0 && /Nothing missing/.test(await page.locator('#missing-title').innerText()), await page.locator('#missing-title').innerText());
    check('"nothing missing" does not claim the plan is safe', /does not mean the plan is complete or safe/.test(await page.locator('.missing-box').innerText()));
    const planText = await page.locator('.plan-view').innerText();
    check('the plan shows the typed values and a formatted date', planText.includes('Howth to Ireland’s Eye') && planText.includes('Sunday 14 June 2026') && planText.includes('F3 westerly'));
    check('the plan adds nothing of its own', !/Recommended|Suggested|We suggest/i.test(planText));

    // Stops.
    await page.getByRole('button', { name: 'Add a stop' }).click();
    await page.getByRole('button', { name: 'Add a stop' }).click();
    await fill(page, 'day1-stop1-place', 'Ireland’s Eye');
    await fill(page, 'day1-stop1-eta', '10:30');
    await fill(page, 'day1-stop1-etd', '11:00');
    await fill(page, 'day1-stop2-place', 'Back at Howth');
    await page.getByRole('button', { name: 'Remove stop 2' }).click();
    await wait(page);
    const planAfterStops = await page.locator('.plan-view').innerText();
    check('stops appear in the plan with times; a removed stop does not', planAfterStops.includes('Ireland’s Eye') && planAfterStops.includes('ETA 10:30') && planAfterStops.includes('ETD 11:00') && !planAfterStops.includes('Back at Howth'));

    // Limit check.
    check('the limit check is off by default and shows no fields', (await page.locator('#limits-on').isChecked()) === false && (await page.locator('#trip-lim-crossing').count()) === 0);
    check('the plan has no limit section while it is off', !/Award limit check/.test(await page.locator('.plan-view').innerText()));
    await page.locator('#limits-on').check();
    check('switching it on adds four needed fields to the gap list', (await gapCount(page)) === 4, `gaps=${await gapCount(page)}`);
    await fill(page, 'trip-lim-landing', '1.5');
    await fill(page, 'trip-lim-crossing', '3');
    await fill(page, 'trip-lim-stream', '2');
    await fill(page, 'trip-lim-beaufort', '4');
    const findings = await page.locator('.limit-findings').innerText();
    check('over-the-limit value is flagged, equal-to-limit values are not', /3 NM is above the award limit of 2 NM/.test(findings) && /2 kn is within/.test(findings) && /Beaufort force 4 is within/.test(findings) && /1\.5 NM is within/.test(findings), findings.replace(/\n/g, ' | '));
    await page.locator('#trip-lim-race').check();
    check('ticking a race flags it', /tide race or overfalls is on the route/i.test(await page.locator('.limit-findings').innerText()));
    check('the check never says safe or unsafe', !/\bsafe\b|\bunsafe\b|\bdangerous\b/i.test(await page.locator('.limit-findings').innerText()));
    check('the limit section prints with its source and caution', /BCAB/.test(await page.locator('.plan-view').innerText()) && /never says a trip is safe or unsafe/.test(await page.locator('.plan-view').innerText()));
    await fill(page, 'trip-lim-crossing', 'about 3');
    check('a value that is not a number is reported, not guessed', /not a number/.test(await page.locator('.limit-findings').innerText()));

    // Final checklist.
    const legend = () => page.locator('legend', { hasText: 'Final planning checklist' }).innerText();
    check('final checklist starts at 0 ticked', /\(0 of \d+ ticked\)/.test(await legend()));
    await page.locator('input[id^="final-"]').nth(0).check();
    await page.locator('input[id^="final-"]').nth(1).check();
    check('ticking updates the count', /\(2 of \d+ ticked\)/.test(await legend()));
    check('every checklist item names its source', (await page.locator('fieldset:has(legend:text("Final planning checklist")) .check__meta').count()) === (await page.locator('input[id^="final-"]').count()));
    await wait(page);
    await page.reload({ waitUntil: 'networkidle' });
    check('checklist ticks and limit settings survive a reload', /\(2 of \d+ ticked\)/.test(await legend()) && (await page.locator('#limits-on').isChecked()) && (await page.locator('#trip-lim-race').isChecked()));

    // Print view.
    await page.emulateMedia({ media: 'print' });
    check('print hides the form, header and buttons', !(await page.locator('form').isVisible()) && !(await page.locator('.site-header').isVisible()) && !(await page.locator('.export-bar').isVisible()));
    check('print shows the plan', await page.locator('.plan-view').isVisible());
    await page.screenshot({ path: `${OUT}/day-print.png`, fullPage: true });
    await page.emulateMedia({ media: 'screen' });

    // Downloads.
    const [pdfDl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PDF' }).click()]);
    const pdfFile = path.join(OUT, 'day.pdf');
    await pdfDl.saveAs(pdfFile);
    check('the PDF is named from the trip', /^howth-loop|^howth-to/.test(pdfDl.suggestedFilename()) && /\.pdf$/.test(pdfDl.suggestedFilename()), pdfDl.suggestedFilename());
    let qpdfOk = true;
    try { execFileSync('qpdf', ['--check', pdfFile], { stdio: 'pipe' }); } catch (e) { qpdfOk = false; console.log(String(e.stdout || e.message).slice(0, 300)); }
    check('qpdf finds the PDF structurally valid', qpdfOk);
    const info = execFileSync('pdfinfo', [pdfFile]).toString();
    check('pdfinfo reads it, A4, with the trip as title', /Pages:\s+\d+/.test(info) && /A4/.test(info) && /Title:\s+Howth to Ireland/.test(info), info.split('\n').filter((l) => /Title|Pages|Page size/.test(l)).join(' | '));
    const pdfText = execFileSync('pdftotext', ['-layout', pdfFile, '-']).toString();
    check('the PDF text has the title, a field, the date, a stop and the checklist count', /Howth to Ireland’s Eye/.test(pdfText) && /Launch place: Howth/.test(pdfText.replace(/\s+/g, ' ')) && /Sunday 14 June 2026/.test(pdfText) && /Ireland’s Eye/.test(pdfText) && /Final planning checklist/.test(pdfText) && /2 of \d+/.test(pdfText), pdfText.slice(0, 120).replace(/\n/g, ' / '));
    check('the PDF has the limit section with its caution', /Award limit check/.test(pdfText) && /never says a trip is safe or unsafe/.test(pdfText.replace(/\s+/g, ' ')));
    fs.writeFileSync(path.join(OUT, 'day-pdf.txt'), pdfText);

    const [txtDl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download text file' }).click()]);
    await txtDl.saveAs(path.join(OUT, 'day.txt'));
    const txt = fs.readFileSync(path.join(OUT, 'day.txt'), 'utf8');
    check('text file has the entries and no invented content', txt.includes('Trip name: Howth to Ireland’s Eye') && txt.includes('Leader: Pat Murphy') && !/Recommended|Suggested/.test(txt));

    const [jsonDl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download trip file' }).click()]);
    dayTripFile = path.join(OUT, 'day-trip-file.json');
    await jsonDl.saveAs(dayTripFile);
    const tf = JSON.parse(fs.readFileSync(dayTripFile, 'utf8'));
    check('trip file is the app export format with exactly this trip', tf.app === 'sea-kayaking-hub' && tf.club === 'ecskc' && Object.keys(tf.items).join() === 'trips' && Object.keys(tf.items.trips.data).join() === id);

    // List shows it; open; delete.
    await page.goto(BASE + '/trip-planning/day', { waitUntil: 'networkidle' });
    const row = page.locator('.saved-item').first();
    check('the saved plan is listed with its name and what is left', /Howth to Ireland’s Eye/.test(await row.innerText()) && /Nothing missing|still to fill in/.test(await row.innerText()), (await row.innerText()).replace(/\n/g, ' '));
    await page.screenshot({ path: `${OUT}/list-mobile.png`, fullPage: true });
    await row.getByRole('link', { name: /Howth to Ireland/ }).click();
    await page.waitForURL(/\/trip-planning\/trip\//);
    check('reopening a plan shows what was saved', (await page.locator('#trip-name').inputValue()) === 'Howth to Ireland’s Eye' && (await page.locator('#day1-streams').inputValue()) === 'none');
    await page.screenshot({ path: `${OUT}/editor-mobile.png`, fullPage: true });
    await page.goBack();
    await page.getByRole('button', { name: /^Delete / }).click();
    check('delete asks first', (await page.locator('.confirm').count()) === 1);
    await page.locator('.confirm .btn--danger').click();
    await page.waitForTimeout(300);
    check('delete removes the plan from the list and from storage', /No day trip plans are saved/.test(await page.locator('main').innerText()) && Object.keys((await stored(page)).data).length === 0);
    check('no cookies, only skh keys', (await context.cookies()).length === 0 && (await keys(page)).every((k) => k.startsWith('skh:ecskc:')));
    check('no console problems on the day trip flow', problems.length === 0, problems.join(' | '));
    await context.close();
  }

  // 3. Multi-day and camping.
  {
    const { context, page, problems } = await newPage(browser);
    await page.goto(BASE + '/trip-planning/multi-day', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Start a new plan' }).click();
    await page.waitForURL(/\/trip-planning\/trip\//);
    await page.waitForSelector('#trip-name');
    check('multi-day starts with two day tabs', (await page.locator('.day-tab').count()) === 2);
    check('multi-day has accommodation and not camping gear', (await page.locator('#trip-accommodation').count()) === 1 && (await page.locator('#trip-campGear').count()) === 0);
    const tabsText = await page.locator('.day-tabs').innerText();
    check('day tabs say how much is left on each day', /Day 1 \(\d+ to fill in\)/.test(tabsText) && /Day 2 \(\d+ to fill in\)/.test(tabsText), tabsText.replace(/\n/g, ' '));
    const gapsText = await page.locator('.missing-box').innerText();
    check('gaps name the day they belong to', /Day 1: Launch place/.test(gapsText) && /Day 2: Launch place/.test(gapsText));
    await page.getByRole('button', { name: 'Day 2: Wind', exact: true }).click();
    await page.waitForTimeout(200);
    check('a gap link on another day switches to that day and focuses the field', (await page.evaluate(() => document.activeElement && document.activeElement.id)) === 'day2-wind' && /Day 2/.test(await page.locator('#day-heading').innerText()));
    await page.getByRole('button', { name: 'Add a day' }).click();
    check('a day can be added', (await page.locator('.day-tab').count()) === 3 && /Day 3/.test(await page.locator('#day-heading').innerText()));
    await fill(page, 'day3-launch', 'Day three launch');
    await page.getByRole('button', { name: 'Remove day 3' }).click();
    check('removing a day asks first', (await page.locator('.confirm').count()) === 1);
    await page.locator('.confirm .btn--danger').click();
    check('a removed day is gone', (await page.locator('.day-tab').count()) === 2);
    check('a plan never drops below two days', (await page.getByRole('button', { name: /^Remove day/ }).count()) === 0);
    await fillTripLevel(page, 'stay');
    await page.locator('.day-tab').nth(0).click();
    await fillDay(page, 1, false);
    await page.locator('.day-tab').nth(1).click();
    await fillDay(page, 2, false);
    await wait(page);
    check('a filled multi-day plan has nothing missing', (await gapCount(page)) === 0, `gaps=${await gapCount(page)}`);
    const plan = await page.locator('.plan-view').innerText();
    check('the plan prints each day under its own heading', /Day 1: Route/.test(plan) && /Day 2: Route/.test(plan) && /Accommodation/.test(plan) && !/Camping gear/.test(plan));
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PDF' }).click()]);
    await dl.saveAs(path.join(OUT, 'multi.pdf'));
    const t = execFileSync('pdftotext', ['-layout', path.join(OUT, 'multi.pdf'), '-']).toString().replace(/\s+/g, ' ');
    check('the multi-day PDF has both days', /Day 1: Route/.test(t) && /Day 2: Route/.test(t));
    check('the multi-day PDF is valid', (() => { try { execFileSync('qpdf', ['--check', path.join(OUT, 'multi.pdf')], { stdio: 'pipe' }); return true; } catch { return false; } })());
    await page.screenshot({ path: `${OUT}/multi-mobile.png`, fullPage: true });

    // Camping.
    await page.goto(BASE + '/trip-planning/camping', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Start a new plan' }).click();
    await page.waitForURL(/\/trip-planning\/trip\//);
    await page.waitForSelector('#trip-name');
    check('camping has camp gear, food, water and a camp for each day, and no accommodation', (await page.locator('#trip-campGear, #trip-food, #trip-water').count()) === 3 && (await page.locator('#day1-campSite').count()) === 1 && (await page.locator('#trip-accommodation').count()) === 0);
    check('camping says no camping kit list was supplied', /has not supplied a camping kit list/.test(await page.locator('main').innerText()));
    await fillTripLevel(page, 'camp');
    await page.locator('.day-tab').nth(0).click();
    await fillDay(page, 1, true);
    await page.locator('.day-tab').nth(1).click();
    await fillDay(page, 2, true);
    await wait(page);
    check('a filled camping plan has nothing missing', (await gapCount(page)) === 0, `gaps=${await gapCount(page)}`);
    check('camp details appear in the plan', /Island beach/.test(await page.locator('.plan-view').innerText()) && /Tents/.test(await page.locator('.plan-view').innerText()));

    // Lists are per type.
    await page.goto(BASE + '/trip-planning/day', { waitUntil: 'networkidle' });
    check('the day trip list does not show other kinds of trip', /No day trip plans are saved/.test(await page.locator('main').innerText()));
    await page.goto(BASE + '/trip-planning/camping', { waitUntil: 'networkidle' });
    check('the camping list shows the camping plan', (await page.locator('.saved-item').count()) === 1);
    check('no console problems on multi-day and camping', problems.length === 0, problems.join(' | '));

    // 4. Import merges a trip file back without removing other plans.
    await page.goto(BASE + '/my-plans', { waitUntil: 'networkidle' });
    check('My plans lists trip plans as saved', /Trip plans\s+Saved/.test((await page.locator('.saved-list').innerText()).replace(/\n+/g, ' ')), (await page.locator('.saved-list').innerText()).replace(/\n+/g, ' ').slice(0, 200));
    const before = Object.keys((await stored(page)).data).length;
    await page.setInputFiles('#import-file', dayTripFile);
    await page.waitForTimeout(400);
    const after = await stored(page);
    check('importing a trip file adds that plan and keeps the others', Object.keys(after.data).length === before + 1, `${before} -> ${Object.keys(after.data).length}`);
    check('the import message reports it', /Imported 1/.test(await page.locator('.export-bar__message').innerText()), await page.locator('.export-bar__message').innerText());
    await page.setInputFiles('#import-file', dayTripFile);
    await page.waitForTimeout(400);
    check('importing the same file again replaces rather than duplicates', Object.keys((await stored(page)).data).length === before + 1);
    // A damaged trip file is refused whole.
    const good = JSON.parse(fs.readFileSync(dayTripFile, 'utf8'));
    const bad = JSON.parse(JSON.stringify(good));
    const tid = Object.keys(bad.items.trips.data)[0];
    bad.items.trips.data[tid].type = 'kayak';
    const badFile = path.join(OUT, 'bad-trip.json');
    fs.writeFileSync(badFile, JSON.stringify(bad));
    const snapshot = JSON.stringify(await page.evaluate(() => ({ ...localStorage })));
    await page.setInputFiles('#import-file', badFile);
    await page.waitForTimeout(300);
    check('a damaged trip file is refused and changes nothing', JSON.stringify(await page.evaluate(() => ({ ...localStorage }))) === snapshot, await page.locator('.export-bar__message').innerText());
    const hostile = JSON.parse(JSON.stringify(good));
    hostile.items.trips.data[tid].values = { name: '<img src=x onerror=alert(1)>' };
    hostile.items.trips.data[tid].days[0].values = { launch: '<script>alert(1)</script>' };
    const hostileFile = path.join(OUT, 'hostile-trip.json');
    fs.writeFileSync(hostileFile, JSON.stringify(hostile));
    await page.setInputFiles('#import-file', hostileFile);
    await page.waitForTimeout(300);
    await page.goto(BASE + '/trip-planning/trip/' + tid, { waitUntil: 'networkidle' });
    check('markup typed into a plan is shown as text, never run', (await page.locator('img[src="x"]').count()) === 0 && /<script>alert\(1\)<\/script>/.test(await page.locator('.plan-view').innerText()));
    check('no alert dialogs or errors from hostile text', problems.length === 0, problems.join(' | '));
    await context.close();
  }

  // 5. Layout and labels at 320 px with 200% text.
  {
    const { context, page, problems } = await newPage(browser, { width: 320, height: 640 });
    await page.goto(BASE + '/trip-planning/camping', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Start a new plan' }).click();
    await page.waitForURL(/\/trip-planning\/trip\//);
    await fill(page, 'trip-name', 'A'.repeat(300));
    await fill(page, 'trip-participants', 'Supercalifragilisticexpialidocious '.repeat(8) + 'x'.repeat(200));
    await page.locator('#limits-on').check();
    await page.getByRole('button', { name: 'Add a stop' }).click();
    const routes = ['/trip-planning', '/trip-planning/day', '/trip-planning/multi-day', '/trip-planning/camping', page.url().replace(BASE, '')];
    for (const r of routes) {
      await page.goto(BASE + r, { waitUntil: 'networkidle' });
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`${r.replace(/t[a-z0-9]{8,}$/, 't…')} has no sideways scroll at 320 px with 200% text`, overflow <= 0, `overflow=${overflow}px`);
      const unlabeled = await page.evaluate(() =>
        Array.from(document.querySelectorAll('main input, main select, main textarea')).filter((el) => {
          const byFor = el.id && document.querySelector(`label[for="${el.id}"]`);
          return !(byFor || el.closest('label') || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby'));
        }).map((el) => el.id || el.tagName),
      );
      check(`${r.replace(/t[a-z0-9]{8,}$/, 't…')} every form control has a label`, unlabeled.length === 0, unlabeled.join(','));
      const small = await page.evaluate(() =>
        Array.from(document.querySelectorAll('main button, main a, main input[type="checkbox"], main select, main summary')).filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && (r.height < 24 || r.width < 24);
        }).map((el) => (el.textContent || el.id || el.tagName).trim().slice(0, 30)),
      );
      check(`${r.replace(/t[a-z0-9]{8,}$/, 't…')} no touch target under 24 px`, small.length === 0, small.join(' | '));
    }
    check('no console problems at 320 px', problems.length === 0, problems.join(' | '));
    await context.close();
  }

  // 6. Storage blocked.
  {
    const { context, page, problems } = await newPage(browser);
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } });
    });
    await page.goto(BASE + '/trip-planning/day', { waitUntil: 'networkidle' });
    check('with storage blocked, starting a plan is switched off and says why', (await page.getByRole('button', { name: 'Start a new plan' }).isDisabled()) && /switched off because this browser is not letting the app save/.test(await page.locator('main').innerText()));
    check('no uncaught errors with storage blocked', !problems.some((p) => p.startsWith('pageerror')), problems.join(' | '));
    await context.close();
  }

  await browser.close();
  console.log(failures === 0 ? '\nAll Stage 3 checks passed.' : `\n${failures} Stage 3 check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
})();
