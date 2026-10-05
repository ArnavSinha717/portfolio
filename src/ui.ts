// Small page-wide touches: counters, the scroll orbit, card spotlight,
// skill chips, the ambient background and the pause control.
import { motion } from './motion';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Key figures count up the first time they come into view. */
export function setupCounters(): void {
  interface Counter {
    vis: HTMLElement;
    text: string;
    prefix: string;
    suffix: string;
    value: number;
    decimals: number;
  }
  const items = new Map<Element, Counter>();
  for (const el of document.querySelectorAll<HTMLElement>('[data-count]')) {
    const text = (el.textContent ?? '').trim();
    const match = /\d[\d,]*(?:\.\d+)?/.exec(text);
    if (!match) continue;
    // Assistive tech always reads the final value; the animated copy is hidden from it.
    const sr = document.createElement('span');
    sr.className = 'visually-hidden';
    sr.textContent = text;
    const vis = document.createElement('span');
    vis.setAttribute('aria-hidden', 'true');
    vis.textContent = text;
    el.replaceChildren(sr, vis);
    const num = match[0].replace(/,/g, '');
    items.set(el, {
      vis,
      text,
      prefix: text.slice(0, match.index),
      suffix: text.slice(match.index + match[0].length),
      value: parseFloat(num),
      decimals: (num.split('.')[1] ?? '').length,
    });
  }

  const format = (c: Counter, v: number) =>
    c.prefix +
    v.toLocaleString('en-IN', { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals }) +
    c.suffix;

  const run = (c: Counter) => {
    const m = motion.get();
    if (m.paused) {
      c.vis.textContent = c.text;
      return;
    }
    const dur = m.reduced ? 700 : 1300;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - (1 - p) ** 3;
      c.vis.textContent = p < 1 ? format(c, c.value * e) : c.text;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const c = items.get(entry.target);
        io.unobserve(entry.target);
        if (c) run(c);
      }
    },
    { threshold: 0.6 },
  );
  const fold = window.innerHeight;
  for (const [el, c] of items) {
    if (el.getBoundingClientRect().top < fold) continue; // already on screen: leave it be
    c.vis.textContent = format(c, 0);
    io.observe(el);
  }
}

/** A thin orbit along the top edge that fills as the page is read. */
export function setupProgress(): void {
  const root = document.querySelector<HTMLElement>('[data-progress]');
  const arc = root?.querySelector<SVGPathElement>('.progress__arc');
  const sat = root?.querySelector<HTMLElement>('.progress__sat');
  if (!root || !arc || !sat) return;
  let queued = false;
  const draw = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
    arc.style.strokeDashoffset = String(1 - p);
    // The arc is the quadratic curve y = 2 + 24 p (1 - p) across the viewport.
    sat.style.transform = `translate(${(p * root.clientWidth).toFixed(1)}px, ${(2 + 24 * p * (1 - p)).toFixed(1)}px)`;
    sat.style.opacity = p > 0.003 ? '1' : '0';
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(draw);
  };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  draw();
}

/** A soft light that follows the pointer across project entries. */
export function setupSpotlight(): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  for (const card of document.querySelectorAll<HTMLElement>('.project, .mini')) {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${(e.clientX - r.left).toFixed(0)}px`);
      card.style.setProperty('--my', `${(e.clientY - r.top).toFixed(0)}px`);
      card.classList.add('is-lit');
    });
    card.addEventListener('pointerleave', () => card.classList.remove('is-lit'));
  }
}

/** Skill chips arrive one after another when the list is revealed. */
export function setupChips(): void {
  document.querySelectorAll<HTMLElement>('.skills .stack li').forEach((li, i) => {
    li.style.setProperty('--i', String(Math.min(i, 40)));
  });
}

/** Slow satellites on faint orbit lines behind the content. */
export function setupAmbient(): void {
  const svgEl = document.querySelector<SVGSVGElement>('.ambient__orbits');
  if (!svgEl) return;
  const durations = [190, 240, 300];
  svgEl.querySelectorAll<SVGPathElement>('path[id]').forEach((path, k) => {
    const g = path.parentNode as SVGGElement;
    for (let j = 0; j < 2; j++) {
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('r', '2.2');
      dot.setAttribute('class', 'ambient__sat');
      const anim = document.createElementNS(SVG_NS, 'animateMotion');
      const dur = durations[k % durations.length];
      anim.setAttribute('dur', `${dur}s`);
      anim.setAttribute('begin', `-${((j * 0.5 + k * 0.17) * dur).toFixed(0)}s`);
      anim.setAttribute('repeatCount', 'indefinite');
      const mpath = document.createElementNS(SVG_NS, 'mpath');
      mpath.setAttribute('href', `#${path.id}`);
      anim.appendChild(mpath);
      dot.appendChild(anim);
      g.appendChild(dot);
    }
  });
  // Already slow enough (minutes per orbit) to stay as they are in reduced motion.
  const sync = () => {
    if (motion.get().paused || document.hidden) svgEl.pauseAnimations();
    else svgEl.unpauseAnimations();
  };
  motion.subscribe(sync);
  document.addEventListener('visibilitychange', sync);
  sync();
}

/** The pause control in the hero. Its label stays the same; aria-pressed carries the state. */
export function setupPauseToggle(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-motion-toggle]');
  if (!button) return;
  const sync = () => button.setAttribute('aria-pressed', String(motion.get().paused));
  button.addEventListener('click', () => motion.setPaused(!motion.get().paused));
  motion.subscribe(sync);
  sync();
  button.hidden = false;
}
