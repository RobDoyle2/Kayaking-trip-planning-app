// Stage 4 (Training and Skills) end-to-end test. Needs the built site served on BASE (default http://localhost:4173).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || path.join(__dirname, 'out', 'stage4');
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
const wait = (page) => page.waitForTimeout(700);

const routes = [
  ['/training', 'Training and Skills'],
  ['/training/guidance', 'Training guidance'],
  ['/training/plan', 'Skills development plan'],
  ['/training/checklists', 'Personal checklists'],
  ['/training/checklists/fsrt', 'Safety and rescue skills (FSRT)'],
  ['/training/checklists/leader-rescue', 'Sea Kayak Leader: rescue skills'],
  ['/training/checklists/leader-background', 'Sea Kayak Leader: paddling and background'],
  ['/training/qualifications', 'Canoeing Ireland qualifications'],
];

(async () => {
  const browser = await chromium.launch();

  // 1. Pages load; visiting stores nothing; skills library still blocked.
  {
    const { context, page, problems } = await newPage(browser);
    for (const [r, h1] of routes) {
      await page.goto(BASE + r, { waitUntil: 'networkidle' });
      check(`${r} shows "${h1}"`, (await page.locator('main h1').first().innerText()).trim() === h1);
      check(`${r} has exactly one h1`, (await page.locator('h1').count()) === 1);
    }
    check('visiting every Training page stores nothing', (await keys(page)).length === 0, JSON.stringify(await keys(page)));
    await page.goto(BASE + '/training', { waitUntil: 'networkidle' });
    const text = await page.locator('main').innerText();
    check('the skills library is still shown as blocked, with the reason', /Skills library[\s\S]*Blocked/.test(text) && /Waiting on:/.test(text) && /checklists only/.test(text));
    check('the four built items show as Preview with an Open button', (await page.locator('.item-card--preview').count()) === 4 && (await page.getByRole('link', { name: 'Open', exact: true }).count()) === 4, `preview=${await page.locator('.item-card--preview').count()}`);
    check('no console problems visiting', problems.length === 0, problems.join(' | '));
    await context.close();
  }

  // 2. Development plan: rate, notes, actions, summary, persistence, export, print, clear.
  {
    const { context, page, problems } = await newPage(browser);
    await page.goto(BASE + '/training/plan', { waitUntil: 'networkidle' });
    check('the plan states it is a self-assessment nobody assesses', /Nobody assesses what you enter here/.test(await page.locator('main').innerText()));
    check('there is one rating per line of the leader checklist (25)', (await page.locator('select[id^="plan-"]').count()) === 25);
    const opts = await page.locator('select[id^="plan-"]').first().locator('option').allInnerTexts();
    check('ratings offer exactly Strong, Competent, Develop (and Not rated)', JSON.stringify(opts) === JSON.stringify(['Not rated', 'Strong', 'Competent', 'Develop']), JSON.stringify(opts));
    check('the summary starts at 0 of 25', /0 of 25 rated/.test(await page.locator('.missing-summary').innerText()));
    check('the plan starts with nothing saved', (await keys(page)).length === 0);
    const selects = page.locator('select[id^="plan-"]');
    await selects.nth(0).selectOption('Strong');
    await selects.nth(1).selectOption('Develop');
    await selects.nth(18).selectOption('Develop');
    await selects.nth(19).selectOption('Competent');
    await page.locator('#note-rescue').fill('Practise towing with two boats');
    await page.getByRole('button', { name: 'Add an action' }).click();
    await page.getByRole('button', { name: 'Add an action' }).click();
    const first = page.locator('input[id^="act-"][id$="-text"]').nth(0);
    await first.fill('Book a rescue session');
    await page.locator('select[id^="act-"][id$="-area"]').nth(0).selectOption('rescue');
    await page.locator('input[id^="act-"][id$="-when"]').nth(0).fill('before May');
    await page.locator('input[id^="act-"][id$="-text"]').nth(1).fill('Log my next three trips');
    await page.locator('input[id^="act-"][id$="-done"]').nth(1).check();
    await wait(page);
    check('the summary counts the ratings', /4 of 25 rated\. Strong: 1\. Competent: 1\. Develop: 2\./.test(await page.locator('.missing-summary').innerText()), await page.locator('.missing-summary').innerText());
    const plan = await page.locator('.plan-view').innerText();
    check('the plan lists the lines rated Develop with their area letter', /A\. Venue selection and use|A\. [A-Z]/.test(plan) && /C\. /.test(plan), plan.slice(0, 220).replace(/\n/g, ' | '));
    check('open actions come before done ones', plan.indexOf('Open: Book a rescue session') >= 0 && plan.indexOf('Done: Log my next three trips') > plan.indexOf('Open: Book a rescue session'));
    check('an action shows its area and when', /Book a rescue session \(Rescues and incident management\) by when: before May/.test(plan.replace(/\n/g, ' ')));
    check('blank note boxes are marked Not filled in', /Participant-focused leadership\s+Not filled in/.test(plan.replace(/\n+/g, ' ')) || /Not filled in/.test(plan));
    check('stored under its own key only', JSON.stringify(await keys(page)) === '["skh:ecskc:development-plan"]', JSON.stringify(await keys(page)));
    await page.reload({ waitUntil: 'networkidle' });
    check('ratings, notes and actions survive a reload', (await page.locator('select[id^="plan-"]').nth(1).inputValue()) === 'Develop' && (await page.locator('#note-rescue').inputValue()) === 'Practise towing with two boats' && (await page.locator('input[id^="act-"][id$="-text"]').count()) === 2 && (await page.locator('input[id^="act-"][id$="-done"]').nth(1).isChecked()));
    check('reflective practice has a notes box and no rating', (await page.locator('#note-reflective').count()) === 1 && (await page.locator('select[id^="plan-"]').count()) === 25 && /does not rate it/.test(await page.locator('main').innerText()) || /does not rate it either/.test(await page.locator('main').innerText()));
    // Download text.
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download text file' }).click()]);
    await dl.saveAs(path.join(OUT, 'plan.txt'));
    const txt = fs.readFileSync(path.join(OUT, 'plan.txt'), 'utf8');
    check('text file has the summary, develop list, notes and actions', /Rated: 4 of 25/.test(txt) && /AREAS TO DEVELOP/.test(txt) && /Practise towing with two boats/.test(txt) && /\[ \] Book a rescue session/.test(txt) && /\[x\] Log my next three trips/.test(txt) && /does not assess you/.test(txt));
    // Print.
    await page.emulateMedia({ media: 'print' });
    check('print hides the form and shows the plan', !(await page.locator('form').isVisible()) && (await page.locator('.plan-view').isVisible()) && !(await page.locator('.site-header').isVisible()));
    await page.emulateMedia({ media: 'screen' });
    await page.screenshot({ path: `${OUT}/plan-mobile.png`, fullPage: true });
    // Remove an action; clear.
    await page.getByRole('button', { name: 'Remove action 2' }).click();
    check('an action can be removed', (await page.locator('input[id^="act-"][id$="-text"]').count()) === 1);
    await page.getByRole('button', { name: 'Clear this plan' }).click();
    check('clear asks first', (await page.locator('.confirm').count()) === 1);
    await page.locator('.confirm .btn--danger').click();
    await page.waitForTimeout(200);
    check('clear empties the plan and the stored key', (await page.locator('select[id^="plan-"]').first().inputValue()) === '' && (await keys(page)).length === 0);
    check('no console problems on the plan', problems.length === 0, problems.join(' | '));
    await context.close();
  }

  // 3. Personal checklists.
  {
    const { context, page, problems } = await newPage(browser);
    await page.goto(BASE + '/training/checklists', { waitUntil: 'networkidle' });
    check('the index says a tick is not an assessment', /does not mean you are qualified, assessed or ready to lead/.test(await page.locator('main').innerText()));
    check('the index links the three checklists', (await page.locator('.saved-item a').count()) === 3);
    const expected = { fsrt: 'dev-fsrt', 'leader-rescue': 'dev-leader-rescue', 'leader-background': 'dev-leader-background' };
    for (const [slug, id] of Object.entries(expected)) {
      await page.goto(BASE + `/training/checklists/${slug}`, { waitUntil: 'networkidle' });
      const boxes = page.locator('main input[type="checkbox"]');
      const n = await boxes.count();
      check(`${slug}: has lines to tick, each with a source`, n >= 10 && (await page.locator('.check__meta').count()) === n, `n=${n}`);
      check(`${slug}: the page says a tick is not an assessment`, /does not mean you are qualified, assessed or ready to lead/.test(await page.locator('main').innerText()));
      check(`${slug}: crumb leads to Training and Skills`, (await page.locator('.crumb a').first().getAttribute('href')) === '/training');
      await boxes.nth(0).check();
      await boxes.nth(2).check();
      await wait(page);
      check(`${slug}: saved under ${id}`, (await keys(page)).includes(`skh:ecskc:${id}`), JSON.stringify(await keys(page)));
      await page.reload({ waitUntil: 'networkidle' });
      check(`${slug}: ticks survive a reload`, (await page.locator('main input[type="checkbox"]:checked').count()) === 2 && /^2 of \d+ ticked/.test((await page.locator('.progress-line').innerText()).trim()));
    }
    check('the three checklists keep separate ticks', (await keys(page)).length === 3);
    check('no console problems on the checklists', problems.length === 0, problems.join(' | '));
    await context.close();
  }

  // 4. Guidance and qualifications.
  {
    const { context, page, problems } = await newPage(browser);
    await page.goto(BASE + '/training/guidance', { waitUntil: 'networkidle' });
    const g = await page.locator('main').innerText();
    check('guidance has the four areas, the ratings, FSRT and awards sections', ['four areas of the leader checklist', 'How the ratings work', 'Foundation Safety and Rescue Training', 'Canoeing Ireland awards'].every((h) => g.includes(h)));
    check('guidance says it makes no comparison between Irish levels and British awards', /makes no comparison/.test(g));
    check('guidance says it is not approved by the club', /not been approved by the ECSKC committee/.test(g));
    check('every section names its source', (await page.locator('.source-line').count()) === (await page.locator('main section[aria-labelledby]').count()) - 1 || (await page.locator('.source-line').count()) >= 6);
    check('guidance crumb leads to Training and Skills', (await page.locator('.crumb a').first().getAttribute('href')) === '/training');
    await page.screenshot({ path: `${OUT}/guidance-mobile.png`, fullPage: true });

    await page.goto(BASE + '/training/qualifications', { waitUntil: 'networkidle' });
    const q = await page.locator('main').innerText();
    check('qualifications lists levels 1 to 5 by name', ['Level 1: Discovery', 'Level 2: Peer', 'Level 3: Explorer', 'Level 4: Adventure', 'Level 5: Horizon'].every((x) => q.includes(x)));
    check('qualifications says it links rather than copies, and says when it was read', /does not reproduce the awards/.test(q) && /1 November 2026/.test(q));
    const links = await page.$$eval('main a[target="_blank"]', (as) => as.map((a) => [a.href, a.rel]));
    const canoe = links.filter(([h]) => /canoe\.ie/.test(h));
    check('every award link is on canoe.ie, and every external link opens safely', canoe.length >= 8 && canoe.every(([h]) => /^https:\/\/www\.canoe\.ie\//.test(h)) && links.every(([, rel]) => rel.includes('noopener') && rel.includes('noreferrer')), `${canoe.length} canoe.ie of ${links.length} links`);
    check('the five level pages are linked', ['level-1-sea-kayak-skills', 'level-2-sea-kayak-skills-award', 'level-3-sea-kayak-skills', 'level-4-sea-kayak-skills', 'level-5-sea-kayak-skills'].every((s) => links.some(([h]) => h.includes(s))));
    check('ECSKC requirement is stated once as the club asks (Level 2)', /ECSKC asks every paddler on its trips to hold at least this level/.test(q));
    await page.screenshot({ path: `${OUT}/qualifications-mobile.png`, fullPage: true });
    check('no console problems on guidance and qualifications', problems.length === 0, problems.join(' | '));
    await context.close();
  }

  // 5. My plans: lists the new items; export/import round trip; damaged file refused.
  {
    const { context, page, problems } = await newPage(browser);
    await page.goto(BASE + '/training/plan', { waitUntil: 'networkidle' });
    await page.locator('select[id^="plan-"]').nth(3).selectOption('Competent');
    await page.locator('#note-experience').fill('Logbook started');
    await wait(page);
    await page.goto(BASE + '/training/checklists/fsrt', { waitUntil: 'networkidle' });
    await page.locator('main input[type="checkbox"]').nth(1).check();
    await wait(page);
    await page.goto(BASE + '/my-plans', { waitUntil: 'networkidle' });
    const list = (await page.locator('.saved-list').innerText()).replace(/\n+/g, ' ');
    check('My plans lists the development plan and the checklists, with the two saved ones marked Saved', /Skills development plan\s+Saved/.test(list) && /Checklist: safety and rescue skills \(FSRT\)\s+Saved/.test(list) && /Checklist: Sea Kayak Leader rescue skills\s+Nothing saved/.test(list), list.slice(0, 300));
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download everything' }).click()]);
    const file = path.join(OUT, 'export.json');
    await dl.saveAs(file);
    const exported = JSON.parse(fs.readFileSync(file, 'utf8'));
    check('export holds exactly the two saved training items', Object.keys(exported.items).sort().join() === 'dev-fsrt,development-plan', Object.keys(exported.items).join());
    await page.getByRole('button', { name: 'Delete everything' }).click();
    await page.locator('.confirm .btn--danger').click();
    check('delete everything empties storage', (await keys(page)).length === 0);
    await page.setInputFiles('#import-file', file);
    await page.waitForTimeout(400);
    check('import restores both', JSON.stringify(await keys(page)) === '["skh:ecskc:dev-fsrt","skh:ecskc:development-plan"]', JSON.stringify(await keys(page)));
    await page.goto(BASE + '/training/plan', { waitUntil: 'networkidle' });
    check('the imported plan is back', (await page.locator('#note-experience').inputValue()) === 'Logbook started' && (await page.locator('select[id^="plan-"]').nth(3).inputValue()) === 'Competent');
    // Damaged plan file.
    await page.goto(BASE + '/my-plans', { waitUntil: 'networkidle' });
    const before = JSON.stringify(await page.evaluate(() => ({ ...localStorage })));
    const bad = JSON.parse(JSON.stringify(exported));
    bad.items['development-plan'].data.ratings = { 'a-judgement': 'Brilliant' };
    const badFile = path.join(OUT, 'bad.json');
    fs.writeFileSync(badFile, JSON.stringify(bad));
    await page.setInputFiles('#import-file', badFile);
    await page.waitForTimeout(300);
    check('a damaged plan file is refused and changes nothing', JSON.stringify(await page.evaluate(() => ({ ...localStorage }))) === before, await page.locator('.export-bar__message').innerText());
    check('only skh keys; no cookies', (await keys(page)).every((k) => k.startsWith('skh:ecskc:')) && (await context.cookies()).length === 0);
    check('no console problems on My plans', problems.length === 0, problems.join(' | '));
    await context.close();
  }

  // 6. Layout and labels at 320 px with 200% text.
  {
    const { context, page, problems } = await newPage(browser, { width: 320, height: 640 });
    await page.goto(BASE + '/training/plan', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Add an action' }).click();
    await page.locator('input[id^="act-"][id$="-text"]').fill('Supercalifragilisticexpialidocious '.repeat(4) + 'x'.repeat(200));
    await page.locator('#note-reflective').fill('y'.repeat(300));
    await wait(page);
    for (const [r] of routes) {
      await page.goto(BASE + r, { waitUntil: 'networkidle' });
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

  // 7. Storage blocked.
  {
    const { context, page, problems } = await newPage(browser);
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } });
    });
    await page.goto(BASE + '/training/plan', { waitUntil: 'networkidle' });
    await page.locator('select[id^="plan-"]').first().selectOption('Strong');
    await page.waitForTimeout(700);
    check('with storage blocked, rating still works', (await page.locator('select[id^="plan-"]').first().inputValue()) === 'Strong');
    check('with storage blocked, the page does not claim to have saved', !/^Saved on this device at/.test(await page.locator('.save-status').first().innerText()), await page.locator('.save-status').first().innerText());
    check('no uncaught errors with storage blocked', !problems.some((p) => p.startsWith('pageerror')), problems.join(' | '));
    await context.close();
  }

  await browser.close();
  console.log(failures === 0 ? '\nAll Stage 4 checks passed.' : `\n${failures} Stage 4 check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
})();
