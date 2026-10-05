# Portfolio

Personal site of Arnav Sinha, ML engineer: https://arnavsinha717.github.io/portfolio/

The hero is a live Three.js sketch of a Starlink-like constellation. About 1,750
satellites (around 900 on small screens) on 53°, 70° and 97.6° shells follow
two-body + J2 orbits computed in the vertex shader, in a single draw call. Every few
seconds one satellite manoeuvres (an amber flash), and a ring spreads to the neighbours
whose public orbit data becomes less certain: the effect studied in "Ripple-Aware
Cooperative Collision Avoidance for Satellite Mega-Constellations" (ICon INDIA 2026).

Every project has its own small animated figure (Figs. 2 to 9), drawn with
SVG and canvas. Everything that moves runs only while it is on screen and the tab is
visible. The three.js scene loads after first paint and falls back to a pre-rendered
image when WebGL 2 is unavailable.

Motion has three levels:

- Full motion by default.
- When the system asks for reduced motion, things still move, but slower: fades replace
  flashes, travel and growth, and there is no parallax or momentum.
- The "Pause animation" control in the hero stops everything. The choice is remembered
  in `localStorage`.

## Develop

```sh
npm install
npm run dev       # http://localhost:5173/portfolio/
npm run build     # type-check, then build to dist/
npm run preview   # serve dist/ at http://localhost:4173/portfolio/
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site and
publishes `dist/` to GitHub Pages. The repository's Pages source must be set to
"GitHub Actions".

## Layout

```
index.html                  content and meta tags
src/main.ts                 scroll reveals; starts the hero and figures after first paint
src/motion.ts               reduced-motion and pause state
src/ui.ts                   counters, scroll orbit, spotlight, ambient background, pause control
src/figures/                Figs. 2 to 9 for the project entries
src/styles.css              type, layout and colour tokens
src/hero/constellation.ts   Three.js scene, render loop and interaction
src/hero/orbits.ts          constellation shells and orbit propagation
src/hero/shaders.ts         GLSL for Earth, satellites, ripples and the thrust streak
src/hero/coast-data.ts      Natural Earth coastlines, simplified and packed
src/assets/                 still frame used when WebGL is unavailable
public/                     resumes, favicon and Open Graph image
```

Coastlines are from Natural Earth (public domain). Type is set in Hubot Sans, Public
Sans and Martian Mono from Google Fonts.
