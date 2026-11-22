// Injected at build time by scripts/build.mjs.
declare const __CLUB_SLUG__: string;
/** true only in a build made with SKH_ASSISTANT=1 (see scripts/build.mjs). The normal build leaves the assistant out. */
declare const __ASSISTANT__: boolean;

// CSS files are bundled by esbuild; this tells TypeScript that importing one is fine.
declare module '*.css';
