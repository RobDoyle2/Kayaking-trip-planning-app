// Stage 5 (Navigation, Tides and VHF) end-to-end test. Needs the built site served on BASE (default http://localhost:4173).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || path.join(__dirname, 'out', 'stage5');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
function check(name, ok, detail = '') {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -> ' + detail : ''}`);
}

async function newPage(browser, viewport = { width: 390, height: 844 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const problems = [];
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && problems.push(`console ${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`));
  const external = [];
  page.on('request', (r) => { if (!r.url().startsWith(BASE)) external.push(r.url()); });
  return { context, page, problems, external };
}
const keys = (page) => page.evaluate(() => Object.keys(localStorage).sort());
const result = async (page, id) => (await page.locator(`#${id}-title`).locator('xpath=..').locator('.calc__result').allInnerTexts()).join(' | ');

const routes = [
  ['/navigation', 'Navigation and Tides'],
  ['/navigation/reference', 'Navigation reference'],
  ['/navigation/tools', 'Tide worksheet and calculators'],
  ['/navigation/oileain', 'Oileáin guidance'],
  ['/navigation/tides', 'Tidal information'],
  ['/navigation/weather', 'Weather information'],
  ['/vhf', 'VHF Radio'],
  ['/vhf/stations', 'VHF station list and channels'],
];

(async () => {
  const browser = await chromium.launch();

  // 1. Pages load, nothing stored, no outside requests, blocked items still blocked with reasons.
  {
    const { context, page, problems, external } = await newPage(browser);
    for (const [r, h1] of routes) {
      await page.goto(BASE + r, { waitUntil: 'networkidle' });
      check(`${r} shows "${h1}"`, (await page.locator('main h1').first().innerText()).trim() === h1);
      check(`${r} has exactly one h1`, (await page.locator('h1').count()) === 1);
    }
    check('visiting every page stores nothing', (await keys(page)).length === 0, JSON.stringify(await keys(page)));
    check('no request goes to any other website (nothing is fetched live)', external.length === 0, external.join(', '));
    check('no console problems visiting', problems.length === 0, problems.join(' | '));

    await page.goto(BASE + '/navigation', { waitUntil: 'networkidle' });
    const nav = await page.locator('main').innerText();
    check('navigation: five items are Preview with Open buttons', (await page.locator('.item-card--preview').count()) === 5 && (await page.getByRole('link', { name: 'Open', exact: true }).count()) === 5, `preview=${await page.locator('.item-card--preview').count()}`);
    check('navigation: the Oileáin allowance is blocked with the honest reason', /High-water time allowance[\s\S]*Blocked/.test(nav) && /contains no such rule/.test(nav));
    await page.goto(BASE + '/vhf', { waitUntil: 'networkidle' });
    const vhf = await page.locator('main').innerText();
    check('vhf: stations is Preview; control areas, map and procedures are blocked with reasons', (await page.locator('.item-card--preview').count()) === 1 && (await page.locator('.item-card--blocked').count()) === 3 && /Waiting on:/.test(vhf), `preview=${await page.locator('.item-card--preview').count()} blocked=${await page.locator('.item-card--blocked').count()}`);
    check('vhf: the map is not drawn, and the reason is stated', /guessed positions/.test(vhf) && (await page.locator('main svg[role="img"], main canvas, main img').count()) === 0);
    await context.close();
  }

  // 2. Calculators.
  {
    const { context, page, problems, external } = await newPage(browser);
    await page.goto(BASE + '/navigation/tools', { waitUntil: 'networkidle' });
    check('eight calculators', (await page.locator('.calc').count()) === 8, `n=${await page.locator('.calc').count()}`);
    check('every calculator shows its rule and has assumptions and a source', (await page.locator('.calc__formula').count()) === 8 && (await page.locator('.calc__more').count()) === 8);
    check('the page says it is a planning aid and fetches and saves nothing', /fetch nothing, look nothing up and save nothing/.test(await page.locator('main').innerText()));
    check('before input, calculators ask for values and show no numbers', (await page.locator('.calc__result--wait').count()) >= 9 && (await page.locator('.calc__table').count()) === 0);

    // Stream speed: the source's worked example.
    await page.locator('#streamspeed-dist').fill('0.7');
    await page.locator('#streamspeed-min').fill('10');
    await page.locator('#streamspeed-boat').fill('3');
    let r = await result(page, 'streamspeed');
    check('stream speed: 0.7 NM in 10 min with a 3 kn boat gives 4.2 kn and a 1.2 kn stream (the deck’s example)', /4\.2 knots/.test(r) && /Stream 1\.2 knots, with you/.test(r), r);
    await page.locator('#streamspeed-boat').fill('4,5');
    r = await result(page, 'streamspeed');
    check('stream speed: a comma decimal works and an opposing stream is reported', /Stream 0\.3 knots, against you/.test(r), r);
    await page.locator('#streamspeed-min').fill('abc');
    r = await result(page, 'streamspeed');
    check('stream speed: bad input is explained and no number is shown', /Time must be a number/.test(r) && !/knots/.test(r), r);

    // Offset.
    await page.locator('#offset-stream').fill('1');
    await page.locator('#offset-paddle').fill('3');
    r = await result(page, 'offset');
    check('offset: beam stream 1 kn, paddling 3 kn gives 20°', /Offset: 20° up-stream/.test(r), r);
    await page.locator('#offset-kind').selectOption('quarter');
    r = await result(page, 'offset');
    check('offset: bow or quarter uses 40 and gives 13.3°', /Offset: 13\.3°/.test(r) && /× 40°/.test(r), r);
    await page.locator('#offset-stream').fill('3');
    r = await result(page, 'offset');
    check('offset: a stream as fast as the paddler is refused, not computed', /no offset angle will hold your course/.test(r) && !/Offset: /.test(r), r);
    await page.locator('#offset-paddle').fill('0');
    r = await result(page, 'offset');
    check('offset: zero paddling speed is refused', /Paddling speed must be at least 0\.1/.test(r), r);

    // Time from HW.
    await page.locator('#fromhw-hw').fill('10:00');
    await page.locator('#fromhw-dir').selectOption('before');
    await page.locator('#fromhw-hours').fill('4');
    await page.locator('#fromhw-mins').fill('40');
    r = await result(page, 'fromhw');
    check('time from HW: 10:00 minus 4 h 40 min is 05:20', /Result: 05:20/.test(r), r);
    await page.locator('#fromhw-dir').selectOption('after');
    await page.locator('#fromhw-hw').fill('22:30');
    await page.locator('#fromhw-hours').fill('4');
    await page.locator('#fromhw-mins').fill('30');
    r = await result(page, 'fromhw');
    check('time from HW: crossing midnight says the next day', /Result: 03:00 \(the next day\)/.test(r), r);
    await page.locator('#fromhw-mins').fill('75');
    r = await result(page, 'fromhw');
    check('time from HW: minutes over 59 are refused', /Minutes must be no more than 59/.test(r), r);

    // BST.
    await page.locator('#bst-time').fill('23:30');
    r = await result(page, 'bst');
    check('BST: 23:30 UT is 00:30 the next day', /BST: 00:30 \(the next day\)/.test(r), r);

    // Thirds.
    await page.locator('#thirds-max').fill('2.4');
    const thirds = await page.locator('#thirds-title').locator('xpath=..').locator('tbody tr').allInnerTexts();
    check('thirds: 2.4 kn gives 0.8, 1.6, 2.4, 2.4, 1.6, 0.8', thirds.map((t) => t.split(/\s+/).pop()).join(',') === '0.8,1.6,2.4,2.4,1.6,0.8', thirds.join(' | '));
    await page.locator('#thirds-max').fill('-2');
    check('thirds: a negative rate is refused', /cannot be negative/.test(await result(page, 'thirds')));

    // Twelfths.
    await page.locator('#twelfths-low').fill('0.5');
    await page.locator('#twelfths-high').fill('4.5');
    await page.locator('#twelfths-dir').selectOption('falling');
    let tw = await page.locator('#twelfths-title').locator('xpath=..').locator('tbody tr').allInnerTexts();
    check('twelfths: falling from 4.5 to 0.5 m gives 4.17, 3.5, 2.5, 1.5, 0.83, 0.5', tw.map((t) => t.split(/\s+/).pop()).join(',') === '4.17,3.5,2.5,1.5,0.83,0.5', tw.join(' | '));
    check('twelfths: shows the range', /Range 4 m/.test(await result(page, 'twelfths')));
    await page.locator('#twelfths-high').fill('0.2');
    check('twelfths: high water below low water is refused', /High water must be higher than low water/.test(await result(page, 'twelfths')));

    // Atlas.
    await page.locator('#atlas-rate').fill('12,23');
    check('atlas: 12,23 is 1.2 kn neaps and 2.3 kn springs', /1\.2 knots at neaps, 2\.3 knots at springs/.test(await result(page, 'atlas')));
    await page.locator('#atlas-rate').fill('1.2');
    check('atlas: other formats are refused', /Enter two digits, a comma and two digits/.test(await result(page, 'atlas')));

    // Cables.
    await page.locator('#cables-in').fill('8.5');
    await page.locator('#nm-in').fill('0.85');
    r = await result(page, 'cables');
    check('cables: 8.5 cables is 0.85 NM and 0.85 NM is 8.5 cables (the deck’s example)', /0\.85 nautical miles/.test(r) && /8\.5 cables/.test(r), r);

    check('calculators saved nothing and fetched nothing', (await keys(page)).length === 0 && external.length === 0);
    await page.screenshot({ path: `${OUT}/tools-mobile.png`, fullPage: true });
    check('no console problems in the calculators', problems.length === 0, problems.join(' | '));
    await context.close();
  }

  // 3. VHF stations table.
  {
    const { context, page, problems } = await newPage(browser, { width: 1280, height: 900 });
    await page.goto(BASE + '/vhf/stations', { waitUntil: 'networkidle' });
    const rows = page.locator('tbody tr');
    check('21 station rows', (await rows.count()) === 21);
    const row = async (name) => (await rows.filter({ has: page.locator('th', { hasText: name }) }).first().innerText()).replace(/\s+/g, ' ');
    const dublin = await row('Dublin');
    check('Dublin: 16, 67, 03, DSC listed, changed from 83', /16, 67, 03/.test(dublin) && /Working channel.*03|03/.test(dublin) && /Listed/.test(dublin) && /Yes, from 83/.test(dublin), dublin);
    const galley = await row('Galley Head');
    check('Galley Head: channel 16 only, no working channel, DSC not listed', /16/.test(galley) && /None listed/.test(galley) && /Not listed/.test(galley), galley);
    const ree = await row('Lough Ree');
    check('Lough Ree: 16, 62', /16, 62/.test(ree), ree);
    const malin = await row('Malin Head (local');
    check('Malin Head local: 16, 01, old 85, with the caution about the Scalp Mountain site', /16, 01/.test(malin) && /Yes, from 85/.test(malin) && /Scalp Mountain/.test(malin), malin);
    const text = await page.locator('main').innerText();
    check('the page says it is a December 2020 snapshot from afloat.ie and to check the current notice', /December 2020/.test(text) && /afloat\.ie/.test(text) && /confirm the channels against the current Coast Guard information/.test(text));
    check('the page says channel 16 is unaffected and 67 may not be monitored', /Channel 16 is not affected/.test(text) && /may not be monitored at all times/.test(text));
    check('12 of 21 rows say changed', /12 of the 21 rows/.test(text));
    const links = await page.$$eval('main a[target="_blank"]', (as) => as.map((a) => [a.href, a.rel]));
    check('links to gov.ie and afloat.ie open safely', links.some(([h]) => /gov\.ie/.test(h)) && links.some(([h]) => /afloat\.ie/.test(h)) && links.every(([, rel]) => rel.includes('noopener') && rel.includes('noreferrer')), `${links.length} links`);
    await page.screenshot({ path: `${OUT}/stations-desktop.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${OUT}/stations-mobile.png`, fullPage: true });
    check('no console problems on the station list', problems.length === 0, problems.join(' | '));
    await context.close();
  }

  // 4. Reference, tides, weather, Oileáin content.
  {
    const { context, page, problems } = await newPage(browser);
    await page.goto(BASE + '/navigation/weather', { waitUntil: 'networkidle' });
    check('Beaufort table has 13 rows, forces 0 to 12', (await page.locator('#beaufort-title').locator('xpath=..').locator('tbody tr').count()) === 13);
    check('force 4 is 11 to 16 knots, moderate breeze', /4\s+11 to 16\s+Moderate breeze/.test((await page.locator('#beaufort-title').locator('xpath=..').innerText()).replace(/[ \t]+/g, ' ')));
    const w = await page.locator('main').innerText();
    check('weather page says there is no live weather and links to providers marked Not live', /No live weather here/.test(w) && (await page.locator('.badge', { hasText: 'Not live here' }).count()) === 3);
    check('the award wind limit is framed as the award’s, not a club rule or a judgement', /not a club rule and not a judgement/.test(w));
    await page.goto(BASE + '/navigation/tides', { waitUntil: 'networkidle' });
    const t = await page.locator('main').innerText();
    check('tides page: predictions not live readings, four provider links all marked Not live', /Predictions, not live readings/.test(t) && (await page.locator('.badge', { hasText: 'Not live here' }).count()) === 4);
    check('tides page warns about datum and time zone and explains why nothing is live', /datum/i.test(t) && /Why there are no live tides here yet/.test(t) && /Mean Lower Low Water/.test(t));
    check('tides page does not show any tide times or heights of its own', !/\b\d{1,2}:\d{2}\s*(AM|PM)?\s*\d(\.\d+)?\s*m\b/.test(t));
    await page.goto(BASE + '/navigation/oileain', { waitUntil: 'networkidle' });
    const o = await page.locator('main').innerText();
    check('Oileáin page: four standard ports and a table of coasts', ['Belfast', 'Dublin', 'Cobh', 'Galway'].every((p) => o.includes(p)) && (await page.locator('tbody tr').count()) === 5);
    check('Oileáin page: says the allowance rule is not available and is not guessed', /not available/.test(o) && /will not guess one/.test(o));
    check('Oileáin page: says it is an index and does not reproduce the guide', /does not reproduce its text or its tide tables/.test(o));
    await page.goto(BASE + '/navigation/reference', { waitUntil: 'networkidle' });
    const ref = await page.locator('main').innerText();
    check('reference: the worked examples from the course are present (8.5 cables = 0.85 NM; 174° to 180°)', /8\.5 cables, which is 0\.85 NM/.test(ref) && /174° becomes a magnetic bearing of 180°/.test(ref));
    check('reference: says what was left out', /What is left out/.test(ref) && /not repeated here/.test(ref));
    check('every guide section names its source', (await page.locator('.source-line').count()) >= 7);
    await page.screenshot({ path: `${OUT}/reference-mobile.png`, fullPage: true });
    check('no console problems on the content pages', problems.length === 0, problems.join(' | '));
    await context.close();
  }

  // 5. Layout and labels at 320 px with 200% text.
  {
    const { context, page, problems } = await newPage(browser, { width: 320, height: 640 });
    await page.goto(BASE + '/navigation/tools', { waitUntil: 'networkidle' });
    await page.locator('#fromhw-hw').fill('10:00');
    await page.locator('#fromhw-hours').fill('4');
    await page.locator('#thirds-max').fill('2.4');
    await page.locator('#twelfths-low').fill('0.5');
    await page.locator('#twelfths-high').fill('4.5');
    await page.locator('#atlas-rate').fill('x'.repeat(200));
    for (const [r] of routes.concat([['/navigation/tools']])) {
      await page.goto(BASE + r, { waitUntil: 'networkidle' });
      if (r === '/navigation/tools') {
        await page.locator('#thirds-max').fill('2.4');
        await page.locator('#twelfths-low').fill('0.5');
        await page.locator('#twelfths-high').fill('4.5');
        await page.locator('#atlas-rate').fill('x'.repeat(200));
      }
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`${r} has no sideways scroll at 320 px with 200% text`, overflow <= 0, `overflow=${overflow}px`);
      const unlabeled = await page.evaluate(() =>
        Array.from(document.querySelectorAll('main input, main select, main textarea')).filter((el) => {
          const byFor = el.id && document.querySelector(`label[for="${el.id}"]`);
          return !(byFor || el.closest('label') || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby'));
        }).map((el) => el.id || el.tagName),
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

  await browser.close();
  console.log(failures === 0 ? '\nAll Stage 5 checks passed.' : `\n${failures} Stage 5 check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
})();
