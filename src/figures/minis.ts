// Small figures for the "More projects" entries (Figs. 6 to 9).
import type { Motion } from '../motion';
import type { Figure } from './types';
import { attr, easeOut, smooth, span, svg } from './util';

function frame(root: HTMLElement): SVGSVGElement {
  return svg('svg', { viewBox: '0 0 320 80', 'aria-hidden': 'true', focusable: 'false', class: 'mini-svg' }, root);
}

/** Fig. 6: a job-time forecast with its 90% conformal range; the actual lands inside. */
export function forecast(root: HTMLElement): Figure {
  const el = frame(root);
  const NOW = 168;
  const past = Array.from({ length: 17 }, (_, i) => {
    const x = 10 + i * 9.6;
    return [x, 46 - 8 * Math.sin(i * 0.8) - 5 * Math.sin(i * 0.37 + 1)] as const;
  });
  const fx = (k: number) => NOW + k * 13.5;
  const centre = (k: number) => 44 - k * 1.2;
  const half = (k: number) => 4 + k * 1.5;
  const band: string[] = [];
  for (let k = 0; k <= 10; k++) band.push(`${fx(k)},${centre(k) - half(k)}`);
  for (let k = 10; k >= 0; k--) band.push(`${fx(k)},${centre(k) + half(k)}`);
  const actual = Array.from({ length: 11 }, (_, k) => [fx(k), centre(k) + half(k) * 0.55 * Math.sin(k * 1.3 + 0.4)] as const);
  const toPath = (pts: readonly (readonly [number, number])[]) =>
    pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');

  svg('line', { x1: 8, x2: 312, y1: 72, y2: 72, class: 'mini-axis' }, el);
  svg('line', { x1: NOW, x2: NOW, y1: 10, y2: 72, class: 'mini-now' }, el);
  const label = svg('text', { x: NOW + 4, y: 16, class: 'mini-label' }, el);
  label.textContent = 'now';
  svg('path', { d: toPath(past), class: 'mini-line' }, el);
  const bandEl = svg('polygon', { points: band.join(' '), class: 'mini-band' }, el);
  const clip = svg('clipPath', { id: 'fc-clip' }, el);
  const clipRect = svg('rect', { x: NOW, y: 0, width: 0, height: 80 }, clip);
  bandEl.setAttribute('clip-path', 'url(#fc-clip)');
  svg('path', { d: toPath(actual.map(([x], k) => [x, centre(k)] as const)), class: 'mini-forecast' }, el);
  const act = svg('path', { d: toPath(actual), class: 'mini-actual', pathLength: 1 }, el);
  const [ex, ey] = actual[actual.length - 1];
  const dot = svg('circle', { cx: ex, cy: ey, r: 2.6, class: 'mini-dot' }, el);
  const tag = svg('text', { x: 312, y: 16, class: 'mini-label mini-label--end' }, el);
  tag.textContent = '90% range';

  function render(t: number, m: Motion): void {
    const soft = m.reduced;
    const local = t % 7;
    const out = 1 - smooth(span(local, 6.1, 6.8));
    attr(clipRect, 'width', soft ? 150 : 150 * easeOut(span(local, 0.3, 1.6)));
    attr(bandEl, 'opacity', (soft ? smooth(span(local, 0.3, 1.2)) : 1) * out * (0.8 + 0.2 * Math.sin(t * 1.3)));
    const draw = soft ? 1 : span(local, 1.8, 3.8);
    attr(act, 'stroke-dashoffset', 1 - draw);
    attr(act, 'opacity', (soft ? smooth(span(local, 1.8, 2.6)) : draw > 0 ? 1 : 0) * out);
    const done = smooth(span(local, soft ? 2.6 : 3.8, soft ? 3.3 : 4.1)) * out;
    attr(dot, 'opacity', done);
    attr(tag, 'opacity', done);
  }
  return { render, still: 5 };
}

/** Fig. 7: pose keypoints from the distilled model drive a rep counter. */
export function squat(root: HTMLElement): Figure {
  const el = frame(root);
  svg('line', { x1: 30, x2: 170, y1: 76, y2: 76, class: 'mini-axis' }, el);
  const bones = Array.from({ length: 6 }, () => svg('line', { class: 'mini-bone' }, el));
  const head = svg('circle', { r: 5.5, class: 'mini-head' }, el);
  const joints = Array.from({ length: 6 }, () => svg('circle', { r: 2.2, class: 'mini-joint' }, el));
  const lab = svg('text', { x: 214, y: 30, class: 'mini-label' }, el);
  lab.textContent = 'reps';
  const count = svg('text', { x: 214, y: 62, class: 'mini-count' }, el);

  function render(t: number, m: Motion): void {
    const period = m.reduced ? 3.4 : 2.2;
    const depth = m.reduced ? 0.7 : 1;
    const s = depth * (0.5 - 0.5 * Math.cos((2 * Math.PI * t) / period));
    const rad = Math.PI / 180;
    const a1 = 34 * s * rad;
    const a2 = 88 * s * rad;
    const a3 = (10 + 32 * s) * rad;
    const ankle = { x: 92, y: 74 };
    const knee = { x: ankle.x + 19 * Math.sin(a1), y: ankle.y - 19 * Math.cos(a1) };
    const hip = { x: knee.x - 19 * Math.sin(a2), y: knee.y - 19 * Math.cos(a2) };
    const sh = { x: hip.x + 23 * Math.sin(a3), y: hip.y - 23 * Math.cos(a3) };
    const elbow = { x: sh.x + 12, y: sh.y + 3 + 3 * s };
    const wrist = { x: elbow.x + 12, y: elbow.y };
    const hd = { x: sh.x + 4 * Math.sin(a3) + 1, y: sh.y - 9 };
    const pts = [ankle, knee, hip, sh, elbow, wrist];
    const neck = { x: hd.x, y: hd.y + 5 };
    const segments: [{ x: number; y: number }, { x: number; y: number }][] = [
      [ankle, knee],
      [knee, hip],
      [hip, sh],
      [sh, elbow],
      [elbow, wrist],
      [sh, neck],
    ];
    segments.forEach(([a, b], i) => {
      attr(bones[i], 'x1', a.x);
      attr(bones[i], 'y1', a.y);
      attr(bones[i], 'x2', b.x);
      attr(bones[i], 'y2', b.y);
    });
    attr(head, 'cx', hd.x);
    attr(head, 'cy', hd.y);
    joints.forEach((j, i) => {
      attr(j, 'cx', pts[i].x);
      attr(j, 'cy', pts[i].y);
    });
    const reps = Math.floor(t / period) % 10;
    const text = String(reps);
    if (count.textContent !== text) count.textContent = text;
  }
  return { render, still: 3 * 2.2 + 1.1 };
}

/** Fig. 8: false-positive rate, 22% before and 1.3% after, at ~98% recall. */
export function falsePositives(root: HTMLElement): Figure {
  const el = frame(root);
  const y = (v: number) => 70 - (v / 25) * 56;
  const X0 = 64;
  const X1 = 236;
  svg('line', { x1: X0, x2: X0, y1: 12, y2: 72, class: 'mini-axis' }, el);
  svg('line', { x1: X1, x2: X1, y1: 12, y2: 72, class: 'mini-axis' }, el);
  const title = svg('text', { x: 4, y: 76, class: 'mini-label' }, el);
  title.textContent = 'false positives';
  const line = svg('line', { x1: X0, y1: y(22), x2: X1, y2: y(1.3), class: 'mini-drop', pathLength: 1 }, el);
  const d0 = svg('circle', { cx: X0, cy: y(22), r: 3, class: 'mini-dot mini-dot--warm' }, el);
  const d1 = svg('circle', { cx: X1, cy: y(1.3), r: 3, class: 'mini-dot mini-dot--warm' }, el);
  const l0 = svg('text', { x: X0 - 8, y: y(22) + 4, class: 'mini-label mini-label--end' }, el);
  l0.textContent = '22%';
  const l1 = svg('text', { x: X1 + 8, y: y(1.3) + 4, class: 'mini-label' }, el);
  l1.textContent = '1.3%';
  const cap = svg('text', { x: 316, y: 18, class: 'mini-label mini-label--end' }, el);
  cap.textContent = 'recall ~98%';

  function render(t: number, m: Motion): void {
    const soft = m.reduced;
    const local = t % 7;
    const out = 1 - smooth(span(local, 6.2, 6.8));
    const draw = soft ? 1 : easeOut(span(local, 0.4, 1.6));
    const breathe = soft ? 0.8 + 0.2 * Math.sin(t * 1.6) : 1;
    attr(line, 'stroke-dashoffset', 1 - draw);
    attr(line, 'opacity', (soft ? smooth(span(local, 0.4, 1.3)) : draw > 0 ? 1 : 0) * out * breathe);
    attr(d0, 'opacity', smooth(span(local, 0.1, 0.4)) * out);
    attr(l0, 'opacity', smooth(span(local, 0.1, 0.4)) * out);
    const end = smooth(span(local, soft ? 1.3 : 1.6, soft ? 1.9 : 1.9)) * out;
    attr(d1, 'opacity', end);
    attr(d1, 'r', 3 + 0.8 * Math.sin(t * (soft ? 1.6 : 2.4)));
    attr(l1, 'opacity', end);
    attr(cap, 'opacity', end);
  }
  return { render, still: 3 };
}

/** Fig. 9: a blink switches the world. */
export function blink(root: HTMLElement): Figure {
  const el = frame(root);
  const eye = svg('g', {}, el);
  svg('path', { d: 'M18 40 Q46 18 74 40 Q46 62 18 40 Z', class: 'mini-eye' }, eye);
  const iris = svg('circle', { cx: 46, cy: 40, r: 7, class: 'mini-iris' }, eye);
  const pupil = svg('circle', { cx: 46, cy: 40, r: 2.6, class: 'mini-pupil' }, eye);
  const lid = svg('path', { d: '', class: 'mini-lid' }, el);

  const worldA = svg('g', { class: 'mini-world' }, el);
  const worldB = svg('g', { class: 'mini-world mini-world--b' }, el);
  const tilesA = [
    [110, 58],
    [146, 46],
    [182, 58],
    [226, 40],
    [266, 52],
  ];
  const tilesB = [
    [110, 58],
    [150, 64],
    [194, 50],
    [234, 62],
    [274, 44],
  ];
  for (const [x, yy] of tilesA) svg('rect', { x, y: yy, width: 28, height: 6, rx: 1.5 }, worldA);
  for (const [x, yy] of tilesB) svg('rect', { x, y: yy, width: 28, height: 6, rx: 1.5 }, worldB);
  const hero = svg('rect', { x: 118, y: 46, width: 8, height: 11, rx: 1.5, class: 'mini-hero' }, el);

  function render(t: number, m: Motion): void {
    const soft = m.reduced;
    const period = soft ? 4.2 : 2.8;
    const close = soft ? 0.6 : 0.22;
    const local = t % period;
    const k = Math.floor(t / period);
    // The eyelid closes and reopens at the end of each cycle.
    const phase = span(local, period - close, period);
    const shut = Math.sin(Math.PI * phase);
    attr(lid, 'd', `M18 40 Q46 18 74 40 Q46 ${(18 + 44 * shut).toFixed(1)} 18 40 Z`);
    attr(lid, 'opacity', shut > 0.02 ? 1 : 0);
    const look = Math.sin(t * 0.7) * 3;
    attr(iris, 'cx', 46 + look);
    attr(pupil, 'cx', 46 + look);
    // The world flips while the eye is shut (a crossfade in reduced motion).
    const current = k % 2;
    const toNext = phase > 0.5 ? (soft ? smooth((phase - 0.5) * 2) : 1) : 0;
    const showB = current === 1 ? 1 - toNext : toNext;
    attr(worldA, 'opacity', 1 - showB);
    attr(worldB, 'opacity', showB);
    attr(hero, 'y', 46 + (soft ? 0 : Math.sin(t * 3) * 0.8));
  }
  return { render, still: 1 };
}
