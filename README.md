# Sea Kayaking Hub

A planning, safety and navigation reference for sea kayaking clubs. The first club is
**East Coast Sea Kayaking Club (ECSKC)**, <https://ecskc.eu/>. Each club has its own folder, logo,
colours and content, so other clubs can use the same code later.

## Where the project is

**Stages 1 and 2 of 6 are built:** the framework (home screen, ECSKC branding, menu, six section pages,
assistant entry point, Emergency card, Sources and limits) and the **Leadership tools** (guides, checklists,
SHEETS briefing form, risk assessment, equipment check, post-trip review, and My plans for saving them).

| Area | State |
|---|---|
| Home, menu, six section pages, layouts for phone, tablet and computer | Working |
| Emergency card | **Preview.** Wording comes from published sources and is not yet approved by the ECSKC committee |
| Sources and limits | Working. Written content only |
| Assistant button and window | Interface built. **Not connected:** it checks a question, then says it cannot answer and sends nothing anywhere. Stage 6 connects it |
| Leadership tools | **Preview.** Built from the supplied documents; not approved by the ECSKC committee. The SHEETS headings come from saturnbull.co.uk/sheets, paraphrased; permission to reuse them is unconfirmed. The risk assessment is a generic layout, not the club's template, and has no scoring |
| My plans | Working. Lists what is saved in this browser; download, import (whole file or nothing) and delete |
| Trip Planning, Training, Navigation and Tides, VHF tools | Not built. Each section page lists the planned items, each with a status label |
| Live tide and weather data | Not built. Nothing is fetched today (Stage 5) |
| Offline use (service worker) | Not built (Stage 5) |
| Photography | None. The hero uses an original drawn coastal scene until the club supplies photos it may use |

Items that cannot be built until you supply a document are marked **Blocked** in the app with the reason
(for example the SHEETS briefing, the skills library content, VHF radio procedures, and the Oileáin
high-water allowance rule).

## Run it on your computer

You need [Node.js](https://nodejs.org/) 20 or newer.

```bash
npm install
npm run dev        # http://localhost:5173 , rebuilds into dist-dev/ when you save; refresh the browser
npm test           # unit tests
npm run typecheck  # TypeScript check
npm run build      # production build into dist/
npm run preview    # serve dist/ at http://localhost:4173 with the same security headers as the host
```

## What it is built with

- React 19 and TypeScript, bundled by [esbuild](https://esbuild.github.io/) (`scripts/build.mjs`).
  There is no separate framework: a tiny built-in router (`src/router/Router.tsx`) handles pages.
- Plain CSS with design tokens (`src/styles/`). The club colours are read from `club.json` at start-up.
- A static site. A server is added only in Stage 6, for the assistant's API key.

## Folder guide

```
src/clubs/<club>/club.json   Everything that differs per club: name, colours, logo, website, emergency wording
src/clubs/index.ts           Which clubs are bundled
src/content/sections.ts      The six sections and every item in them, with its status (ready, preview, planned, blocked)
src/content/documents.ts     The reference documents supplied, and their approval status
src/components/              Reusable parts: buttons, notices, badges, header, menu, assistant window
src/pages/                   One file per page
src/router/                  The router and the address-cleaning rules (path.ts)
public/clubs/<club>/         That club's logo and app icons
scripts/                     build, dev server, static server
e2e/                         Browser tests
vercel.json                  Security headers, "do not index" header, single-page-app rewrite
```

### Change what a section says or add an item
Edit `src/content/sections.ts`. Every item has a `status`. An item may be `ready` or `preview` only if it
has a page (`href`). A `planned` item needs a `stage`. A `blocked` item needs a `blockedBy` reason. The unit
tests enforce this so nothing unfinished can look finished.

### Add another club
1. Copy `src/clubs/ecskc/` to `src/clubs/<slug>/` and edit `club.json`.
2. Put the club's logo and icons in `public/clubs/<slug>/` (same file names as ECSKC).
3. Add one import and one line to `src/clubs/index.ts`.
4. Build with `CLUB=<slug> npm run build`.

## Publish it and share one link

The Claude Project does not host web apps, so publishing is separate. The simplest arrangement is
**GitHub for the code and Vercel for hosting**. Vercel builds the site every time you push to GitHub and gives it
one web address.

1. **Put the code on GitHub.** Create a new repository (private is fine) and push this folder to it.
   ```bash
   git init
   git add .
   git commit -m "Sea Kayaking Hub, Stage 2"
   git branch -M main
   git remote add origin https://github.com/<you>/sea-kayaking-hub.git
   git push -u origin main
   ```
2. **Create a Vercel account** at <https://vercel.com> and sign in with GitHub.
3. **Add New, then Project,** and import the repository. Leave the settings as they are: `vercel.json`
   already says to run `npm run build` and publish `dist`.
4. **Deploy.** You get an address like `https://sea-kayaking-hub.vercel.app`. That is the one link to share.
5. **Optional:** add your own address under the project's Domains settings.

Notes:
- I could not test the Vercel steps from here, and I have not read Vercel's current plan terms. Check that its
  free tier suits a club project before you rely on it. Netlify and Cloudflare Pages work the same way; they use a
  `_headers` file in `public/` instead of `vercel.json` for the security headers.
- Stage 1 needs **no secrets**. Stage 6 needs one: `ANTHROPIC_API_KEY`, added in the host's environment-variable
  settings. It must never be written into the code or committed to GitHub (`.gitignore` already excludes `.env` files).

## Access and security

- Anyone with the link can open the app. There are no accounts and nothing to change from the browser.
- **Not indexed is not private.** The app sends a `noindex` header and tag and has a `robots.txt`. These only ask
  search engines to stay away. Do not treat the address as a secret.
- Response headers (set in `vercel.json`) include a strict Content-Security-Policy, `X-Frame-Options: DENY`,
  `nosniff` and a limited `Referrer-Policy`.
- External links open in a new tab with `rel="noopener noreferrer"` and say so to screen readers.
- Typed questions are cleaned and length-checked (`src/components/assistant/validate.ts`). The same rules will be
  applied again on the server in Stage 6.
- One trade-off to know about: `robots.txt` blocks crawling, and a crawler that cannot fetch a page cannot read
  its `noindex` tag. For an address that nobody links to this makes no difference. If the link is ever posted
  publicly and you want search engines to read the `noindex`, delete the `Disallow: /` line in `public/robots.txt`.

## How saving works

The Leadership tools save **in the user's browser, on that device** (localStorage, keys `skh:<club>:<item>`), only
after the user changes something. Nothing is sent to a server, nothing appears on another phone or browser, and it is
lost if the browser's site data is cleared. Each page has print, copy and download-text buttons, and My plans can
download everything as one file and import it again. Cookies are not used. Saving on a server, so a plan opens on any device, needs a database
and is deliberately left for a later phase. The app will not call anything "saved" unless it is.

## Testing

```bash
npm test                         # 55 unit tests: section rules, club config, question checks, addresses, saving, SHEETS, checklists
```

Browser tests (they drive a real Chromium; install once with `npm install --no-save playwright` then
`npx playwright install chromium`; the contrast check also needs Python with Pillow):

```bash
npm run build
node scripts/serve.mjs dist 4173 &     # serve the built site with the host's security headers
node e2e/smoke.cjs                     # 321 checks: every page, menu, assistant window, tap targets, console errors
node e2e/stage2.cjs                    # Leadership: saving, reload, SHEETS, print, export/import, 320px, blocked storage
node e2e/audit.cjs                     # 184 checks: odd addresses, Back button, injection, CSP, 320px and 200% text,
                                       #   accessibility structure, privacy, print, performance under throttling
python3 e2e/contrast.py                # colour contrast measured from real screenshot pixels
```

Results for the current build are in the testing report in the project. In short: all of the above pass; the
home page paints in about 1.9 s on a throttled 4G connection with a CPU four times slower than normal (measured against a
local server, so treat it as indicative); the JavaScript is 75 KB compressed.

**Not tested:** `npm install` and `npm run typecheck` against the real React type packages, and a real deployment. The
package registry was blocked in the session that built and tested the app, so it was bundled and tested with locally
available copies of React and esbuild, and the type check could not use `@types/react`. Run `npm install`,
`npm run build`, `npm test` and `npm run typecheck` first on your own computer and tell me about any errors. Also not yet
tested: a screen reader, real phones, Safari and Firefox.

## Third-party material

The ECSKC logo belongs to the club and is used exactly as supplied. The reference documents listed on the
Sources and limits page belong to their publishers; none of their text is included in the app yet. Get permission, or
decide to link and paraphrase, before any of it is published.
