// Stage 6 (Knowledge Centre and assistant) end-to-end test.
// It starts its own copies of the app (scripts/serve.mjs runs api/ask.js exactly as the host does) and a stand-in for the
// Claude API (e2e/mock-anthropic.cjs). Needs the built site in dist/. Nothing here talks to the real Claude.
const { chromium, request } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { startMock } = require('./mock-anthropic.cjs');

const OUT = process.env.OUT || path.join(__dirname, 'out', 'stage6');
fs.mkdirSync(OUT, { recursive: true });
const KEY = 'sk-test-key-abc123-SECRET';
const MOCK_PORT = 4195; // not 4190: fetch refuses that port (it is on the standard blocked-ports list)

let failures = 0;
function check(name, ok, detail = '') {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -> ' + detail : ''}`);
}

const children = [];
async function startApp(port, env) {
  const child = spawn('node', ['scripts/serve.mjs', 'dist', String(port)], { cwd: path.join(__dirname, '..'), env: { ...process.env, ANTHROPIC_API_KEY: '', ANTHROPIC_BASE_URL: '', ...env }, stdio: process.env.DEBUG_STAGE6 ? 'inherit' : 'ignore' });
  children.push(child);
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`http://localhost:${port}/`);
      if (r.ok) return `http://localhost:${port}`;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`app on ${port} did not start`);
}

async function newPage(browser, base, viewport = { width: 390, height: 844 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const problems = [];
  const bodies = [];
  const outside = [];
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && problems.push(`console ${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('request', (r) => { if (!r.url().startsWith(base)) outside.push(r.url()); });
  page.on('response', async (r) => { try { bodies.push(await r.text()); } catch { /* binary or redirected */ } });
  return { context, page, problems, bodies, outside };
}

async function openAssistant(page) {
  await page.getByRole('button', { name: /ask the (kayaking )?assistant/i }).first().click();
  await page.locator('#assistant-question').waitFor();
}
async function ask(page, text) {
  await page.locator('#assistant-question').fill(text);
  await page.getByRole('button', { name: 'Send' }).click();
}
const lastReply = (page) => page.locator('.message--app').last();

(async () => {
  const mock = await startMock({ port: MOCK_PORT, expectedKey: KEY });
  const kbFile = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'knowledge', 'kb.json'), 'utf8'));
  const { buildIndex, search } = await import('../src/knowledge/search.js');
  const index = buildIndex(kbFile.passages, kbFile.docs);

  const A = await startApp(4180, { ANTHROPIC_API_KEY: KEY, ANTHROPIC_BASE_URL: `http://127.0.0.1:${MOCK_PORT}`, ASSISTANT_PER_MINUTE: '40', ASSISTANT_PER_HOUR: '400', ASSISTANT_PER_DAY: '400' });
  const B = await startApp(4181, {});
  const C = await startApp(4182, { ANTHROPIC_API_KEY: KEY, ANTHROPIC_BASE_URL: `http://127.0.0.1:${MOCK_PORT}`, ASSISTANT_PER_MINUTE: '2' });
  const D = await startApp(4183, { ANTHROPIC_API_KEY: KEY, ANTHROPIC_BASE_URL: `http://127.0.0.1:${MOCK_PORT}`, ASSISTANT_DAILY_LIMIT: '1', ASSISTANT_PER_MINUTE: '40' });
  const browser = await chromium.launch();

  // 1. A real question, through the whole chain.
  {
    const { context, page, problems, bodies, outside } = await newPage(browser, A);
    await page.goto(A + '/leadership', { waitUntil: 'networkidle' });
    await openAssistant(page);
    check('the window explains how answers are made, and no longer says "not connected"', /How answers are made/.test(await page.locator('.sheet').innerText()) && !/Not connected yet/.test(await page.locator('.sheet').innerText()));
    check('the window says the question goes to the server and to Claude, and not to type personal details', /sent to this app’s server and to Anthropic’s Claude/.test(await page.locator('.sheet').innerText()) && /do not type names or personal details/.test(await page.locator('.sheet').innerText()));
    const q = 'What is slack water?';
    const before = mock.requests.length;
    await ask(page, q);
    await page.locator('.answer__text').first().waitFor();
    const reply = lastReply(page);
    const text = await reply.innerText();
    check('the answer is shown', /Mock answer from/.test(text), text.slice(0, 80));
    const top = search(index, q, { section: '/leadership' })[0].passage;
    const card = reply.locator('.source-card').first();
    check('the source card shows the exact line from our library, not the model’s words', (await card.locator('.source-card__quote').innerText()).trim() === top.blocks[0], (await card.locator('.source-card__quote').innerText()).slice(0, 80));
    check('the source card names the passage, links to its page in the app and says it is not approved', (await card.locator('a').first().getAttribute('href')) === top.href && /Not yet approved by the club/.test(await card.innerText()));
    check('the sources list is open and counted', /Where this comes from \(1\)/.test(await reply.locator('summary').innerText()));
    check('a tide question carries the safety note with the emergency numbers', /999 or 112/.test(text) && /VHF channel 16/.test(text) && (await reply.locator('.safety-note').count()) === 1);
    check('the answer carries the notices: reference material, not live, not approved', /not live conditions/.test(text) && /None of it has been approved by the ECSKC committee/.test(text));
    const sent = mock.requests.slice(before);
    check('exactly one request reached Claude, with the key in a header and the version header', sent.length === 1 && sent[0].authorised === true);
    const body = sent[0].body;
    const content = body.messages[0].content;
    check('the request has the rules, cited documents from the library, and the question last', /Use only those documents/.test(body.system) && content.filter((c) => c.type === 'document').length >= 1 && content.filter((c) => c.type === 'document').every((d) => d.citations.enabled === true) && content[content.length - 1].text === `Question: ${q}`, `docs=${content.filter((c) => c.type === 'document').length}`);
    check('the passages sent are the ones the search picked', content.filter((c) => c.type === 'document')[0].title === top.title);
    check('the model is the default', body.model === 'claude-sonnet-5-5');
    check('nothing from the visitor’s device other than the question reached Claude', !/localStorage|skh:|cookie/i.test(JSON.stringify(body)));
    check('the key was in no response the browser received', !bodies.some((b) => b.includes(KEY)) && !bodies.some((b) => b.includes('SECRET')));
    check('the browser only talked to the app’s own address', outside.length === 0, outside.join(', '));
    // The link inside a source card closes the window and goes to the page.
    await card.locator('a').first().click();
    await page.waitForURL(new RegExp(top.href.replace(/\//g, '\\/') + '$'));
    check('following a source link closes the window', (await page.locator('#assistant-title').count()) === 0);
    check('no console problems', problems.length === 0, problems.join(' | '));
    await context.close();
  }

  // 2. Not found, double submit, and the modes where Claude fails or misbehaves.
  {
    const { context, page, problems } = await newPage(browser, A);
    await page.goto(A + '/', { waitUntil: 'networkidle' });
    await openAssistant(page);
    let n = mock.requests.length;
    await ask(page, 'best pizza in Dublin');
    await page.locator('.message--app .answer__text').first().waitFor();
    check('a question with no match says so plainly and sends nothing to Claude', /could not find an answer to that in the documents/.test(await lastReply(page).innerText()) && mock.requests.length === n);
    check('the not-found reply offers the Knowledge Centre search and the document list', (await lastReply(page).getByRole('link', { name: 'Search the Knowledge Centre' }).count()) === 1 && (await lastReply(page).getByRole('link', { name: /what the documents cover/ }).count()) === 1);

    mock.setMode('slow');
    n = mock.requests.length;
    await page.locator('#assistant-question').fill('What is slack water?');
    const send = page.getByRole('button', { name: 'Send' });
    await send.dblclick();
    check('while waiting the button is disabled and says so', await page.getByRole('button', { name: 'Searching…' }).isDisabled());
    check('a message says it is searching', (await page.locator('.message--app').last().innerText()).includes('Searching the documents'));
    await page.locator('.answer__text').nth(1).waitFor();
    check('a double click sends one question, not two', mock.requests.length === n + 1, `requests=${mock.requests.length - n}`);

    for (const [mode, pattern, label] of [
      ['error500', /busy or unavailable/, 'Claude failing'],
      ['badjson', /reply that could not be read|could not be reached|busy/, 'Claude sending rubbish'],
      ['nocitation', /could not find an answer/, 'an answer with no citation'],
      ['badcitation', /could not find an answer/, 'a citation pointing at a document that was never sent'],
      ['refusal', /could not find an answer/, 'Claude refusing'],
    ]) {
      mock.setMode(mode);
      const count = await page.locator('.message--app').count();
      await ask(page, 'What is slack water?');
      await page.waitForFunction((c) => document.querySelectorAll('.message--app').length > c && !document.querySelector('.message--app:last-child')?.textContent?.includes('Searching the documents'), count);
      await page.waitForTimeout(150);
      const t = await lastReply(page).innerText();
      check(`${label}: the visitor sees a plain message`, pattern.test(t), t.slice(0, 120).replace(/\n/g, ' '));
      check(`${label}: the provider’s own text, the key and account details never appear`, !/credit balance|org_secret|SECRET|confident answer|never sent/i.test(t));
    }

    mock.setMode('hostile');
    await ask(page, 'What is slack water?');
    await page.waitForFunction(() => document.body.innerText.includes('bold**') || document.body.innerText.includes('onerror'));
    check('markup in an answer is shown as text and never run', (await page.locator('.sheet img[src="x"]').count()) === 0 && (await page.evaluate(() => window.__pwned)) === undefined && /<img src=x/.test(await lastReply(page).innerText()));
    mock.setMode('ok');
    // The browser logs a line for every 502 reply, and this section makes the stand-in fail on purpose.
    const unexpected = problems.filter((p) => !/status of 502/.test(p));
    check('no console problems other than the expected 502 lines', unexpected.length === 0, unexpected.join(' | '));
    await context.close();
  }

  // 3. Direct tests of the endpoint.
  {
    const api = await request.newContext();
    const good = { Origin: A, 'Content-Type': 'application/json' };
    const post = (data, headers = good) => api.post(A + '/api/ask', { headers, data: typeof data === 'string' ? data : JSON.stringify(data) });
    const res = await post({ question: 'What is slack water?' });
    check('a good request gets a checked answer', res.status() === 200 && (await res.json()).kind === 'answer');
    check('replies are never cached and carry no cross-origin permission', res.headers()['cache-control'] === 'no-store' && !('access-control-allow-origin' in res.headers()));
    check('replies carry the app’s security headers', /default-src 'self'/.test(res.headers()['content-security-policy'] ?? '') && res.headers()['x-content-type-options'] === 'nosniff');
    check('a GET is refused', (await api.get(A + '/api/ask', { headers: { Origin: A } })).status() === 405);
    check('a request with no Origin is refused', (await post({ question: 'hi' }, { 'Content-Type': 'application/json' })).status() === 403);
    check('a request from another site is refused', (await post({ question: 'hi' }, { Origin: 'https://evil.example', 'Content-Type': 'application/json' })).status() === 403);
    check('text that is not JSON is refused', (await post('hello', { Origin: A, 'Content-Type': 'text/plain' })).status() === 415);
    check('broken JSON is refused', (await post('{nope')).status() === 400);
    check('an oversize body is refused', (await post(JSON.stringify({ question: 'x'.repeat(6000) }))).status() === 413);
    check('an over-long question is refused', (await post({ question: 'x'.repeat(501) })).status() === 400);
    check('an unexpected field is refused', (await post({ question: 'hi', role: 'system' })).status() === 400);
    check('the hidden field catches automated requests', (await post({ question: 'hi', website: 'http://spam.example' })).status() === 400);
    check('an unknown section is refused', (await post({ question: 'What is slack water?', section: '/admin' })).status() === 400);
    check('a known section is accepted', (await post({ question: 'What is slack water?', section: '/navigation' })).status() === 200);
    const errBody = await (await post({ question: 'x'.repeat(501) })).text();
    check('error replies hold no key and no stack trace', !errBody.includes(KEY) && !/at \w+ \(|node_modules|\/home\//.test(errBody));
    // The key is in no file the site serves.
    const files = fs.readdirSync(path.join(__dirname, '..', 'dist', 'assets'));
    const leaked = files.filter((f) => fs.readFileSync(path.join(__dirname, '..', 'dist', 'assets', f), 'utf8').includes('sk-test-key')) ;
    check('the key is in no file the site serves', leaked.length === 0);
    check('there are no other endpoints: no admin and no way to read or change the library through the API', (await api.post(A + '/api/admin', { headers: good, data: '{}' })).status() === 404 && (await api.get(A + '/api/kb')).status() === 404 && (await api.put(A + '/api/ask', { headers: good, data: '{}' })).status() === 405 && (await api.delete(A + '/api/ask', { headers: good })).status() === 405);
    const kbOverHttp = await api.get(A + '/src/knowledge/kb.json');
    check('the library file is not served as a file from the source folder', kbOverHttp.status() === 404 || !/"passages"/.test(await kbOverHttp.text()));
    await api.dispose();
  }

  // 4. Not switched on: no key.
  {
    const { context, page, problems } = await newPage(browser, B);
    await page.goto(B + '/', { waitUntil: 'networkidle' });
    await openAssistant(page);
    await ask(page, 'What is slack water?');
    await page.locator('.message--app .answer__text').first().waitFor();
    const t = await lastReply(page).innerText();
    check('without a key the assistant says it is not switched on and why', /not switched on yet/.test(t) && /Claude API key/.test(t), t.slice(0, 120));
    check('it does not pretend to answer', (await page.locator('.source-card').count()) === 0);
    const api = await request.newContext();
    const r = await api.post(B + '/api/ask', { headers: { Origin: B, 'Content-Type': 'application/json' }, data: JSON.stringify({ question: 'What is slack water?' }) });
    check('the endpoint answers 503 not_configured', r.status() === 503 && (await r.json()).error === 'not_configured');
    await api.dispose();
    check('no console problems', problems.filter((p) => !/503/.test(p)).length === 0, problems.join(' | '));
    await context.close();
  }

  // 5. Limits.
  {
    const { context, page } = await newPage(browser, C);
    await page.goto(C + '/', { waitUntil: 'networkidle' });
    await openAssistant(page);
    await ask(page, 'What is slack water?');
    await page.locator('.answer__text').first().waitFor();
    await ask(page, 'What is slack water?');
    await page.locator('.answer__text').nth(1).waitFor();
    await ask(page, 'What is slack water?');
    await page.locator('.answer__text').nth(2).waitFor();
    check('too many questions get a clear message', /asking too quickly/.test(await lastReply(page).innerText()), (await lastReply(page).innerText()).slice(0, 100));
    await context.close();
    const api = await request.newContext();
    const r = await api.post(D + '/api/ask', { headers: { Origin: D, 'Content-Type': 'application/json' }, data: JSON.stringify({ question: 'What is slack water?' }) });
    const r2 = await api.post(D + '/api/ask', { headers: { Origin: D, 'Content-Type': 'application/json' }, data: JSON.stringify({ question: 'What is slack water?' }) });
    check('a daily limit for the whole app stops further questions with a clear message', r.status() === 200 && r2.status() === 429 && (await r2.json()).error === 'daily_limit' && Number(r2.headers()['retry-after']) > 0);
    await api.dispose();
  }

  // 6. Knowledge Centre (no key needed).
  {
    const { context, page, problems, outside } = await newPage(browser, B);
    await page.goto(B + '/knowledge', { waitUntil: 'networkidle' });
    const hub = await page.locator('main').innerText();
    check('Knowledge Centre: the search and the document list are Preview and the sources page is Available', (await page.locator('.item-card--preview').count()) === 2 && /Sources and limits[\s\S]*Available/.test(hub), `preview=${await page.locator('.item-card--preview').count()}`);
    await page.goto(B + '/knowledge/search', { waitUntil: 'networkidle' });
    await page.locator('#kb-query').waitFor();
    check('search: says what it searches and that nothing is sent anywhere', /runs on your device/.test(await page.locator('main').innerText()) && /passages from \d+ sources/.test(await page.locator('main').innerText()));
    check('search: before typing it asks for a word or question', /Type a word or a question to search/.test(await page.locator('.kb-count').innerText()));
    await page.locator('#kb-query').fill('slack water');
    const first = page.locator('.item-card').first();
    await first.waitFor();
    const want = search(index, 'slack water', { limit: 12 });
    check('search: results match the library’s own search, best first', (await page.locator('.item-card').count()) === want.length && (await first.locator('h2').innerText()) === want[0].passage.title, `${await page.locator('.item-card').count()} of ${want.length}`);
    check('search: each result names its source, says it is not approved and links to the page', /Source:/.test(await first.innerText()) && /Not yet approved by the club/.test(await first.innerText()) && (await first.getByRole('link', { name: 'Open the page in this app' }).getAttribute('href')) === want[0].passage.href);
    await page.locator('#kb-query').fill('best pizza in Dublin');
    check('search: a question with no match says so', /No passage matches strongly enough/.test(await page.locator('.kb-count').innerText()) && (await page.locator('.item-card').count()) === 0);
    await page.locator('#kb-query').fill('camping kit');
    await page.locator('.item-card').first().waitFor();
    check('search: a gap shows as Not covered', (await page.locator('.badge', { hasText: 'Not covered' }).count()) >= 1);
    await page.locator('#kb-query').fill('How do I tow a casualty?');
    await page.getByRole('button', { name: 'Ask the Kayaking Assistant this question' }).click();
    await page.locator('#assistant-question').waitFor();
    check('search: the ask button opens the assistant with the question', (await page.locator('#assistant-question').inputValue()) === 'How do I tow a casualty?');
    await page.keyboard.press('Escape');
    await page.screenshot({ path: `${OUT}/search-mobile.png`, fullPage: true });
    await page.goto(B + '/knowledge/documents', { waitUntil: 'networkidle' });
    await page.locator('.item-card').first().waitFor();
    check('documents: every cited source is listed as not approved', (await page.locator('.item-card').count()) === Object.keys(kbFile.docs).length && (await page.locator('.badge', { hasText: 'Not approved yet' }).count()) === Object.keys(kbFile.docs).length);
    check('documents: says no document is approved and lists what is not covered', /No document has been approved by the club yet/.test(await page.locator('main').innerText()) && /live weather, tides or radio/.test(await page.locator('main').innerText()));
    check('documents: external source links open safely', (await page.$$eval('main a[target="_blank"]', (as) => as.every((a) => a.rel.includes('noopener') && a.rel.includes('noreferrer')))));
    await page.screenshot({ path: `${OUT}/documents-mobile.png`, fullPage: true });
    check('the search page made no request to any other site', outside.length === 0, outside.join(', '));
    check('no console problems', problems.length === 0, problems.join(' | '));
    await context.close();
  }

  // 7. Layout and labels at 320 px with 200% text.
  {
    const { context, page, problems } = await newPage(browser, A, { width: 320, height: 640 });
    mock.setMode('long');
    await page.goto(A + '/knowledge/search', { waitUntil: 'networkidle' });
    await page.locator('#kb-query').fill('rescue '.repeat(3));
    await page.locator('.item-card').first().waitFor();
    for (const r of ['/knowledge', '/knowledge/search', '/knowledge/documents']) {
      await page.goto(A + r, { waitUntil: 'networkidle' });
      if (r === '/knowledge/search') {
        await page.locator('#kb-query').fill('slack water');
        await page.locator('.item-card').first().waitFor();
      }
      if (r === '/knowledge/documents') await page.locator('.item-card').first().waitFor();
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`${r} has no sideways scroll at 320 px with 200% text`, overflow <= 0, `overflow=${overflow}px`);
      const unlabeled = await page.evaluate(() => Array.from(document.querySelectorAll('main input, main select, main textarea')).filter((el) => !(el.id && document.querySelector(`label[for="${el.id}"]`)) && !el.getAttribute('aria-label')).map((el) => el.id || el.tagName));
      check(`${r} every form control has a label`, unlabeled.length === 0, unlabeled.join(','));
      const small = await page.evaluate(() => Array.from(document.querySelectorAll('main button, main a, main summary')).filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && (b.height < 24 || b.width < 24); }).map((el) => (el.textContent || '').trim().slice(0, 30)));
      check(`${r} no touch target under 24 px`, small.length === 0, small.join(' | '));
    }
    await page.goto(A + '/', { waitUntil: 'networkidle' });
    await openAssistant(page);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await ask(page, 'What is slack water?');
    await page.locator('.answer__text').first().waitFor();
    const fit = await page.evaluate(() => { const b = document.querySelector('.sheet__body'); const m = document.querySelector('.message--app'); return { body: b.scrollWidth - b.clientWidth, msg: m.scrollWidth - m.clientWidth, page: document.documentElement.scrollWidth - document.documentElement.clientWidth }; });
    check('a long unbroken answer wraps inside the window at 320 px with 200% text', fit.body <= 0 && fit.msg <= 0 && fit.page <= 0, JSON.stringify(fit));
    await page.screenshot({ path: `${OUT}/assistant-320.png` });
    mock.setMode('ok');
    check('no console problems at 320 px', problems.length === 0, problems.join(' | '));
    await context.close();
  }

  await browser.close();
  await mock.close();
  for (const c of children) c.kill();
  console.log(failures === 0 ? '\nAll Stage 6 checks passed.' : `\n${failures} Stage 6 check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => {
  console.error(e);
  for (const c of children) c.kill();
  process.exit(1);
});
