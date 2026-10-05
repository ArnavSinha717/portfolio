// Runs the project figures: each one animates only while it is on screen,
// the tab is visible and animation is not paused.
import { motion } from '../motion';
import { contract } from './contract';
import { blink, falsePositives, forecast, squat } from './minis';
import { rag } from './rag';
import { ripple } from './ripple';
import type { Figure } from './types';
import { voice } from './voice';

const FIGURES: Record<string, (root: HTMLElement) => Figure> = {
  ripple,
  contract,
  rag,
  voice,
  forecast,
  squat,
  fpr: falsePositives,
  blink,
};

interface Entry {
  root: HTMLElement;
  fig: Figure;
  t: number;
  visible: boolean;
  seen: boolean;
}

export function startFigures(): void {
  let state = motion.get();
  const entries: Entry[] = [];
  for (const root of document.querySelectorAll<HTMLElement>('[data-fig]')) {
    const make = FIGURES[root.dataset.fig ?? ''];
    if (!make) continue;
    try {
      const fig = make(root);
      // Paused visitors see each figure with its whole story on screen.
      const t = state.paused ? fig.still : 0;
      fig.render(t, state);
      root.classList.add('is-ready');
      entries.push({ root, fig, t, visible: false, seen: false });
    } catch (err) {
      console.warn('Figure failed to start', root.dataset.fig, err);
    }
  }
  if (!entries.length) return;

  let raf = 0;
  let last = 0;
  let running = false;

  const frame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    for (const e of entries) {
      if (!e.visible) continue;
      e.t += dt;
      e.fig.render(e.t, state);
    }
    raf = requestAnimationFrame(frame);
  };

  const update = () => {
    const go = !state.paused && !document.hidden && entries.some((e) => e.visible);
    if (go && !running) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (!go && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  };

  const byRoot = new Map(entries.map((e) => [e.root, e]));
  const io = new IntersectionObserver(
    (list) => {
      for (const item of list) {
        const e = byRoot.get(item.target as HTMLElement);
        if (!e) continue;
        e.visible = item.isIntersecting;
        if (e.visible && !e.seen) {
          e.seen = true;
          e.root.classList.add('is-in');
        }
      }
      update();
    },
    { rootMargin: '60px 0px' },
  );
  for (const e of entries) io.observe(e.root);

  const ro = new ResizeObserver((list) => {
    for (const item of list) {
      const e = byRoot.get(item.target as HTMLElement);
      if (!e?.fig.resize) continue;
      e.fig.resize();
      e.fig.render(e.t, state);
    }
  });
  for (const e of entries) if (e.fig.resize) ro.observe(e.root);

  document.addEventListener('visibilitychange', update);
  motion.subscribe((m) => {
    state = m;
    for (const e of entries) e.fig.render(e.t, state);
    update();
  });
}
