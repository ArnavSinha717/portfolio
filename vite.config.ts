import { defineConfig } from 'vite';

// Served from https://arnavsinha717.github.io/portfolio/
export default defineConfig({
  base: '/portfolio/',
  build: {
    target: 'es2022',
    modulePreload: { polyfill: false },
    // three.js is one lazy chunk (~140 kB gzip), loaded after first paint.
    chunkSizeWarningLimit: 600,
  },
});
