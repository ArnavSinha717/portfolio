// Fig. 4: dense retrieval narrows 1,402 chunks to 20, a reranker keeps 5,
// and those ground the answer.
import type { Motion } from '../motion';
import type { Figure } from './types';
import { clamp, easeInOut, easeOut, prng, smooth, span } from './util';

const N = 1402;
const TOP = 20;
const KEEP = 5;
const PERIOD = 10.5;
const COOL = '#a8c7e6';
const INK = '#e9e7e2';
const MUTED = '#8a93a0';
const FONT = '"Martian Mono", ui-monospace, monospace';

interface Pt {
  x: number;
  y: number;
}

interface Layout {
  vertical: boolean;
  cloud: Float32Array;
  col2: Pt[];
  col3: Pt[];
  dot: number;
  labels: { text: string; x: number; y: number; align: CanvasTextAlign }[];
  answer: { x: number; y: number; w: number; lines: number[]; chipY: number };
}

export function rag(root: HTMLElement): Figure {
  const canvas = root.querySelector('canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const rand = prng(11);
  const jx = new Float32Array(N);
  const jy = new Float32Array(N);
  const base = new Float32Array(N);
  const phase = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    jx[i] = rand() - 0.5;
    jy[i] = rand() - 0.5;
    base[i] = 0.32 + rand() * 0.34;
    phase[i] = rand() * Math.PI * 2;
  }

  let w = 0;
  let h = 0;
  let dpr = 1;
  let L: Layout | null = null;

  function resize(): void {
    w = canvas.clientWidth;
    if (!w) return;
    // Narrow screens stack the stages vertically, which needs more height.
    h = w < 520 ? 340 : 220;
    if (canvas.style.height !== `${h}px`) canvas.style.height = `${h}px`;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    L = layout();
  }

  function layout(): Layout {
    const vertical = w < 520;
    const pad = 6;
    const cloud = new Float32Array(N * 2);
    const place = (x0: number, y0: number, x1: number, y1: number) => {
      const cw = x1 - x0;
      const ch = y1 - y0;
      const cols = Math.round(Math.sqrt((N * cw) / ch));
      const rows = Math.ceil(N / cols);
      for (let i = 0; i < N; i++) {
        const c = i % cols;
        const r = Math.floor(i / cols);
        cloud[i * 2] = x0 + ((c + 0.5 + jx[i] * 0.7) / cols) * cw;
        cloud[i * 2 + 1] = y0 + ((r + 0.5 + jy[i] * 0.7) / rows) * ch;
      }
    };
    const col2: Pt[] = [];
    const col3: Pt[] = [];
    if (!vertical) {
      const top = 30;
      place(pad, top, w * 0.4, h - pad);
      for (let k = 0; k < TOP; k++) col2.push({ x: w * 0.5, y: top + 4 + (k * (h - top - 12)) / (TOP - 1) });
      for (let k = 0; k < KEEP; k++) col3.push({ x: w * 0.6, y: top + 18 + (k * (h - top - 44)) / (KEEP - 1) });
      const ax = w * 0.67;
      return {
        vertical,
        cloud,
        col2,
        col3,
        dot: 2,
        labels: [
          { text: '1,402 chunks', x: pad, y: 14, align: 'left' },
          { text: 'top 20', x: w * 0.5, y: 14, align: 'center' },
          { text: 'top 5', x: w * 0.6, y: 14, align: 'center' },
          { text: 'answer', x: ax, y: 14, align: 'left' },
        ],
        answer: { x: ax, y: top + 18, w: w - ax - pad, lines: [1, 0.86, 0.62], chipY: top + 86 },
      };
    }
    place(pad, 30, w - pad, h * 0.42);
    const r2 = h * 0.53;
    const r3 = h * 0.66;
    for (let k = 0; k < TOP; k++) col2.push({ x: pad + 4 + (k * (w - 2 * pad - 8)) / (TOP - 1), y: r2 });
    for (let k = 0; k < KEEP; k++) col3.push({ x: w * 0.2 + (k * w * 0.6) / (KEEP - 1), y: r3 });
    return {
      vertical,
      cloud,
      col2,
      col3,
      dot: 1.8,
      labels: [
        { text: '1,402 chunks', x: pad, y: 14, align: 'left' },
        { text: 'top 20', x: pad, y: r2 - 14, align: 'left' },
        { text: 'top 5, reranked', x: pad, y: r3 - 14, align: 'left' },
        { text: 'answer', x: pad, y: h * 0.75, align: 'left' },
      ],
      answer: { x: pad, y: h * 0.75 + 12, w: w - 2 * pad, lines: [1, 0.84, 0.58], chipY: h * 0.75 + 62 },
    };
  }

  /** Which chunks win in a given loop, and how the reranker reorders them. */
  function pick(loop: number) {
    const r = prng(loop * 7919 + 17);
    const chosen: number[] = [];
    while (chosen.length < TOP) {
      const i = Math.floor(r() * N);
      if (!chosen.includes(i)) chosen.push(i);
    }
    const order = Array.from({ length: TOP }, (_, k) => k);
    for (let k = TOP - 1; k > 0; k--) {
      const j = Math.floor(r() * (k + 1));
      [order[k], order[j]] = [order[j], order[k]];
    }
    // rank[k] = new position of the k-th dense hit after reranking
    const rank = new Array<number>(TOP);
    order.forEach((k, pos) => (rank[k] = pos));
    return { chosen, rank };
  }

  const lerp = (a: Pt, b: Pt, f: number): Pt => ({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
  const rounded = (x: number, y: number, rw: number, rh: number, r: number) => {
    if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, rw, rh, r);
    else ctx.rect(x, y, rw, rh);
  };

  function render(t: number, m: Motion): void {
    if (!L) resize();
    if (!L) return;
    const soft = m.reduced;
    const loop = Math.floor(t / PERIOD);
    const local = t - loop * PERIOD;
    const { chosen, rank } = pick(loop);
    const out = 1 - smooth(span(local, 9, 10.2));

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Labels
    ctx.font = `400 10.5px ${FONT}`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = MUTED;
    for (const lab of L.labels) {
      ctx.textAlign = lab.align;
      ctx.fillText(lab.text, lab.x, lab.y);
    }

    // The cloud of chunks, gently twinkling.
    const chosenSet = new Set(chosen);
    const select = smooth(span(local, 0.8, 1.5)) * out;
    const tw = soft ? 0.6 : 1.4;
    ctx.fillStyle = COOL;
    const s = L.dot;
    for (let i = 0; i < N; i++) {
      if (chosenSet.has(i)) continue;
      const a = base[i] * (0.75 + 0.25 * Math.sin(t * tw + phase[i])) * (1 - 0.35 * select);
      ctx.globalAlpha = a;
      ctx.fillRect(L.cloud[i * 2] - s / 2, L.cloud[i * 2 + 1] - s / 2, s, s);
    }

    // The 20 dense hits: lifted out of the cloud, reranked, and the best 5 kept.
    const reorder = soft ? smooth(span(local, 2.8, 3.6)) : easeInOut(span(local, 2.8, 3.6));
    const keepGo = (r: number) =>
      soft ? smooth(span(local, 3.7, 4.4)) : easeInOut(span(local, 3.6 + r * 0.07, 4.5 + r * 0.07));
    chosen.forEach((idx, k) => {
      const home = { x: L!.cloud[idx * 2], y: L!.cloud[idx * 2 + 1] };
      const slot2 = lerp(L!.col2[k], L!.col2[rank[k]], reorder);
      const r = rank[k];
      const twinkle = base[idx] * (0.75 + 0.25 * Math.sin(t * tw + phase[idx]));
      const lit = twinkle + (1 - twinkle) * select;
      const litColor = select > 0.3 ? INK : COOL;
      const draw = (p: Pt, alpha: number, size: number, color: string) => {
        if (alpha <= 0.01) return;
        ctx.globalAlpha = clamp(alpha);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      };
      const fade15 = r < KEEP ? 1 : 1 - 0.65 * smooth(span(local, 3.7, 4.5));

      if (soft) {
        // Crossfades between stations instead of travel.
        const at2 = smooth(span(local, 1.7, 2.5)) * out;
        const at3 = r < KEEP ? keepGo(r) * out : 0;
        draw(home, lit * (1 - at2) * out + (1 - out) * twinkle, 1.2, litColor);
        draw(slot2, at2 * fade15 * (1 - 0.75 * (r < KEEP ? keepGo(r) : 0)), 2.2, COOL);
        if (r < KEEP) draw(L!.col3[r], at3, 3.2, INK);
        return;
      }
      const go2 = easeInOut(span(local, 1.6 + k * 0.025, 2.6 + k * 0.025));
      let p = lerp(home, slot2, go2);
      let size = 1.2 + 1 * go2;
      let color = go2 > 0.02 ? COOL : litColor;
      if (r < KEEP) {
        const g3 = keepGo(r);
        p = lerp(p, L!.col3[r], g3);
        size += 1.1 * g3;
        if (g3 > 0.5) color = INK;
      }
      draw(p, lit * fade15 * out, size, color);
      // At the end of the loop the chunk fades back into the cloud.
      if (out < 1) draw(home, (1 - out) * twinkle, 1.1, COOL);
    });

    // The answer: lines of text with the sources that support it.
    const A = L.answer;
    ctx.fillStyle = INK;
    A.lines.forEach((frac, k) => {
      const t0 = 4.7 + k * 0.4;
      const g = soft ? smooth(span(local, t0, t0 + 0.5)) : easeOut(span(local, t0, t0 + 0.5));
      const len = A.w * frac * (soft ? 1 : g);
      ctx.globalAlpha = 0.2 * (soft ? g : smooth(span(local, t0, t0 + 0.1))) * out;
      ctx.beginPath();
      rounded(A.x, A.y + k * 13, Math.max(len, 0), 6, 3);
      ctx.fill();
    });

    const chips = ['Source 1', 'Source 3'];
    const sources = [0, 2];
    ctx.font = `400 10px ${FONT}`;
    ctx.textAlign = 'left';
    let cx = A.x;
    chips.forEach((label, k) => {
      const g = smooth(span(local, 5.9 + k * 0.25, 6.4 + k * 0.25)) * out;
      if (g <= 0.01) {
        cx += ctx.measureText(label).width + 26;
        return;
      }
      const tw2 = ctx.measureText(label).width + 14;
      const target = L!.col3[sources[k]];
      ctx.globalAlpha = 0.35 * g;
      ctx.strokeStyle = COOL;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(target.x + 4, target.y);
      ctx.lineTo(cx + tw2 / 2, A.chipY - 9);
      ctx.stroke();
      ctx.globalAlpha = g;
      ctx.beginPath();
      rounded(cx, A.chipY - 9, tw2, 18, 3);
      ctx.stroke();
      ctx.fillStyle = COOL;
      ctx.fillText(label, cx + 7, A.chipY + 0.5);
      cx += tw2 + 12;
    });
    ctx.globalAlpha = 1;
  }

  return { render, resize, still: 7.5 };
}
