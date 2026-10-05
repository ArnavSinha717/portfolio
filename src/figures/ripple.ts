// Fig. 2: one satellite burns; the uncertainty spreads along the shell.
import type { Motion } from '../motion';
import type { Figure } from './types';
import { attr, easeOut, prng, smooth, span, svg, window01 } from './util';

const CX = 180;
const CY = 86;
const EARTH_R = 38;
const SHELLS = [
  { rx: 128, ry: 44, count: 18, speed: 0.26 },
  { rx: 150, ry: 52, count: 22, speed: 0.26 * (128 / 150) ** 1.5 },
];
const BURN_AT = 1.2; // s into each loop
const SPREAD = 1.15; // rad the ripple reaches along the shell
const RIPPLE_DUR = 1.6;
const HALO_DUR = 2.4;

interface Sat {
  shell: number;
  phase: number;
  dot: SVGCircleElement;
  halo: SVGCircleElement;
}

/** Satellite blue to burn amber. */
function mixColour(k: number): string {
  const c = (a: number, b: number) => Math.round(a + (b - a) * k);
  return `rgb(${c(168, 255)} ${c(199, 179)} ${c(230, 71)})`;
}

const pos = (shell: number, a: number) => ({
  x: CX + SHELLS[shell].rx * Math.cos(a),
  y: CY + SHELLS[shell].ry * Math.sin(a),
});

/** Elliptical arc from angle a0 to a1 (a0 < a1) on a shell. */
function arcPath(shell: number, a0: number, a1: number): string {
  const { rx, ry } = SHELLS[shell];
  const p0 = pos(shell, a0);
  const p1 = pos(shell, a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${p0.x.toFixed(1)} ${p0.y.toFixed(1)}A${rx} ${ry} 0 ${large} 1 ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
}

export function ripple(root: HTMLElement): Figure {
  const el = root.querySelector('svg') as SVGSVGElement;
  const rand = prng(3);

  for (let s = 0; s < SHELLS.length; s++) {
    const { rx, ry } = SHELLS[s];
    svg('ellipse', { cx: CX, cy: CY, rx, ry, class: 'ring-orbit ring-orbit--back' }, el);
  }
  svg('circle', { cx: CX, cy: CY, r: EARTH_R, class: 'ring-earth' }, el);
  for (let s = 0; s < SHELLS.length; s++) {
    svg('path', { d: arcPath(s, 0, Math.PI), class: 'ring-orbit' }, el);
  }

  const arcs = SHELLS.map(() => svg('path', { class: 'ring-ripple', d: '' }, el));
  const streak = svg('line', { class: 'ring-streak', x1: 0, y1: 0, x2: 0, y2: 0 }, el);
  const defs = svg('defs', {}, el);
  const grad = svg('radialGradient', { id: 'ring-glow' }, defs);
  svg('stop', { offset: 0, 'stop-color': '#ffb347', 'stop-opacity': 0.9 }, grad);
  svg('stop', { offset: 1, 'stop-color': '#ffb347', 'stop-opacity': 0 }, grad);
  const glow = svg('circle', { r: 9, cx: 0, cy: 0, fill: 'url(#ring-glow)' }, el);
  const ellipse = svg('ellipse', { class: 'ring-uncertainty', rx: 5, ry: 3.4 }, el);

  const sats: Sat[] = [];
  SHELLS.forEach((shell, s) => {
    for (let i = 0; i < shell.count; i++) {
      const phase = (i / shell.count) * Math.PI * 2 + (rand() - 0.5) * 0.18 + s * 0.11;
      const halo = svg('circle', { class: 'ring-halo', r: 4 }, el);
      const dot = svg('circle', { class: 'ring-sat', r: 2.2 }, el);
      sats.push({ shell: s, phase, dot, halo });
    }
  });

  // The satellite that burns in a given loop: the inner-shell one nearest the
  // lower right of the ring at the moment of the burn.
  function burner(loopStart: number, speed: number): Sat {
    const target = 0.32 * Math.PI;
    let best = sats[0];
    let bestD = Infinity;
    for (const sat of sats) {
      if (sat.shell !== 0) continue;
      const a = sat.phase + SHELLS[0].speed * speed * (loopStart + BURN_AT);
      const d = Math.abs(Math.atan2(Math.sin(a - target), Math.cos(a - target)));
      if (d < bestD) {
        bestD = d;
        best = sat;
      }
    }
    return best;
  }

  function render(t: number, m: Motion): void {
    const soft = m.reduced;
    const speed = soft ? 0.5 : 1;
    const period = soft ? 9 : 7.5;
    const loopStart = Math.floor(t / period) * period;
    const local = t - loopStart;
    const since = local - BURN_AT;
    const b = burner(loopStart, speed);

    // Ripple reach along the shell, in each shell's co-rotating frame.
    const reach = soft
      ? SPREAD
      : SPREAD * easeOut(span(since, 0.2, 0.2 + RIPPLE_DUR));
    const rippleAlpha = soft
      ? 0.55 * window01(since, 0, 3.4, 0.9)
      : 0.6 * smooth(span(since, 0.2, 0.35)) * (1 - span(since, 0.2, 0.2 + RIPPLE_DUR));
    // Where the burn happened, in each shell's co-rotating frame.
    const burnTime = loopStart + BURN_AT;
    const origin = SHELLS.map((sh) => b.phase + (SHELLS[0].speed - sh.speed) * speed * burnTime);

    for (let s = 0; s < SHELLS.length; s++) {
      const centre = origin[s] + SHELLS[s].speed * speed * t;
      if (rippleAlpha > 0.01 && reach > 0.01) {
        attr(arcs[s], 'd', arcPath(s, centre - reach, centre + reach));
        attr(arcs[s], 'opacity', rippleAlpha);
      } else {
        attr(arcs[s], 'opacity', 0);
      }
    }

    for (const sat of sats) {
      const a = sat.phase + SHELLS[sat.shell].speed * speed * t;
      const p = pos(sat.shell, a);
      const back = Math.sin(a) < 0;
      const hidden = back && (p.x - CX) ** 2 + (p.y - CY) ** 2 < EARTH_R ** 2;
      attr(sat.dot, 'cx', p.x);
      attr(sat.dot, 'cy', p.y);
      attr(sat.dot, 'opacity', hidden ? 0 : back ? 0.45 : 1);
      attr(sat.halo, 'cx', p.x);
      attr(sat.halo, 'cy', p.y);

      // Distance from the burn, measured along the shell (co-rotating).
      const o = origin[sat.shell];
      const d = Math.abs(Math.atan2(Math.sin(sat.phase - o), Math.cos(sat.phase - o)));
      let h = 0;
      let r = 4;
      if (sat !== b && d < SPREAD && since > 0) {
        if (soft) {
          h = window01(since, 0.3, 3.6, 0.9);
          r = 4.5;
        } else {
          const hit = 0.2 + RIPPLE_DUR * (1 - Math.cbrt(1 - d / SPREAD));
          const age = since - hit;
          if (age > 0) {
            h = smooth(span(age, 0, 0.2)) * (1 - smooth(span(age, HALO_DUR * 0.5, HALO_DUR)));
            r = 3 + 3 * Math.sqrt(span(age, 0, HALO_DUR));
          }
        }
      }
      attr(sat.halo, 'opacity', hidden ? 0 : h);
      attr(sat.halo, 'r', r);
      if (sat !== b) {
        attr(sat.dot, 'fill', '#a8c7e6');
        attr(sat.dot, 'r', 2.2);
      }
    }

    // The burner: flash and streak (full motion) or a soft amber fade (reduced).
    const a = b.phase + SHELLS[0].speed * speed * t;
    const p = pos(0, a);
    const tx = -SHELLS[0].rx * Math.sin(a);
    const ty = SHELLS[0].ry * Math.cos(a);
    const tl = Math.hypot(tx, ty) || 1;
    const flash = soft ? 0 : smooth(span(since, 0, 0.08)) * (1 - smooth(span(since, 0.15, 0.9)));
    const tint = soft ? window01(since, 0, 4.2, 1) : smooth(span(since, 0, 0.05)) * (1 - smooth(span(since, 3.6, 4.5)));
    attr(glow, 'cx', p.x);
    attr(glow, 'cy', p.y);
    attr(glow, 'opacity', soft ? tint * 0.35 : Math.max(flash, tint * 0.25));
    attr(glow, 'r', soft ? 7 : 6 + 7 * flash);
    attr(b.dot, 'fill', mixColour(tint));
    attr(b.dot, 'r', 2.2 + (soft ? 0.6 * tint : 1.6 * flash + 0.5 * tint));

    attr(streak, 'x1', p.x);
    attr(streak, 'y1', p.y);
    attr(streak, 'x2', p.x - (tx / tl) * 16);
    attr(streak, 'y2', p.y - (ty / tl) * 16);
    attr(streak, 'opacity', flash);

    // Along-track uncertainty grows to 2.2x the usual size.
    const grow = soft ? 1 : easeOut(span(since, 0.35, 1.6));
    const ue = soft ? window01(since, 0.4, 4.4, 1) : smooth(span(since, 0.35, 0.6)) * (1 - smooth(span(since, 4, 5)));
    attr(ellipse, 'rx', 5 + 6 * grow);
    attr(ellipse, 'transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${((Math.atan2(ty, tx) * 180) / Math.PI).toFixed(1)})`);
    attr(ellipse, 'opacity', since > 0 ? ue : 0);
  }

  return { render, still: BURN_AT + 1.6 };
}
