// Fig. 5: call audio becomes a transcript; the Aadhaar number is masked and
// the compliance checks light up. The number in the markup is made up.
import type { Motion } from '../motion';
import type { Figure } from './types';
import { attr, smooth, span, svg } from './util';

const BARS = 72;
const PERIOD = 11;

/** A speech-like envelope: syllables inside words, with pauses between. */
function speech(x: number): number {
  const words = Math.max(Math.sin(x * 0.11) + 0.35 * Math.sin(x * 0.037 + 1.1), 0);
  const syllables = Math.abs(Math.sin(x * 0.9) * Math.sin(x * 0.31 + 1.3));
  return Math.min(words, 1) * (0.25 + 0.75 * syllables);
}

/**
 * Split a line's spoken text into typed and not-yet-typed halves. The untyped
 * half stays in place (transparent), so wrapping and layout never shift.
 */
function typewriter(line: HTMLElement): (fraction: number) => void {
  const parts: { on: HTMLElement; off: HTMLElement; text: string }[] = [];
  const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      n.parentElement?.closest('.voice__who, .pii__mask') || !n.nodeValue?.trim()
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    const text = node.nodeValue ?? '';
    const on = document.createElement('span');
    const off = document.createElement('span');
    off.className = 'voice__untyped';
    off.textContent = text;
    node.replaceWith(on, off);
    parts.push({ on, off, text });
  }
  const total = parts.reduce((n, p) => n + p.text.length, 0);
  let last = -1;
  return (fraction: number) => {
    const shown = Math.round(total * Math.min(Math.max(fraction, 0), 1));
    if (shown === last) return;
    last = shown;
    let left = shown;
    for (const p of parts) {
      const k = Math.min(Math.max(left, 0), p.text.length);
      p.on.textContent = p.text.slice(0, k);
      p.off.textContent = p.text.slice(k);
      left -= p.text.length;
    }
  };
}

export function voice(root: HTMLElement): Figure {
  const wave = root.querySelector('.voice__wave') as SVGSVGElement;
  const lines = Array.from(root.querySelectorAll<HTMLElement>('.voice__line'));
  const typers = lines.map(typewriter);
  const raw = root.querySelector<HTMLElement>('.pii__raw');
  const mask = root.querySelector<HTMLElement>('.pii__mask');
  const checks = Array.from(root.querySelectorAll<HTMLElement>('.voice__checks li'));

  const bars = Array.from({ length: BARS }, (_, i) =>
    svg('rect', { x: i * 5 + 1, width: 3, rx: 1.5, y: 22, height: 4, class: 'voice-bar' }, wave),
  );

  function render(t: number, m: Motion): void {
    const soft = m.reduced;
    const local = t % PERIOD;
    const out = 1 - smooth(span(local, 10.2, 10.9));

    // Waveform: scrolls like live audio, or holds still and shimmers when reduced.
    bars.forEach((bar, i) => {
      const x = soft ? i * 1.6 : i * 1.6 + t * 18;
      const amp = speech(x);
      const hgt = 3 + amp * 40;
      attr(bar, 'y', 24 - hgt / 2);
      attr(bar, 'height', hgt);
      const shimmer = soft ? 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(i * 0.22 - t * 1.1)) : 1;
      attr(bar, 'opacity', (0.35 + 0.65 * amp) * shimmer);
    });

    // Transcript lines: typed out, or faded in when reduced.
    const spans: [number, number][] = [
      [0.4, 3.0],
      [3.4, 5.3],
    ];
    lines.forEach((line, k) => {
      const [a, b] = spans[k] ?? [0, 0];
      if (soft) {
        typers[k](1);
        line.style.opacity = (smooth(span(local, a, a + 0.8)) * out).toFixed(3);
      } else {
        const p = span(local, a, b);
        typers[k](p);
        line.style.opacity = (p > 0 ? out : 0).toFixed(3);
      }
    });

    // Mask the first eight digits: a redaction wipe, or a crossfade when reduced.
    const mk = soft ? smooth(span(local, 6, 6.9)) : span(local, 5.9, 6.8);
    if (raw && mask) {
      if (soft) {
        raw.style.opacity = (1 - mk).toFixed(3);
        mask.style.opacity = mk.toFixed(3);
        mask.style.clipPath = 'none';
      } else {
        raw.style.opacity = (1 - smooth(span(local, 6.6, 6.9))).toFixed(3);
        mask.style.opacity = mk > 0 ? '1' : '0';
        mask.style.clipPath = `inset(0 ${((1 - mk) * 100).toFixed(1)}% 0 0)`;
      }
    }

    checks.forEach((c, k) => {
      const on = smooth(span(local, 7.2 + k * 0.45, 7.6 + k * 0.45)) * out;
      c.style.setProperty('--on', on.toFixed(3));
    });
  }

  return { render, still: 9 };
}
