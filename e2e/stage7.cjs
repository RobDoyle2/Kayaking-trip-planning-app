// Simplified first version + My links, end to end. Needs the NORMAL build (no assistant) served on BASE (default http://localhost:4173):
//   npm run build && node scripts/serve.mjs dist 4173 &
//   node e2e/stage7.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || path.join(__dirname, 'out', 'stage7');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
let total = 0;
function check(name, ok, detail = '') {
  total++;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -> ' + String(detail).slice(0, 220) : ''}`);
}

async function newPage(browser, viewport = { width: 390, height: 844 }) {
  const context = await browser.newContext({ viewport, acceptDownloads: true });
  const page = await context.newPage();
  const problems = [];
  const requests = [];
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && problems.push(`console ${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`));
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method(), body: r.postData() || '' }));
  page.on('dialog', (d) => {
    problems.push(`dialog opened: ${d.message()}`);
    d.dismiss().catch(() => {});
  });
  return { context, page, problems, requests };
}
const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('skh:ecskc:links') || 'null'));
const settle = (page) => page.waitForTimeout(700);
const bigText = (page) => page.evaluate(() => document.documentElement.style.setProperty('font-size', '200%', 'important'));
const overflows = (page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

async function addLink(page, { address, note, section }) {
  await page.getByLabel(/Web address/).fill(address);
  await page.getByLabel('Your note about it').fill(note ?? '');
  await page.getByLabel('Section').selectOption({ label: section });
  await page.getByRole('button', { name: 'Add link' }).click();
  await settle(page);
}

(async () => {
  const browser = await chromium.launch();
  const { context, page, problems, requests } = await newPage(browser);

  // ---------- Home ----------
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const bigLabels = await page.locator('.card-grid--home .section-card__title').allInnerTexts();
  check('home has exactly three big buttons, in the order Trip Planning, Leadership, Training and Skills', JSON.stringify(bigLabels) === JSON.stringify(['Trip Planning', 'Leadership', 'Training and Skills']), JSON.stringify(bigLabels));
  const mainText = await page.locator('main').innerText();
  check('home has no "Ask the Kayaking Assistant" box', !/Ask the (Kayaking )?Assistant/i.test(await page.locator('body').innerText()));
  check('home has no question box or Ask button', (await page.locator('main input, main textarea').count()) === 0 && (await page.getByRole('button', { name: /^Ask/ }).count()) === 0);
  check('home has no floating assistant button', (await page.locator('.fab').count()) === 0);
  check('home main area has no "Visit the club website" link', !/Visit the club website/.test(mainText) && (await page.locator('main a[href^="http"]').count()) === 0);
  check('home main area has no Emergency card button', (await page.locator('main a[href="/emergency"]').count()) === 0 && !/Emergency card/.test(mainText));
  check('home does not say "Six sections"', !/Six sections/.test(mainText));
  const noticeBox = await page.locator('main .notice').boundingBox();
  const lastCard = await page.locator('.card-grid--home li').last().boundingBox();
  check('the caution is below the three buttons (at the end of the screen)', noticeBox && lastCard && noticeBox.y > lastCard.y + lastCard.height - 1, JSON.stringify({ notice: noticeBox?.y, last: lastCard?.y }));
  const noticeFont = await page.locator('main .notice__body').evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  const bodyFont = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
  check('the caution text is smaller than body text', noticeFont < bodyFont, `${noticeFont}px vs ${bodyFont}px`);
  check('the caution still says the content is not approved', /not yet approved/i.test(await page.locator('main .notice').innerText()));
  const stageLines = await page.locator('.card-grid--home .section-card__stage').count();
  check('the big buttons carry no build-stage line', stageLines === 0);
  const firstCardTop = lastCard ? (await page.locator('.card-grid--home li').first().boundingBox()).y : 0;
  check('the first big button is visible without scrolling on a phone', firstCardTop + 60 < 844, `top ${Math.round(firstCardTop)}px`);
  await page.screenshot({ path: `${OUT}/home-mobile.png`, fullPage: true });
  check('home does not scroll sideways at 390px', !(await overflows(page)));

  // Home buttons go where they say.
  for (const [label, href, h1] of [['Trip Planning', '/trip-planning', 'Trip Planning'], ['Leadership', '/leadership', 'Leadership'], ['Training and Skills', '/training', 'Training and Skills']]) {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.locator('.card-grid--home a', { hasText: label }).click();
    await page.waitForSelector('h1');
    check(`the ${label} button opens ${href}`, new URL(page.url()).pathname === href && (await page.locator('h1').innerText()) === h1, page.url());
  }

  // ---------- Menu ----------
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Open the menu' }).click();
  const menuLabels = await page.locator('#site-menu .drawer__link span').allInnerTexts();
  check('the menu lists Home, the three sections, VHF Radio and Knowledge Centre, then Emergency card, My plans and Sources', JSON.stringify(menuLabels) === JSON.stringify(['Home', 'Trip Planning', 'Leadership', 'Training and Skills', 'VHF Radio', 'Knowledge Centre', 'Emergency card', 'My plans', 'Sources and limits']), JSON.stringify(menuLabels));
  check('Navigation and Tides is not a separate menu item (it is inside Trip Planning)', !menuLabels.includes('Navigation and Tides'));
  await page.locator('#site-menu a', { hasText: 'Emergency card' }).click();
  await page.waitForSelector('h1');
  check('Emergency card opens from the menu and shows the emergency numbers', (await page.locator('h1').innerText()) === 'Emergency card' && /999 or 112/.test(await page.locator('main').innerText()));
  await page.getByRole('button', { name: 'Open the menu' }).click();
  await page.locator('#site-menu a', { hasText: 'VHF Radio' }).click();
  await page.waitForSelector('h1');
  check('VHF Radio opens from the menu', new URL(page.url()).pathname === '/vhf');
  await page.getByRole('button', { name: 'Open the menu' }).click();
  await page.locator('#site-menu a', { hasText: 'Knowledge Centre' }).click();
  await page.waitForSelector('h1');
  check('Knowledge Centre opens from the menu', new URL(page.url()).pathname === '/knowledge' && (await page.locator('h1').innerText()) === 'Knowledge Centre');
  const kText = await page.locator('main').innerText();
  check('Knowledge Centre does not offer an assistant', !/Ask the Kayaking Assistant|assistant needs|Claude API/i.test(kText), kText.slice(0, 160));
  await page.goto(BASE + '/knowledge/search', { waitUntil: 'networkidle' });
  await page.getByLabel('Search the documents').first().fill('slack water');
  await page.waitForTimeout(500);
  check('the Knowledge Centre search still works with no AI', (await page.locator('.item-card').count()) > 0);
  check('search results have no "Ask the assistant" button', (await page.getByRole('button', { name: /Ask the Kayaking Assistant/ }).count()) === 0);

  // ---------- Trip Planning page ----------
  await page.goto(BASE + '/trip-planning', { waitUntil: 'networkidle' });
  const headings = await page.locator('main h2').allInnerTexts();
  check('Trip Planning lists VHF Radio and Navigation and Tides before the trip types', headings.indexOf('Radio, tides and navigation') === 0 && headings.indexOf('Day trip') > 0, JSON.stringify(headings));
  const insideCards = await page.locator('#inside-title ~ ul .section-card__title').allInnerTexts();
  check('VHF Radio is first, then Navigation and Tides', JSON.stringify(insideCards) === JSON.stringify(['VHF Radio', 'Navigation and Tides']), JSON.stringify(insideCards));
  const vhfTop = (await page.locator('#inside-title ~ ul a', { hasText: 'VHF Radio' }).boundingBox()).y;
  const dayTop = (await page.locator('h2', { hasText: /^Day trip$/ }).boundingBox()).y;
  check('the VHF card is above the first trip type', vhfTop < dayTop);
  await page.locator('#inside-title ~ ul a', { hasText: 'VHF Radio' }).click();
  await page.waitForSelector('h1');
  check('VHF card opens /vhf with a way back to Trip Planning', new URL(page.url()).pathname === '/vhf' && (await page.locator('.crumb a').innerText()) === 'Trip Planning');
  await page.locator('.crumb a').click();
  await page.waitForSelector('h1');
  check('the way back goes to Trip Planning', new URL(page.url()).pathname === '/trip-planning');
  await page.locator('#inside-title ~ ul a', { hasText: 'Navigation and Tides' }).click();
  await page.waitForSelector('h1');
  check('Navigation and Tides opens with a way back to Trip Planning', new URL(page.url()).pathname === '/navigation' && (await page.locator('.crumb a').innerText()) === 'Trip Planning');
  await page.goto(BASE + '/navigation/tools', { waitUntil: 'networkidle' });
  check('a navigation tool page still opens', /calculators|worksheet/i.test(await page.locator('h1').innerText()));
  await page.goto(BASE + '/leadership', { waitUntil: 'networkidle' });
  check('Leadership has no "inside" section cards', (await page.locator('#inside-title').count()) === 0 && (await page.locator('.crumb a').innerText()) === 'Home');

  // ---------- My links: empty state, then bad input ----------
  await page.goto(BASE + '/trip-planning/links', { waitUntil: 'networkidle' });
  check('My links opens with a way back to Trip Planning', (await page.locator('h1').innerText()) === 'My links' && (await page.locator('.crumb a').innerText()) === 'Trip Planning');
  check('My links says it is kept on this device only and not shared', /Kept on this device only/.test(await page.locator('main').innerText()) && /not shared with the club/.test(await page.locator('main').innerText()));
  check('the page offers the four sections in the choice', JSON.stringify(await page.getByLabel('Section').locator('option').allInnerTexts()) === JSON.stringify(['Trip Planning', 'Leadership', 'Training and Skills', 'Other']));
  check('an empty list says so, and nothing is saved yet', /No links are saved/.test(await page.locator('main').innerText()) && (await stored(page)) === null);

  for (const bad of ['', 'javascript:alert(1)', 'data:text/html,<b>x</b>', 'hello', 'https://user:pw@example.org/', 'ftp://example.org/f', 'mailto:a@b.ie']) {
    await page.getByLabel(/Web address/).fill(bad);
    await page.getByRole('button', { name: 'Add link' }).click();
    await page.waitForTimeout(150);
    const msg = await page.locator('#link-problem').innerText().catch(() => '');
    check(`refused: ${JSON.stringify(bad)}`, msg.length > 5 && (await stored(page)) === null, msg);
  }
  check('the problem is announced and the field is marked invalid', (await page.locator('#link-problem[role="alert"]').count()) === 1 && (await page.getByLabel(/Web address/).getAttribute('aria-invalid')) === 'true');
  check('focus goes back to the address field after a problem', await page.evaluate(() => document.activeElement && document.activeElement.id === 'link-address'));
  await page.screenshot({ path: `${OUT}/links-problem.png` });

  // ---------- My links: add ----------
  await page.getByLabel(/Web address/).fill('');
  await addLink(page, { address: 'www.canoe.ie/sea-kayak', note: 'Canoeing Ireland sea kayak awards', section: 'Training and Skills' });
  let saved = await stored(page);
  check('a link is saved in this browser with https added', saved && saved.data.length === 1 && saved.data[0].url === 'https://www.canoe.ie/sea-kayak' && saved.data[0].category === 'training', JSON.stringify(saved));
  check('the form is cleared after adding, and the page says what was added', (await page.getByLabel(/Web address/).inputValue()) === '' && /Added “Canoeing Ireland sea kayak awards” under Training and Skills/.test(await page.locator('.export-bar__message').innerText()));
  const a = page.locator('.saved-item a', { hasText: 'Canoeing Ireland sea kayak awards' });
  check('the link opens in a new tab, safely', (await a.getAttribute('target')) === '_blank' && /noopener/.test(await a.getAttribute('rel')) && (await a.getAttribute('href')) === 'https://www.canoe.ie/sea-kayak');
  check('the site name is shown under the link', (await page.locator('.saved-item .muted', { hasText: 'canoe.ie' }).count()) === 1);

  // Enter in the address box submits the form.
  await page.getByLabel(/Web address/).fill('https://www.met.ie/forecasts/marine-inland-lakes');
  await page.getByLabel('Section').selectOption({ label: 'Trip Planning' });
  await page.getByLabel('Your note about it').fill('Met Éireann marine forecast');
  await page.getByLabel(/Web address/).press('Enter');
  await settle(page);
  check('pressing Enter in the address box adds the link', (await stored(page)).data.length === 2);

  await addLink(page, { address: 'ecskc.eu', note: '', section: 'Leadership' });
  check('a link with no note shows the site name as its text', (await page.locator('.saved-item a', { hasText: /^ecskc\.eu/ }).count()) === 1);
  await addLink(page, { address: 'https://example.org/misc', note: 'Something else', section: 'Other' });
  saved = await stored(page);
  check('four links saved, one in each section', saved.data.length === 4 && new Set(saved.data.map((l) => l.category)).size === 4, JSON.stringify(saved.data.map((l) => l.category)));
  const groupHeads = await page.locator('.links-group h3').allInnerTexts();
  check('the list is grouped by section in the order Trip Planning, Leadership, Training and Skills, Other', JSON.stringify(groupHeads) === JSON.stringify(['Trip Planning (1)', 'Leadership (1)', 'Training and Skills (1)', 'Other (1)']), JSON.stringify(groupHeads));
  check('the list heading counts the links', /Your links \(4\)/.test(await page.locator('#links-saved').innerText()));
  await page.screenshot({ path: `${OUT}/links-list.png`, fullPage: true });

  // Hostile text is shown as text.
  await addLink(page, { address: 'https://example.org/x', note: '<img src=x onerror=alert(1)><b>bold</b>', section: 'Other' });
  check('markup in a note is shown as plain text', (await page.locator('main img[src="x"]').count()) === 0 && (await page.locator('.saved-item a', { hasText: '<img src=x onerror=alert(1)>' }).count()) === 1);

  // ---------- Shown in the matching section ----------
  const onPage = async (p) => {
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    return (await page.locator('.my-links').innerText().catch(() => '')) || '';
  };
  let t = await onPage('/trip-planning');
  check('Trip Planning page shows its own link and no other', /Met Éireann marine forecast/.test(t) && !/Canoeing Ireland/.test(t) && !/ecskc\.eu/.test(t) && !/Something else/.test(t), t.replace(/\n/g, ' | '));
  t = await onPage('/leadership');
  check('Leadership page shows its own link (site name, no note) and no other', /ecskc\.eu/.test(t) && !/Met Éireann/.test(t) && !/Canoeing Ireland/.test(t), t.replace(/\n/g, ' | '));
  t = await onPage('/training');
  check('Training and Skills page shows its own link and no other', /Canoeing Ireland sea kayak awards/.test(t) && !/Met Éireann/.test(t) && !/ecskc\.eu/.test(t), t.replace(/\n/g, ' | '));
  check('the section link opens in a new tab safely', (await page.locator('.my-links a', { hasText: 'Canoeing Ireland' }).getAttribute('target')) === '_blank');
  for (const p of ['/', '/trip-planning', '/leadership', '/training', '/navigation', '/vhf', '/knowledge']) {
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    check(`"Other" links appear on no section page (${p})`, !/Something else/.test(await page.locator('main').innerText()));
  }
  await page.goto(BASE + '/trip-planning', { waitUntil: 'networkidle' });
  await page.locator('.my-links a', { hasText: 'Add or change links' }).click();
  await page.waitForSelector('h1');
  check('"Add or change links" on a section page opens My links', new URL(page.url()).pathname === '/trip-planning/links');

  // ---------- Persist across reload ----------
  await page.reload({ waitUntil: 'networkidle' });
  check('links are still there after a reload', /Your links \(5\)/.test(await page.locator('#links-saved').innerText()));

  // ---------- Change ----------
  await page.getByRole('button', { name: /^Change Something else/ }).click();
  check('Change fills the form with that link and offers Save changes and Cancel', (await page.getByLabel(/Web address/).inputValue()) === 'https://example.org/misc' && (await page.getByLabel('Your note about it').inputValue()) === 'Something else' && (await page.getByRole('button', { name: 'Save changes' }).count()) === 1 && (await page.getByRole('button', { name: 'Cancel' }).count()) === 1);
  await page.getByLabel('Your note about it').fill('Club kit shop');
  await page.getByLabel('Section').selectOption({ label: 'Leadership' });
  await page.getByRole('button', { name: 'Save changes' }).click();
  await settle(page);
  saved = await stored(page);
  const changed = saved.data.find((l) => l.url === 'https://example.org/misc');
  check('changes are saved in place (same entry, new note and section)', saved.data.length === 5 && changed.description === 'Club kit shop' && changed.category === 'leadership', JSON.stringify(changed));
  t = await onPage('/leadership');
  check('the changed link now shows on the Leadership page', /Club kit shop/.test(t));
  await page.goto(BASE + '/trip-planning/links', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Change Club kit shop/ }).click();
  await page.getByRole('button', { name: 'Cancel' }).click();
  check('Cancel leaves the link unchanged and clears the form', (await page.getByLabel(/Web address/).inputValue()) === '' && (await stored(page)).data.length === 5);
  await page.getByRole('button', { name: /^Change Club kit shop/ }).click();
  await page.getByLabel(/Web address/).fill('javascript:alert(1)');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.waitForTimeout(200);
  check('a bad address cannot be saved while changing a link', (await stored(page)).data.find((l) => l.description === 'Club kit shop').url === 'https://example.org/misc' && (await page.locator('#link-problem').count()) === 1);
  await page.getByRole('button', { name: 'Cancel' }).click();

  // ---------- Delete ----------
  await page.getByRole('button', { name: /^Delete Club kit shop/ }).click();
  check('Delete asks first', (await page.getByRole('button', { name: 'Yes, delete it' }).count()) === 1 && (await stored(page)).data.length === 5);
  await page.getByRole('button', { name: 'Keep it' }).click();
  check('Keep it keeps the link', (await stored(page)).data.length === 5);
  await page.getByRole('button', { name: /^Delete Club kit shop/ }).click();
  await page.getByRole('button', { name: 'Yes, delete it' }).click();
  await settle(page);
  check('confirmed delete removes only that link and says so', (await stored(page)).data.length === 4 && !(await stored(page)).data.some((l) => l.description === 'Club kit shop') && /Deleted “Club kit shop”/.test(await page.locator('.export-bar__message').innerText()));

  // ---------- My plans: listed, exported, imported elsewhere ----------
  await page.goto(BASE + '/my-plans', { waitUntil: 'networkidle' });
  const row = page.locator('.saved-item', { hasText: 'My links' });
  check('My plans lists My links as saved', (await row.count()) === 1 && /Saved/.test(await row.innerText()), await row.innerText().catch(() => ''));
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download everything' }).click()]);
  const file = path.join(OUT, 'export.json');
  await dl.saveAs(file);
  const exported = JSON.parse(fs.readFileSync(file, 'utf8'));
  check('the export file contains the links', exported.items.links && exported.items.links.data.length === 4, JSON.stringify(Object.keys(exported.items)));

  const other = await newPage(browser);
  await other.page.goto(BASE + '/my-plans', { waitUntil: 'networkidle' });
  await other.page.setInputFiles('#import-file', file);
  await other.page.waitForTimeout(500);
  const importedStore = JSON.parse(await other.page.evaluate(() => localStorage.getItem('skh:ecskc:links')));
  check('importing the file on another browser brings the links back', importedStore && importedStore.data.length === 4 && /Imported 1/.test(await other.page.locator('.export-bar__message').innerText()));
  await other.page.goto(BASE + '/training', { waitUntil: 'networkidle' });
  check('and they show in their sections there', /Canoeing Ireland sea kayak awards/.test(await other.page.locator('.my-links').innerText()));

  // Importing the same file again merges, it does not double up.
  await other.page.goto(BASE + '/my-plans', { waitUntil: 'networkidle' });
  await other.page.setInputFiles('#import-file', file);
  await other.page.waitForTimeout(500);
  check('importing the same file twice does not duplicate links', JSON.parse(await other.page.evaluate(() => localStorage.getItem('skh:ecskc:links'))).data.length === 4);

  // A file with a dangerous link is refused whole.
  const evil = JSON.parse(JSON.stringify(exported));
  evil.items.links.data[0].url = 'javascript:alert(1)';
  const evilFile = path.join(OUT, 'evil.json');
  fs.writeFileSync(evilFile, JSON.stringify(evil));
  const before = await other.page.evaluate(() => JSON.stringify({ ...localStorage }));
  await other.page.setInputFiles('#import-file', evilFile);
  await other.page.waitForTimeout(400);
  check('an import file containing a javascript: link is refused and changes nothing', (await other.page.evaluate(() => JSON.stringify({ ...localStorage }))) === before, await other.page.locator('.export-bar__message').innerText());

  // Tampered storage is not trusted.
  await other.page.evaluate(() => localStorage.setItem('skh:ecskc:links', JSON.stringify({ v: 1, savedAt: '2026-11-22T10:00:00.000Z', data: [{ id: 'l1abc', url: 'javascript:alert(1)', description: 'x', category: 'other', addedAt: '2026-11-22T10:00:00.000Z' }] })));
  for (const p of ['/trip-planning/links', '/trip-planning', '/leadership', '/training']) {
    await other.page.goto(BASE + p, { waitUntil: 'networkidle' });
    check(`tampered storage shows no javascript: link (${p})`, (await other.page.locator('a[href^="javascript"]').count()) === 0 && !/alert\(1\)/.test(await other.page.locator('main').innerText()));
  }
  await other.page.goto(BASE + '/trip-planning', { waitUntil: 'networkidle' });
  check('a section page says plainly when saved links cannot be read', /could not be read/.test(await other.page.locator('.my-links').innerText()));
  check('no dialogs or errors in the second browser', other.problems.length === 0, other.problems.join(' | '));
  await other.context.close();

  // ---------- Nothing leaves the browser ----------
  const external = requests.filter((r) => !r.url.startsWith(BASE));
  check('no request left the site while using the app', external.length === 0, external.map((r) => r.url).join(', '));
  check('no request went to /api/ at all (no AI)', requests.every((r) => !new URL(r.url).pathname.startsWith('/api/')));
  check('no link address or note was sent anywhere', requests.every((r) => !/canoe\.ie|Canoeing Ireland|Met Éireann/.test(r.url + r.body)));
  const cookies = await context.cookies();
  check('no cookies set', cookies.length === 0, JSON.stringify(cookies));

  // ---------- Narrow phone, big text ----------
  const narrow = await newPage(browser, { width: 320, height: 640 });
  await narrow.page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await bigText(narrow.page);
  check('home does not scroll sideways at 320px with text at 200%', !(await overflows(narrow.page)));
  const longUrl = 'https://example.org/' + 'a'.repeat(1900);
  const longNote = 'N'.repeat(280);
  await narrow.page.evaluate(([u, n]) => localStorage.setItem('skh:ecskc:links', JSON.stringify({ v: 1, savedAt: '2026-11-22T10:00:00.000Z', data: [{ id: 'l1abc', url: u, description: n, category: 'trip-planning', addedAt: '2026-11-22T10:00:00.000Z' }, { id: 'l2abc', url: 'https://www.' + 'b'.repeat(60) + '.ie/', description: '', category: 'trip-planning', addedAt: '2026-11-22T10:01:00.000Z' }] })), [longUrl, longNote]);
  for (const p of ['/trip-planning/links', '/trip-planning']) {
    await narrow.page.goto(BASE + p, { waitUntil: 'networkidle' });
    await bigText(narrow.page);
    check(`${p} does not scroll sideways at 320px with long links and text at 200%`, !(await overflows(narrow.page)));
  }
  await narrow.page.screenshot({ path: `${OUT}/links-narrow.png`, fullPage: true });
  await narrow.context.close();

  // ---------- Keyboard ----------
  const kb = await newPage(browser);
  await kb.page.goto(BASE + '/trip-planning/links', { waitUntil: 'networkidle' });
  await kb.page.getByLabel(/Web address/).focus();
  await kb.page.keyboard.type('www.canoe.ie');
  await kb.page.keyboard.press('Tab');
  await kb.page.keyboard.type('From the keyboard');
  await kb.page.keyboard.press('Tab');
  await kb.page.keyboard.press('ArrowDown');
  await kb.page.keyboard.press('Tab');
  await kb.page.keyboard.press('Enter');
  await kb.page.waitForTimeout(700);
  const kbSaved = JSON.parse(await kb.page.evaluate(() => localStorage.getItem('skh:ecskc:links')));
  check('a link can be added with the keyboard alone', kbSaved && kbSaved.data.length === 1 && kbSaved.data[0].description === 'From the keyboard' && kbSaved.data[0].category === 'leadership', JSON.stringify(kbSaved));
  await kb.context.close();

  check('no console errors, warnings, failed requests or dialogs in the main session', problems.length === 0, problems.join(' | '));
  await browser.close();
  console.log(`\n${total - failures} of ${total} checks passed`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => {
  console.error('TEST CRASHED', e);
  process.exit(2);
});
