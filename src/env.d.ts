// Injected at build time by scripts/build.mjs.
declare const __CLUB_SLUG__: string;

// CSS files are bundled by esbuild; this tells TypeScript that importing one is fine.
declare module '*.css';
