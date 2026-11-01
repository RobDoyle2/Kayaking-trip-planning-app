// Development: rebuilds on every change under src/ or public/ and serves dist-dev/ on http://localhost:5173.
// Refresh the browser after saving a file (there is no live reload).
import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { rm, mkdir } from 'node:fs/promises';
import { bundle, writeSite } from './build.mjs';

const slug = process.env.CLUB || 'ecskc';

let building = false;
let again = false;

async function rebuild() {
  if (building) {
    again = true;
    return;
  }
  building = true;
  try {
    await rm('dist-dev', { recursive: true, force: true });
    await mkdir('dist-dev', { recursive: true });
    const built = await bundle({ slug, minify: false, outdir: 'dist-dev' });
    await writeSite({ slug, ...built, outdir: 'dist-dev' });
    console.log(new Date().toLocaleTimeString(), 'rebuilt');
  } catch (error) {
    console.error('Build failed:', error.message);
  } finally {
    building = false;
    if (again) {
      again = false;
      rebuild();
    }
  }
}

await rebuild();
for (const dir of ['src', 'public']) {
  watch(dir, { recursive: true }, () => rebuild());
}
spawn(process.execPath, ['scripts/serve.mjs', 'dist-dev', '5173'], { stdio: 'inherit' });
