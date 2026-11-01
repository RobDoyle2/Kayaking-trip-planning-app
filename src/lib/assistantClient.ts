/**
 * The browser's side of the assistant: send a question to this app's own server (never to Claude directly) and check what
 * comes back before anything is shown. A reply that is not in the expected shape becomes a plain error, never half an answer.
 */

export interface SourceCard {
  passageId: string;
  title: string;
  where?: string;
  /** A page in this app. */
  href: string;
  docs: { short: string; title: string; url?: string }[];
  /** The exact line or lines from the library that the answer rests on. */
  quote: string;
  approved: boolean;
}

export type AskResult =
  | { kind: 'answer'; answer: string; sources: SourceCard[]; safety: boolean; safetyNote?: string; notices: string[] }
  | { kind: 'not_found'; message: string; safety: boolean; safetyNote?: string; notices: string[] }
  | { kind: 'error'; code: 'not_configured' | 'rate_limit' | 'daily_limit' | 'upstream' | 'network' | 'bad_request' | 'other'; message: string; retryAfterSeconds?: number };

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const str = (x: unknown, max = 2000): string | null => (typeof x === 'string' && x.length <= max ? x : null);
/** Only links inside this app. */
const inApp = (x: unknown): string | null => (typeof x === 'string' && /^\/(?!\/)[\w\-/]*$/.test(x) ? x : null);
const https = (x: unknown): string | undefined => (typeof x === 'string' && /^https:\/\/[^\s]+$/.test(x) && x.length < 500 ? x : undefined);

function readSource(x: unknown): SourceCard | null {
  if (!isObj(x)) return null;
  const passageId = str(x.passageId, 120);
  const title = str(x.title, 300);
  const href = inApp(x.href);
  const quote = str(x.quote, 3000);
  if (!passageId || !title || !href || !quote || !Array.isArray(x.docs)) return null;
  const docs = x.docs.flatMap((d) => {
    if (!isObj(d)) return [];
    const short = str(d.short, 200);
    const t = str(d.title, 400);
    const url = https(d.url);
    return short && t ? [{ short, title: t, ...(url ? { url } : {}) }] : [];
  });
  const where = str(x.where, 300);
  return { passageId, title, href, quote, docs, approved: x.approved === true, ...(where ? { where } : {}) };
}

/** Checks a reply from /api/ask. Exported for tests. */
export function readReply(status: number, body: unknown): AskResult {
  if (!isObj(body)) return { kind: 'error', code: 'other', message: 'The assistant gave a reply this page could not read. Please try again.' };
  if (status === 200) {
    const notices = Array.isArray(body.notices) ? body.notices.flatMap((n) => (str(n, 300) ? [n as string] : [])) : [];
    const safety = body.safety === true;
    const safetyNote = str(body.safetyNote, 600) ?? undefined;
    if (body.kind === 'not_found') {
      const message = str(body.message, 600);
      if (message) return { kind: 'not_found', message, safety, ...(safetyNote ? { safetyNote } : {}), notices };
    }
    if (body.kind === 'answer') {
      const answer = str(body.answer, 2500);
      const sources = Array.isArray(body.sources) ? body.sources.flatMap((s) => readSource(s) ?? []) : [];
      // An answer with no source to show is never displayed.
      if (answer && sources.length > 0) return { kind: 'answer', answer, sources, safety, ...(safetyNote ? { safetyNote } : {}), notices };
    }
    return { kind: 'error', code: 'other', message: 'The assistant gave a reply this page could not read. Please try again.' };
  }
  const message = str(body.message, 600) ?? 'The assistant could not answer just now. Please try again.';
  const wait = typeof body.retryAfterSeconds === 'number' && body.retryAfterSeconds > 0 && body.retryAfterSeconds < 100000 ? Math.ceil(body.retryAfterSeconds) : undefined;
  const code = body.error === 'not_configured' ? 'not_configured' : body.error === 'rate_limit' ? 'rate_limit' : body.error === 'daily_limit' ? 'daily_limit' : status === 502 ? 'upstream' : status === 400 ? 'bad_request' : 'other';
  return { kind: 'error', code, message, ...(wait ? { retryAfterSeconds: wait } : {}) };
}

export async function askAssistant(question: string, section: string | undefined, signal?: AbortSignal, fetchImpl: typeof fetch = fetch): Promise<AskResult> {
  try {
    const response = await fetchImpl('/api/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(section ? { question, section } : { question }),
      ...(signal ? { signal } : {}),
    });
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    return readReply(response.status, body);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    return { kind: 'error', code: 'network', message: 'Could not reach the assistant. Check your connection and try again. The Knowledge Centre search may still work.' };
  }
}
