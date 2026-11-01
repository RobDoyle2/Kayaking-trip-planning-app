// Tiny static file server with single-page-app fallback.
// It applies the same response headers as vercel.json so security headers can be tested locally.
// For local testing only. The live site is served by the hosting provider, not by this script.
// Usage: node scripts/serve.mjs dist [port]
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'dist');
const port = Number(process.argv[3] || process.env.PORT || 4173);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

// Header rules from vercel.json, so local previews behave like the host.
const rules = [];
try {
  const config = JSON.parse(await readFile('vercel.json', 'utf8'));
  for (const rule of config.headers ?? []) rules.push(rule);
} catch {
  // No vercel.json: serve without extra headers.
}

function headersFor(urlPath) {
  const headers = {};
  for (const rule of rules) {
    const isAll = rule.source === '/(.*)';
    const isAssets = rule.source === '/assets/(.*)' && urlPath.startsWith('/assets/');
    if (isAll || isAssets) for (const { key, value } of rule.headers) headers[key] = value;
  }
  return headers;
}

/** Maps a URL to a file inside root. Returns { bad: true } for anything that tries to leave root. */
function resolveSafe(rawUrl) {
  let decoded;
  try {
    decoded = decodeURIComponent(rawUrl.split('?')[0].split('#')[0]);
  } catch {
    return { bad: true };
  }
  if (decoded.includes('\0')) return { bad: true };
  const file = path.resolve(root, '.' + path.posix.normalize('/' + decoded));
  if (file !== root && !file.startsWith(root + path.sep)) return { bad: true };
  return { file };
}

async function findFile(file) {
  try {
    const info = await stat(file);
    if (info.isFile()) return file;
    if (info.isDirectory()) return findFile(path.join(file, 'index.html'));
  } catch {
    return null;
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  const rawUrl = req.url || '/';
  const urlPath = rawUrl.split('?')[0];
  const extra = headersFor(urlPath);
  try {
    const target = resolveSafe(rawUrl);
    if (target.bad) {
      res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8', ...extra });
      res.end('Bad request');
      return;
    }
    let file = await findFile(target.file);
    // Anything that is not a real file and has no extension is an app route: serve the app.
    if (!file && !path.extname(urlPath)) file = path.join(root, 'index.html');
    if (!file) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8', ...extra });
      res.end('Not found');
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, {
      'content-type': types[path.extname(file)] || 'application/octet-stream',
      'cache-control': 'no-cache',
      ...extra,
    });
    res.end(body);
  } catch (error) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Server error');
    console.error(error);
  }
});

server.listen(port, () => console.log(`Serving ${root} at http://localhost:${port}`));
