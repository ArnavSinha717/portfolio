// Fig. 3: fields lifted from the contract become a billing schedule.
import type { Motion } from '../motion';
import type { Figure } from './types';
import { attr, easeOut, inr, smooth, span, svg } from './util';

const MONTHLY = [797_500, 837_375, 879_243.75]; // 5% a year
const TOTAL = 30_169_425; // 12 x (sum of the three)
const W = 360;
const BASE = 128;
const TOP = 12;
const SCALE = (BASE - TOP) / MONTHLY[2];
const PERIOD = 11.5;

interface Bar {
  year: number;
  base: SVGRectElement;
  gap: SVGRectElement | null;
}

export function contract(root: HTMLElement): Figure {
  const chart = root.querySelector('.bill__chart') as SVGSVGElement;
  const fields = Array.from(root.querySelectorAll<HTMLElement>('[data-field]'));
  const scan = root.querySelector<HTMLElement>('.doc__scan');
  const years = Array.from(root.querySelectorAll<HTMLElement>('.bill__year'));
  const total = root.querySelector<HTMLElement>('[data-total]');
  const rows = Array.from(root.querySelectorAll<HTMLElement>('.bill__totals > div'));

  const flatY = BASE - MONTHLY[0] * SCALE;
  svg('line', { x1: 0, x2: W, y1: BASE + 0.5, y2: BASE + 0.5, class: 'bill-axis' }, chart);
  const bars: Bar[] = [];
  for (let i = 0; i < 36; i++) {
    const year = Math.floor(i / 12);
    const x = 3 + i * 9.6 + year * 4;
    const base = svg('rect', { x, width: 6.4, y: BASE, height: 0, class: 'bill-bar' }, chart);
    const gap =
      year > 0 ? svg('rect', { x, width: 6.4, y: flatY, height: 0, class: 'bill-bar bill-bar--gap' }, chart) : null;
    bars.push({ year, base, gap });
  }
  const flat = svg('line', { x1: 0, x2: W, y1: flatY, y2: flatY, class: 'bill-flat' }, chart);

  function render(t: number, m: Motion): void {
    const soft = m.reduced;
    const local = t % PERIOD;
    const out = 1 - smooth(span(local, 10.4, 11.3));

    // OCR pass over the page: a moving scan line (full motion only).
    if (scan) {
      scan.style.opacity = soft ? '0' : String(0.7 * out);
      scan.style.transform = `translateY(${((t % 2.8) / 2.8) * 100}%)`;
    }

    // The four facts the LLM extracts, one after another.
    fields.forEach((f, k) => {
      const hit = smooth(span(local, 0.3 + k * 0.42, 0.65 + k * 0.42)) * out;
      const breathe = soft ? 0.85 + 0.15 * Math.sin(t * 1.4 + k) : 1;
      f.style.setProperty('--hit', (hit * breathe).toFixed(3));
    });

    attr(flat, 'opacity', 0.9 * smooth(span(local, 1.6, 2.1)) * out);

    // Bars: month by month in full motion, a year at a time as fades when reduced.
    bars.forEach((bar, i) => {
      const v = MONTHLY[bar.year];
      let grow = 1;
      let alpha = out;
      if (soft) {
        alpha *= smooth(span(local, 2 + bar.year * 0.9, 2.7 + bar.year * 0.9));
      } else {
        const t0 = 2 + i * 0.085;
        grow = easeOut(span(local, t0, t0 + 0.35));
        alpha *= smooth(span(local, t0, t0 + 0.08));
      }
      const h = v * SCALE * grow;
      const flatH = MONTHLY[0] * SCALE;
      const baseH = Math.min(h, flatH);
      attr(bar.base, 'y', BASE - baseH);
      attr(bar.base, 'height', baseH);
      attr(bar.base, 'opacity', alpha);
      if (bar.gap) {
        const gapH = Math.max(h - flatH, 0);
        attr(bar.gap, 'y', flatY - gapH);
        attr(bar.gap, 'height', gapH);
        attr(bar.gap, 'opacity', alpha);
      }
    });

    years.forEach((y, k) => {
      const done = soft ? 2.4 + k * 0.9 : 2 + (k * 12 + 11) * 0.085 + 0.2;
      y.style.opacity = (smooth(span(local, done - 0.3, done + 0.2)) * out).toFixed(3);
    });

    // Totals: the escalated total counts up, then the gap is called out.
    const count = soft ? span(local, 5.2, 5.9) : easeOut(span(local, 5.4, 6.8));
    if (total) total.textContent = `₹${inr(Math.round(TOTAL * count))}`;
    rows.forEach((row, k) => {
      const at = [5.2, 5.6, 6.9][k] ?? 6.9;
      row.style.opacity = (smooth(span(local, at, at + 0.5)) * out).toFixed(3);
    });
  }

  return { render, still: 8.6 };
}
