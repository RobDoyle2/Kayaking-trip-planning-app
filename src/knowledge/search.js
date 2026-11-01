// @ts-check
/**
 * Keyword search over the assistant's library (BM25). Plain JavaScript with no dependencies, so the same code runs in the
 * server function, in the Knowledge Centre page in the browser, and in the tests.
 */

/**
 * @typedef {{ id: string, docs: string[], title: string, where?: string, href: string, blocks: string[], kind: 'reference' | 'gap', safety: boolean, approved: boolean }} Passage
 * @typedef {{ passage: Passage, score: number, matched: number }} Hit
 * @typedef {{ minCoverage: number, minScore: number }} Thresholds
 */

const STOP = new Set(
  (
    'a an and are as at be been being but by can could did do does doing for from had has have how i if in into is it its just may me might my no not of on or our shall should so some such than that the their them then there these they this those to us was we were what when where which who whom why will with would you your ' +
    'about after again all also am any because before between both consider day each few get give go going good here include including know like make many more most much need needs now only other out over own please same see should still tell their too under up use used using very want way well yes'
  ).split(' '),
);

/** Words people use for things the library names differently. Kept small and obvious. */
const SYNONYMS = {
  kit: ['equipment'],
  gear: ['equipment'],
  radio: ['vhf'],
  lifejacket: ['buoyancy'],
  pfd: ['buoyancy'],
  tide: ['tidal'],
  tidal: ['tide'],
  safe: ['safety'],
  sos: ['distress'],
  mayday: ['distress'],
};

/** Lower-case, no accents, apostrophes dropped, anything that is not a letter or digit becomes a space. */
export function normalise(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’‘]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** A light stemmer: plural, "-ing", "-ed" and a trailing "e" come off, so "crossings" and "crossing" meet. */
export function stem(word) {
  let w = word;
  if (w.length > 4 && w.endsWith('ies')) w = `${w.slice(0, -3)}y`;
  else if (w.length > 4 && /(ss|sh|ch|x|z)es$/.test(w)) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is')) w = w.slice(0, -1);
  if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
  if (w.length > 3 && w.endsWith('e')) w = w.slice(0, -1);
  return w;
}

/** Search terms for a piece of text: stemmed, with filler words removed. */
export function tokenize(text) {
  const out = [];
  for (const raw of normalise(text).split(' ')) {
    if (!raw || STOP.has(raw)) continue;
    if (raw.length < 2 && !/\d/.test(raw)) continue;
    out.push(stem(raw));
  }
  return out;
}

function expandQuery(tokens) {
  const set = new Set(tokens);
  for (const t of tokens) {
    for (const [word, alts] of Object.entries(SYNONYMS)) {
      if (stem(word) === t) for (const a of alts) set.add(stem(a));
    }
  }
  return [...set];
}

/**
 * Builds a search index. `passages` are the library's passages and `docs` the source titles, which are searchable too.
 * @param {Passage[]} passages
 * @param {Record<string, { title: string, short: string }>} docs
 */
export function buildIndex(passages, docs) {
  const entries = passages.map((passage) => {
    const titleTokens = tokenize(passage.title);
    const bodyTokens = tokenize(passage.blocks.join(' '));
    const docTokens = tokenize(passage.docs.map((d) => docs[d]?.short ?? '').join(' '));
    // The title counts three times and the source names once.
    const tokens = [...titleTokens, ...titleTokens, ...titleTokens, ...bodyTokens, ...docTokens];
    const tf = new Map();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    return { passage, tf, length: tokens.length, vocab: new Set(tokens) };
  });
  const df = new Map();
  for (const e of entries) for (const t of e.vocab) df.set(t, (df.get(t) ?? 0) + 1);
  const avg = entries.reduce((a, e) => a + e.length, 0) / Math.max(1, entries.length);
  return { entries, df, avg, n: entries.length };
}

/** @type {Thresholds} */
export const DEFAULT_THRESHOLDS = { minCoverage: 0.5, minScore: 3 };

/**
 * Finds the passages that best match a question. Returns nothing when the match is weak, so callers can say "not found"
 * instead of passing weak matches on. `section` is an optional app path (such as "/navigation") that nudges ties.
 * @param {ReturnType<typeof buildIndex>} index
 * @param {string} query
 * @param {{ limit?: number, section?: string, thresholds?: Thresholds }} [options]
 * @returns {Hit[]}
 */
export function search(index, query, options = {}) {
  const limit = options.limit ?? 6;
  const th = options.thresholds ?? DEFAULT_THRESHOLDS;
  const base = tokenize(query);
  if (base.length === 0) return [];
  const terms = expandQuery(base);
  const k1 = 1.2;
  const b = 0.75;
  const hits = [];
  for (const e of index.entries) {
    let score = 0;
    const matchedTerms = new Set();
    for (const t of terms) {
      const f = e.tf.get(t);
      if (!f) continue;
      const n = index.df.get(t) ?? 0;
      const idf = Math.log(1 + (index.n - n + 0.5) / (n + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * e.length) / index.avg)));
      matchedTerms.add(t);
    }
    if (score === 0) continue;
    // Coverage counts the question's own words (before synonyms were added) that this passage has, directly or by synonym.
    let covered = 0;
    for (const t of base) {
      if (e.vocab.has(t) || expandQuery([t]).some((x) => e.vocab.has(x))) covered++;
    }
    if (options.section && e.passage.href.startsWith(options.section)) score *= 1.15;
    hits.push({ passage: e.passage, score, matched: covered / base.length });
  }
  hits.sort((x, y) => y.score - x.score || x.passage.id.localeCompare(y.passage.id));
  const top = hits[0];
  if (!top || top.score < th.minScore || top.matched < th.minCoverage) return [];
  // Keep passages that are close enough to the best one to be worth reading.
  return hits.filter((h) => h.score >= top.score * 0.35 && h.matched >= th.minCoverage * 0.6).slice(0, limit);
}

const SAFETY_QUESTION = /rescu|emergenc|capsiz|hypotherm|drown|casualt|distress|mayday|\bvhf\b|coast ?guard|flare|\btow|tide race|overfall|\brace\b|surf|beaufort|wind|limit|unconscious|first.aid|swim|danger|hazard|fog|offshore|crossing|stream|tidal|tide|safe|risk|hurt|injur|lost|sink/i;

/** True when a question touches safety, so the answer carries the "check the source" note whatever it cites. */
export function isSafetyQuestion(text) {
  return SAFETY_QUESTION.test(String(text));
}
