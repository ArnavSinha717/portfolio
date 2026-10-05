import './styles.css';
import { motion } from './motion';
import {
  setupAmbient,
  setupChips,
  setupCounters,
  setupPauseToggle,
  setupProgress,
  setupSpotlight,
} from './ui';

/**
 * Fade sections in as they arrive (opacity only when reduced motion is on).
 * Only elements that start below the fold are hidden, so nothing flashes on
 * load and everything stays visible without JS.
 */
function setupReveal(): void {
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  const fold = window.innerHeight;
  for (const el of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
    if (el.getBoundingClientRect().top < fold) continue;
    el.classList.add('reveal');
    io.observe(el);
  }
}

/** The telemetry lamp blinks whenever a satellite in Fig. 1 fires a burn. */
function pulseLamp(): void {
  const lamp = document.querySelector<HTMLElement>('[data-burn-lamp]');
  if (!lamp) return;
  lamp.classList.remove('is-firing');
  void lamp.offsetWidth;
  lamp.classList.add('is-firing');
}

function startHero(): void {
  const hero = document.querySelector<HTMLElement>('.hero');
  const stage = hero?.querySelector<HTMLElement>('[data-hero-stage]');
  const canvas = stage?.querySelector('canvas');
  const anchor = stage?.querySelector<HTMLElement>('[data-globe-anchor]');
  if (!hero || !stage || !canvas || !anchor) return;

  const fallback = () => hero.classList.add('is-fallback');
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return fallback();

  let context: WebGL2RenderingContext | null = null;
  try {
    context = canvas.getContext('webgl2', {
      alpha: false,
      antialias: window.devicePixelRatio < 1.5,
      depth: true,
      stencil: false,
      powerPreference: 'high-performance',
    });
  } catch {
    context = null;
  }
  if (!context) return fallback();
  const gl = context;

  import('./hero/constellation')
    .then(({ mountConstellation }) => {
      const handle = mountConstellation({
        hero,
        stage,
        canvas,
        context: gl,
        anchor,
        motion: motion.get(),
        onReady: () => hero.classList.add('is-live'),
        onBurn: pulseLamp,
        onLost: () => {
          hero.classList.remove('is-live');
          fallback();
        },
      });
      motion.subscribe((m) => handle.setMotion(m));
    })
    .catch(fallback);
}

/** Project figures load once the work section is close, or when the browser is idle. */
function startFigures(): void {
  const work = document.getElementById('work');
  let started = false;
  const go = () => {
    if (started) return;
    started = true;
    import('./figures')
      .then(({ startFigures: run }) => run())
      .catch((err) => console.warn('Figures failed to load', err));
  };
  if (work && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        go();
      },
      { rootMargin: '900px 0px' },
    );
    io.observe(work);
  }
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
    .requestIdleCallback;
  if (idle) idle(go, { timeout: 2500 });
  else setTimeout(go, 1500);
}

setupReveal();
setupCounters();
setupChips();
setupProgress();
setupSpotlight();
setupPauseToggle();

// Everything that draws continuously starts after the first paint.
requestAnimationFrame(() =>
  setTimeout(() => {
    startHero();
    startFigures();
    setupAmbient();
  }, 0),
);
