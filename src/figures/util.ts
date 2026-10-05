export const clamp = (v: number, lo = 0, hi = 1): number => Math.min(Math.max(v, lo), hi);

/** 0..1 progress of `t` through the window [a, b]. */
export const span = (t: number, a: number, b: number): number => clamp((t - a) / (b - a));

export const smooth = (x: number): number => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};

export const easeOut = (x: number): number => 1 - (1 - clamp(x)) ** 3;

export const easeInOut = (x: number): number => {
  const t = clamp(x);
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};

/** Fade in over [a, a + d] and out over [b - d, b]. */
export const window01 = (t: number, a: number, b: number, d = 0.4): number =>
  smooth(span(t, a, a + d)) * (1 - smooth(span(t, b - d, b)));

const SVG_NS = 'http://www.w3.org/2000/svg';

export function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
  parent?: Element,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (parent) parent.appendChild(el);
  return el;
}

/** Set attributes only when they change; cheap enough to call every frame. */
export function attr(el: Element, name: string, value: number | string): void {
  const v = typeof value === 'number' ? value.toFixed(2) : value;
  if (el.getAttribute(name) !== v) el.setAttribute(name, v);
}

export function prng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Indian digit grouping, e.g. 30169425 -> "3,01,69,425". */
export const inr = (v: number, decimals = 0): string =>
  v.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
