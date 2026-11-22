// Vercel serverless function: POST /api/ask
// The assistant's front door. All the logic is in src/knowledge/ask.js; this file only reads the request and the settings.
// Settings (set in the host's environment-variable page, never in the code):
//   ASSISTANT_ENABLED        must be 1 for this function to answer anything. The first simplified version of the app has no
//                            assistant, so this stays OFF there: even with a key set, nothing is sent to Claude and nothing is billed.
//   ANTHROPIC_API_KEY        required (as well). Without it the assistant answers "not switched on" and calls nothing.
//   ANTHROPIC_MODEL          optional. Defaults to claude-sonnet-5-5.
//   ASSISTANT_ALLOWED_ORIGINS optional. Comma-separated extra origins allowed to ask (for a custom domain).
//   ANTHROPIC_BASE_URL       optional, for testing against a stand-in server (https, or http on localhost only).
import { readFileSync } from 'node:fs';
import { createLimiter, handleAsk, MAX_BODY_BYTES } from '../src/knowledge/ask.js';
import { buildIndex } from '../src/knowledge/search.js';

const kb = JSON.parse(readFileSync(new URL('../src/knowledge/kb.json', import.meta.url), 'utf8'));
const index = buildIndex(kb.passages, kb.docs);
// Limits (all optional): ASSISTANT_PER_MINUTE, ASSISTANT_PER_HOUR, ASSISTANT_PER_DAY for each visitor, ASSISTANT_DAILY_LIMIT for the whole app.
const number = (name) => Number(process.env[name]) || undefined;
const limiter = createLimiter({ perMinute: number('ASSISTANT_PER_MINUTE'), perHour: number('ASSISTANT_PER_HOUR'), perDay: number('ASSISTANT_PER_DAY'), daily: number('ASSISTANT_DAILY_LIMIT') });

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES * 2) {
        reject(new Error('too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  // Off unless ASSISTANT_ENABLED=1. This check comes first, before the body is read, the limits are used or Claude is called.
  if (process.env.ASSISTANT_ENABLED !== '1') {
    res.statusCode = 503;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({ error: 'not_configured', message: 'The assistant is switched off in this version of the app.' }));
    return;
  }
  let bodyText = '';
  try {
    bodyText = req.method === 'POST' ? await readBody(req) : '';
  } catch {
    res.statusCode = 413;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'too_large', message: 'That request is too large.' }));
    return;
  }
  const forwarded = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim();
  const result = await handleAsk(
    { method: req.method ?? 'GET', headers: Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : String(v ?? '')])), bodyText, ip: forwarded || req.socket?.remoteAddress || 'unknown' },
    { env: process.env, kb, limiter, fetchImpl: fetch, index },
  );
  res.statusCode = result.status;
  for (const [k, v] of Object.entries(result.headers)) res.setHeader(k, v);
  res.end(JSON.stringify(result.json));
}
