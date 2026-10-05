import type { Motion } from '../motion';

export interface Figure {
  /** Draw the figure at local time `t` (seconds since it first came into view). */
  render(t: number, m: Motion): void;
  /** Recompute pixel sizes (canvas figures). */
  resize?(): void;
  /** A time at which the whole story is on screen; shown when animation is paused. */
  still: number;
}
