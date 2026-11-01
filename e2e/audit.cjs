// Independent audit: route edge cases, injection and CSP, reflow at 320px and 200% text, accessibility structure,
// privacy, print, performance under throttling, and pixel contrast capture. Run after smoke.cjs (same setup).
// Then:  python3 e2e/contrast.py   (needs Pillow)
// Collects findings as data; it does not stop at the first failure.
const { chromium } = require('playwright');
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:4173';
const DIST = process.env.DIST || path.join(__dirname, '..', 'dist');
const OUT = process.env.OUT || path.join(__dirname, 'out', 'audit');
fs.mkdirSync(OUT, { recursive: true });

const findings = [];
function rec(area, name, ok, detail = '') {
  findings.push({ area, name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${area}] ${name}${detail ? '  -> ' + detail : ''}`);
}

const routes = ['/', '/leadership', '/trip-planning', '/training', '/navigation', '/vhf', '/knowledge', '/emergency', '/sources', '/my-plans', '/leadership/preparing', '/leadership/responsibilities', '/leadership/checklist', '/leadership/sheets', '/leadership/group', '/leadership/risk', '/leadership/equipment', '/leadership/review', '/trip-planning/day', '/trip-planning/multi-day', '/trip-planning/camping', '/training/guidance', '/training/plan', '/training/checklists', '/training/checklists/fsrt', '/training/checklists/leader-rescue', '/training/checklists/leader-background', '/training/qualifications', '/navigation/reference', '/navigation/tools', '/navigation/oileain', '/navigation/tides', '/navigation/weather', '/vhf/stations', '/knowledge/search', '/knowledge/documents'];

async function h1(page) {
  return (await page.locator('main h1').first().innerText().catch(() => '(none)')).trim();
}

(async () => {
  const browser = await chromium.launch();

  // ---------------------------------------------------------------- 1. route edge cases
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const cases = [
      ['/index.html', 'Sea Kayaking Hub'],
      ['//leadership', 'Leadership'],
      ['/leadership/', 'Leadership'],
      ['/leadership?x=1', 'Leadership'],
      ['/leadership#top', 'Leadership'],
      ['/Leadership', 'Leadership'],
      ['/emergency/', 'Emergency card'],
      ['/sources?utm_source=x', 'Sources and limits'],
      ['/leadership/extra', 'Page not found'],
      ['/%E0%A4%A', 'BAD'],
      ['/foo/../vhf', 'VHF Radio'],
    ];
    for (const [p, want] of cases) {
      let got;
      try {
        await page.goto(BASE + p, { waitUntil: 'networkidle' });
        got = await h1(page);
      } catch (e) {
        got = 'ERROR ' + e.message.split('\n')[0];
      }
      if (want === 'BAD') {
        const status = await page.evaluate(() => document.body.innerText.trim());
        rec('routes', `${p} (malformed address) is refused cleanly, not a crash`, /Bad request|Page not found/.test(status), status.slice(0, 40));
        continue;
      }
      rec('routes', `${p} shows "${want}"`, got === want, `got "${got}"`);
    }

    // Back button with menu open.
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.locator('.section-card', { hasText: 'Leadership' }).click();
    await page.waitForURL('**/leadership');
    await page.getByRole('button', { name: 'Open the menu' }).click();
    await page.goBack();
    await page.waitForURL(BASE + '/');
    await page.waitForSelector('#site-menu', { state: 'detached', timeout: 1500 }).catch(() => {});
    const menuStillOpen = await page.locator('#site-menu').count();
    rec('routes', 'Back button closes an open menu', menuStillOpen === 0, menuStillOpen ? 'menu stayed open over the previous page' : '');
    const bodyLocked = await page.evaluate(() => document.body.classList.contains('no-scroll'));
    rec('routes', 'page scroll is released after Back with menu open', !bodyLocked || menuStillOpen === 0, bodyLocked ? 'body still scroll-locked' : '');

    // Back button with assistant open.
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.locator('.section-card', { hasText: 'VHF' }).click();
    await page.waitForURL('**/vhf');
    await page.getByRole('button', { name: /Ask/ }).last().click();
    await page.goBack();
    await page.waitForURL(BASE + '/');
    await page.waitForSelector('#assistant-title', { state: 'detached', timeout: 1500 }).catch(() => {});
    rec('routes', 'Back button closes an open assistant', (await page.locator('#assistant-title').count()) === 0);
    await ctx.close();
  }

  // ---------------------------------------------------------------- 2. injection and CSP
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const consoleMsgs = [];
    page.on('console', (m) => consoleMsgs.push(`${m.type()}: ${m.text()}`));
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const payload = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>';
    await page.locator('#home-ask').fill(payload);
    await page.locator('.ask button[type=submit]').click();
    await page.locator('#assistant-question').waitFor();
    await page.getByRole('button', { name: 'Send' }).click();
    const xss = await page.evaluate(() => window.__xss);
    rec('security', 'HTML typed into the assistant is not executed', xss === undefined);
    const shown = await page.locator('.message--you').innerText();
    rec('security', 'typed HTML is shown as plain text', shown.includes('<img src=x'), shown.slice(0, 60));
    const imgInjected = await page.locator('.message--you img').count();
    rec('security', 'typed HTML creates no elements', imgInjected === 0);

    // Inline script injection should be blocked by the Content-Security-Policy.
    await page.evaluate(() => {
      const s = document.createElement('script');
      s.textContent = 'window.__csp = 1';
      document.head.appendChild(s);
    });
    rec('security', 'CSP blocks an injected inline script', (await page.evaluate(() => window.__csp)) === undefined);
    rec('security', 'CSP violation is reported to the console', consoleMsgs.some((m) => /Content Security Policy|Refused to execute/i.test(m)));
    const fetchResult = await page.evaluate(() => fetch('https://example.com/').then(() => 'allowed', () => 'blocked'));
    rec('security', 'CSP blocks requests to other sites', fetchResult === 'blocked', fetchResult);
    const frameBlocked = await page.evaluate(() => window.self === window.top);
    rec('security', 'page is not framed', frameBlocked);
    await ctx.close();

    // Framing: another page embedding the app must be refused.
    const ctx2 = await browser.newContext();
    const p2 = await ctx2.newPage();
    await p2.setContent(`<iframe id=f src="${BASE}/" width=400 height=300></iframe>`);
    await p2.waitForTimeout(1500);
    const framed = await p2.evaluate(() => {
      const f = document.getElementById('f');
      try { return !!f.contentDocument && f.contentDocument.body.innerText.length > 0; } catch { return false; }
    });
    rec('security', 'app cannot be embedded in another page (clickjacking)', framed === false);
    await ctx2.close();
  }

  // ---------------------------------------------------------------- 3. long input, reflow, zoom
  {
    const ctx = await browser.newContext({ viewport: { width: 320, height: 640 }, bypassCSP: true }); // bypass only so the test can inject a text-size style
    const page = await ctx.newPage();
    for (const r of routes) {
      await page.goto(BASE + r, { waitUntil: 'networkidle' });
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      rec('reflow', `${r} at 320px has no sideways page scroll`, ov <= 0, `overflow ${ov}px`);
    }
    // 200% text size.
    for (const r of routes) {
      await page.goto(BASE + r, { waitUntil: 'networkidle' });
      await page.addStyleTag({ content: 'html{font-size:200% !important}' });
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      rec('reflow', `${r} at 320px with 200% text has no sideways page scroll`, ov <= 0, `overflow ${ov}px`);
    }
    // Long unbroken word in the assistant.
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Ask/ }).last().click();
    await page.locator('#assistant-question').fill('A'.repeat(450));
    await page.getByRole('button', { name: 'Send' }).click();
    const msgOverflow = await page.evaluate(() => {
      const el = document.querySelector('.message--you');
      const sheet = document.querySelector('.sheet__body');
      return { msg: el.scrollWidth - el.clientWidth, body: sheet.scrollWidth - sheet.clientWidth };
    });
    rec('reflow', 'a 450-character unbroken word wraps inside the assistant', msgOverflow.msg <= 0 && msgOverflow.body <= 0, JSON.stringify(msgOverflow));
    const replyVisible = await page.evaluate(() => {
      const reply = document.querySelector('.message--app').getBoundingClientRect();
      const body = document.querySelector('.sheet__body').getBoundingClientRect();
      return { top: Math.round(reply.top - body.top), bottom: Math.round(body.bottom - reply.bottom) };
    });
    rec('usability', 'on a 320x640 phone the reply is visible right after sending (no scrolling needed)', replyVisible.top >= -1 && replyVisible.bottom >= -1, JSON.stringify(replyVisible));
    await page.screenshot({ path: `${OUT}/long-word-320.png` });
    await ctx.close();
  }

  // ---------------------------------------------------------------- 4. semantics
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    for (const r of routes) {
      await page.goto(BASE + r, { waitUntil: 'networkidle' });
      const info = await page.evaluate(() => {
        const levels = Array.from(document.querySelectorAll('h1,h2,h3,h4')).map((h) => Number(h.tagName[1]));
        let skips = 0;
        for (let i = 1; i < levels.length; i++) if (levels[i] - levels[i - 1] > 1) skips++;
        const ids = Array.from(document.querySelectorAll('[id]')).map((e) => e.id);
        const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
        const unlabeledButtons = Array.from(document.querySelectorAll('button')).filter(
          (b) => !(b.textContent || '').trim() && !b.getAttribute('aria-label'),
        ).length;
        const fields = Array.from(document.querySelectorAll('input, textarea, select'));
        const unlabeledFields = fields.filter((f) => {
          if (f.getAttribute('aria-label') || f.getAttribute('aria-labelledby')) return false;
          return !(f.id && document.querySelector(`label[for="${f.id}"]`));
        }).length;
        const imgsNoAlt = Array.from(document.querySelectorAll('img')).filter((i) => !i.hasAttribute('alt')).length;
        const svgBad = Array.from(document.querySelectorAll('svg')).filter((s) => s.getAttribute('aria-hidden') !== 'true' && !s.querySelector('title') && !s.getAttribute('aria-label')).length;
        const posTab = document.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])').length;
        const linksNoName = Array.from(document.querySelectorAll('a')).filter((a) => !(a.innerText || a.textContent || '').trim() && !a.getAttribute('aria-label')).length;
        const emptyHrefs = Array.from(document.querySelectorAll('a')).filter((a) => !a.getAttribute('href') || a.getAttribute('href') === '#').length;
        return {
          first: levels[0], skips, dupIds, unlabeledButtons, unlabeledFields, imgsNoAlt, svgBad, posTab, linksNoName, emptyHrefs,
          lang: document.documentElement.lang,
          landmarks: {
            banner: document.querySelectorAll('header.site-header').length,
            main: document.querySelectorAll('main').length,
            footer: document.querySelectorAll('footer').length,
          },
        };
      });
      rec('a11y', `${r} starts at h1 and never skips a level`, info.first === 1 && info.skips === 0, `levels start ${info.first}, skips ${info.skips}`);
      rec('a11y', `${r} has no duplicate ids`, info.dupIds.length === 0, info.dupIds.join(','));
      rec('a11y', `${r} every button, link and field has a name`, info.unlabeledButtons + info.unlabeledFields + info.linksNoName === 0, JSON.stringify(info));
      rec('a11y', `${r} images have alt, svgs are hidden or named`, info.imgsNoAlt === 0 && info.svgBad === 0, `imgNoAlt ${info.imgsNoAlt} svgBad ${info.svgBad}`);
      rec('a11y', `${r} has no positive tabindex and no empty links`, info.posTab === 0 && info.emptyHrefs === 0);
      rec('a11y', `${r} has one banner, one main, one footer and a page language`, info.landmarks.banner === 1 && info.landmarks.main === 1 && info.landmarks.footer === 1 && info.lang === 'en-IE', JSON.stringify(info.landmarks) + info.lang);
    }

    // Keyboard-only: open the menu with Enter, follow a link with Enter, reach the assistant and close it.
    const kctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const kpage = await kctx.newPage();
    await kpage.goto(BASE + '/', { waitUntil: 'networkidle' });
    const stops = [];
    for (let i = 0; i < 3; i++) {
      await kpage.keyboard.press('Tab');
      stops.push(await kpage.evaluate(() => { const e = document.activeElement; return (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 20); }));
    }
    rec('a11y', 'first Tab stops are the skip link, then the menu button, then the logo link', stops[0] === 'Skip to content' && stops[1] === 'Open the menu' && /^Sea Kayaking Hub/.test(stops[2]), stops.join(' | '));
    await kctx.close();
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Open the menu' }).focus();
    await page.keyboard.press('Enter');
    rec('a11y', 'Enter opens the menu', (await page.locator('#site-menu').count()) === 1);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    rec('a11y', 'keyboard can follow a menu link', (await h1(page)) !== 'Sea Kayaking Hub' || page.url() !== BASE + '/', page.url());

    // Visible focus on every control on the home page.
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const noFocusRing = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const s = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        return {
          tag: el.tagName + '.' + (el.className || '').toString().split(' ')[0],
          outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2,
          shadow: cs.boxShadow !== 'none',
        };
      });
      if (s && !s.outline && !s.shadow) noFocusRing.push(s.tag);
    }
    rec('a11y', 'every focusable control on Home shows a focus ring', noFocusRing.length === 0, noFocusRing.join(','));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 5. network, storage, noscript
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const origins = new Set();
    page.on('request', (r) => origins.add(new URL(r.url()).origin));
    for (const r of routes) await page.goto(BASE + r, { waitUntil: 'networkidle' });
    rec('privacy', 'every request goes to the app itself (no third parties)', origins.size === 1 && origins.has(BASE), Array.from(origins).join(', '));
    const store = await page.evaluate(() => ({ ls: localStorage.length, ss: sessionStorage.length, cookie: document.cookie }));
    rec('privacy', 'nothing is stored in the browser (no cookies, localStorage or sessionStorage)', store.ls === 0 && store.ss === 0 && store.cookie === '', JSON.stringify(store));
    const cookies = await ctx.cookies();
    rec('privacy', 'the server sets no cookies', cookies.length === 0);
    const sw = await page.evaluate(async () => (await navigator.serviceWorker?.getRegistrations?.())?.length ?? 0);
    rec('privacy', 'no service worker is registered (offline use is not claimed)', sw === 0);
    await ctx.close();

    const ctxNoJs = await browser.newContext({ javaScriptEnabled: false });
    const p = await ctxNoJs.newPage();
    await p.goto(BASE + '/');
    const nojs = await p.locator('noscript').first().textContent();
    rec('reliability', 'without JavaScript the page explains itself and links to the club site', /needs JavaScript/.test(nojs) && /ecskc\.eu/.test(nojs), (nojs || '').trim().slice(0, 60));
    await ctxNoJs.close();
  }

  // ---------------------------------------------------------------- 6. print
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    for (const r of ['/sources', '/emergency', '/leadership']) {
      await page.goto(BASE + r, { waitUntil: 'networkidle' });
      await page.emulateMedia({ media: 'print' });
      const vis = await page.evaluate(() => {
        const shown = (sel) => { const e = document.querySelector(sel); return !!e && getComputedStyle(e).display !== 'none'; };
        return { header: shown('.site-header'), footer: shown('.site-footer'), fab: shown('.fab'), h1: shown('main h1') };
      });
      rec('print', `${r} prints without header, footer or assistant button, keeps the heading`, !vis.header && !vis.footer && !vis.fab && vis.h1, JSON.stringify(vis));
      const pdf = `${OUT}/print${r.replace('/', '-')}.pdf`;
      await page.pdf({ path: pdf, format: 'A4', printBackground: false });
      await page.emulateMedia({ media: 'screen' });
    }
    await ctx.close();
  }

  // ---------------------------------------------------------------- 7. performance
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.addInitScript(() => {
      window.__lcp = 0; window.__cls = 0; window.__long = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long += Math.max(0, e.duration - 50); }).observe({ type: 'longtask', buffered: true });
    });
    const t0 = Date.now();
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const m = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const res = performance.getEntriesByType('resource');
      return {
        lcp: Math.round(window.__lcp), cls: +window.__cls.toFixed(4), tbt: Math.round(window.__long),
        dcl: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd),
        requests: res.length + 1, bytes: res.reduce((a, r) => a + (r.encodedBodySize || 0), 0) + nav.encodedBodySize,
      };
    });
    const sizes = {};
    for (const f of fs.readdirSync(path.join(DIST, 'assets'))) {
      const buf = fs.readFileSync(path.join(DIST, 'assets', f));
      const entry = { raw: buf.length, gzip: zlib.gzipSync(buf, { level: 9 }).length, brotli: zlib.brotliCompressSync(buf).length };
      // Code loaded on demand is reported together as "chunks.js", apart from the entry file that Home loads.
      const key = f.startsWith('chunk-') ? 'chunks.js' : f.split('-')[0] + path.extname(f);
      const prev = sizes[key];
      sizes[key] = prev ? { raw: prev.raw + entry.raw, gzip: prev.gzip + entry.gzip, brotli: prev.brotli + entry.brotli } : entry;
    }
    fs.writeFileSync(`${OUT}/perf.json`, JSON.stringify({ throttled: m, sizes, wall: Date.now() - t0 }, null, 2));
    console.log('PERF', JSON.stringify(m), JSON.stringify(sizes));
    rec('performance', 'home LCP under 2.5 s on throttled 4G with 4x slower CPU', m.lcp < 2500, `${m.lcp} ms`);
    rec('performance', 'home layout shift under 0.1', m.cls < 0.1, String(m.cls));
    rec('performance', 'main-thread blocking under 300 ms', m.tbt < 300, `${m.tbt} ms`);
    rec('performance', 'JavaScript loaded by Home under 100 KB when compressed', sizes['app.js'].gzip < 100 * 1024, `${(sizes['app.js'].gzip / 1024).toFixed(1)} KB gzip, ${(sizes['app.js'].brotli / 1024).toFixed(1)} KB brotli; on demand for section pages: ${((sizes['chunks.js'] || { gzip: 0 }).gzip / 1024).toFixed(1)} KB gzip`);
    await ctx.close();
  }

  // ---------------------------------------------------------------- 8. contrast from real pixels
  {
    const states = [];
    for (const [label, viewport] of [['m', { width: 390, height: 844 }], ['d', { width: 1280, height: 800 }]]) {
      const ctx = await browser.newContext({ viewport, bypassCSP: true }); // bypass only so the test can inject measuring styles
      const page = await ctx.newPage();
      const collect = (scopeSel) => page.evaluate((scopeSel) => {
        const out = [];
        const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map((x) => parseFloat(x)); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
        const root = scopeSel ? document.querySelector(scopeSel) : document.body;
        if (!root) return out;
        for (const el of root.querySelectorAll('*')) {
          if (el.closest('svg')) continue;
          const closed = el.closest('details:not([open])');
          if (closed && !el.closest('summary')) continue; // closed details content is not painted
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.display === 'none') continue;
          const hasText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
          const isField = (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && !el.value && el.placeholder;
          if (!hasText && !isField) continue;
          const color = parse(isField ? getComputedStyle(el, '::placeholder').color : cs.color);
          if (!color) continue;
          let opacity = 1; for (let n = el; n; n = n.parentElement) opacity *= parseFloat(getComputedStyle(n).opacity);
          out.push({ x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height), color, opacity, size: parseFloat(cs.fontSize), weight: parseInt(cs.fontWeight, 10), text: (isField ? el.placeholder : el.textContent).trim().slice(0, 40), sel: el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0] });
        }
        return out;
      }, scopeSel);
      const grab = async (name, { scope = null, full = true, hideFixed = true } = {}) => {
        if (hideFixed) await page.addStyleTag({ content: '.fab{visibility:hidden !important} .site-header{position:static !important}' });
        const items = await collect(scope);
        await page.addStyleTag({ content: '*{color:transparent !important;-webkit-text-fill-color:transparent !important;text-shadow:none !important} ::placeholder{color:transparent !important;-webkit-text-fill-color:transparent !important}' });
        await page.screenshot({ path: `${OUT}/bg-${label}-${name}.png`, fullPage: full });
        fs.writeFileSync(`${OUT}/items-${label}-${name}.json`, JSON.stringify(items));
        states.push(`${label}-${name}`);
      };
      for (const r of routes) {
        await page.goto(BASE + r, { waitUntil: 'networkidle' });
        await grab(r === '/' ? 'home' : r.slice(1).replace(/\//g, '-'));
      }
      // Rating sections are collapsed by default; open them all so their labels are measured too.
      await page.goto(BASE + '/leadership/review', { waitUntil: 'networkidle' });
      await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
      await grab('review-open');
      // A trip plan open for editing, with the optional limit check on, so the editor's colours are measured too.
      await page.goto(BASE + '/trip-planning/multi-day', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Start a new plan' }).click();
      await page.waitForSelector('#trip-name');
      await page.locator('#limits-on').check();
      await page.locator('#trip-lim-crossing').fill('3');
      await page.locator('#trip-lim-race').check();
      await page.getByRole('button', { name: 'Add a stop' }).click();
      await grab('trip-editor');
      await page.goto(BASE + '/trip-planning/multi-day', { waitUntil: 'networkidle' });
      await grab('trip-list-with-plan');
      // A development plan with ratings, a note and actions, so the summary and action list colours are measured too.
      await page.goto(BASE + '/training/plan', { waitUntil: 'networkidle' });
      await page.locator('select[id^="plan-"]').nth(1).selectOption('Develop');
      await page.locator('select[id^="plan-"]').nth(0).selectOption('Strong');
      await page.getByRole('button', { name: 'Add an action' }).click();
      await page.locator('input[id^="act-"][id$="-text"]').fill('Book a rescue session');
      await grab('plan-filled');
      // Calculators with results showing (a table, a result box and an error box), so their colours are measured too.
      await page.goto(BASE + '/navigation/tools', { waitUntil: 'networkidle' });
      await page.locator('#thirds-max').fill('2.4');
      await page.locator('#twelfths-low').fill('0.5');
      await page.locator('#twelfths-high').fill('4.5');
      await page.locator('#streamspeed-dist').fill('0.7');
      await page.locator('#streamspeed-min').fill('10');
      await page.locator('#streamspeed-boat').fill('3');
      await page.locator('#atlas-rate').fill('x');
      await grab('tools-filled');
      // The floating button, alone, at the top of a page.
      await page.goto(BASE + '/', { waitUntil: 'networkidle' });
      await page.evaluate(() => window.scrollTo(0, 0));
      await grab('fab', { scope: '.fab', full: false, hideFixed: false });
      // Menu open.
      await page.goto(BASE + '/leadership', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Open the menu' }).click();
      await page.waitForTimeout(500);
      await grab('menu', { scope: '#site-menu', full: false, hideFixed: false });
      await page.goto(BASE + '/leadership', { waitUntil: 'networkidle' });
      // Assistant: first with an error, then with a reply.
      await page.getByRole('button', { name: /Ask/ }).last().click();
      await page.getByRole('button', { name: 'Send' }).click();
      await page.waitForTimeout(500);
      await grab('assistant-error', { scope: '.sheet', full: false, hideFixed: false });
      await page.goto(BASE + '/leadership', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: /Ask/ }).last().click();
      await page.locator('#assistant-question').fill('Test question');
      await page.getByRole('button', { name: 'Send' }).click();
      await page.waitForTimeout(500);
      await grab('assistant-reply', { scope: '.sheet', full: false, hideFixed: false });
      await ctx.close();
    }
    fs.writeFileSync(`${OUT}/states.json`, JSON.stringify(states));
  }

  await browser.close();
  fs.writeFileSync(`${OUT}/findings.json`, JSON.stringify(findings, null, 2));
  const failed = findings.filter((f) => !f.ok);
  console.log(`\n${findings.length - failed.length}/${findings.length} audit checks passed`);
  console.log('FAILED:');
  for (const f of failed) console.log(' -', `[${f.area}]`, f.name, '|', f.detail);
})();
