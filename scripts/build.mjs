// Production build: bundles the app with esbuild and writes a static site to dist/.
// Usage: node scripts/build.mjs        (club chosen with the CLUB environment variable, default ecskc)
import { build } from 'esbuild';
import { readFile, writeFile, mkdir, rm, rename, cp, readdir } from 'node:fs/promises';
import path from 'node:path';

export async function loadClub(slug) {
  const file = path.join('src', 'clubs', slug, 'club.json');
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    throw new Error(`Club "${slug}" not found. Expected ${file}. Folders under src/clubs/ are the available clubs.`);
  }
}

export async function bundle({ slug, minify, outdir = 'dist' }) {
  const club = await loadClub(slug);
  const result = await build({
    entryPoints: { app: 'src/main.tsx' },
    bundle: true,
    outdir: path.join(outdir, 'assets'),
    entryNames: '[name]-[hash]',
    format: 'esm',
    // Code that only some pages need (the trip planner and the PDF writer) loads on demand, so Home stays small.
    splitting: true,
    chunkNames: 'chunk-[hash]',
    target: ['es2022'],
    jsx: 'automatic',
    minify,
    sourcemap: minify ? false : 'inline',
    metafile: true,
    legalComments: 'none',
    define: {
      'process.env.NODE_ENV': JSON.stringify(minify ? 'production' : 'development'),
      __CLUB_SLUG__: JSON.stringify(slug),
    },
    logLevel: 'warning',
  });
  const outputs = Object.keys(result.metafile.outputs);
  const js = outputs.find((f) => f.endsWith('.js') && result.metafile.outputs[f].entryPoint === 'src/main.tsx');
  const css = outputs.find((f) => f.endsWith('.css'));
  if (!js || !css) throw new Error('Build produced no JavaScript or CSS output.');
  return { club, js: '/' + path.relative(outdir, js).split(path.sep).join('/'), css: '/' + path.relative(outdir, css).split(path.sep).join('/') };
}

export async function writeSite({ slug, club, js, css, outdir = 'dist' }) {
  // Static files shared by every club.
  for (const name of await readdir('public')) {
    if (name === 'clubs') continue;
    await cp(path.join('public', name), path.join(outdir, name), { recursive: true });
  }
  // Only the chosen club's assets are published.
  await cp(path.join('public', 'clubs', slug), path.join(outdir, 'clubs', slug), { recursive: true });

  const template = await readFile('index.html', 'utf8');
  const fill = {
    TITLE: `${club.appName} | ${club.shortName}`,
    DESCRIPTION: `${club.appName}: planning, safety and navigation reference for ${club.name} members.`,
    THEME_COLOR: club.theme.primary,
    CLUB: slug,
    CLUB_URL: club.website.url,
    CSS: css,
    JS: js,
  };
  const html = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in fill)) throw new Error(`index.html uses unknown placeholder {{${key}}}`);
    return String(fill[key]).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  });
  await writeFile(path.join(outdir, 'index.html'), html);

  const manifest = {
    name: club.appName,
    short_name: club.pwaShortName,
    description: fill.DESCRIPTION,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: club.theme.primary,
    icons: [
      { src: `/clubs/${slug}/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `/clubs/${slug}/icon-512.png`, sizes: '512x512', type: 'image/png' },
    ],
  };
  await writeFile(path.join(outdir, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const slug = process.env.CLUB || 'ecskc';
  try {
    // Build into dist.tmp and swap it in only when everything has worked, so a failed build never leaves a broken dist/.
    await rm('dist.tmp', { recursive: true, force: true });
    await mkdir('dist.tmp', { recursive: true });
    const built = await bundle({ slug, minify: true, outdir: 'dist.tmp' });
    await writeSite({ slug, ...built, outdir: 'dist.tmp' });
    await rm('dist', { recursive: true, force: true });
    await rename('dist.tmp', 'dist');
    console.log(`Built ${built.club.appName} for ${built.club.shortName} into dist/`);
  } catch (error) {
    await rm('dist.tmp', { recursive: true, force: true });
    console.error(`Build failed: ${error.message}`);
    process.exit(1);
  }
}
