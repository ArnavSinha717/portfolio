// One source of truth for how much the page moves.
//   reduced: the visitor asked for less motion. Things still move, but slower,
//            with fades in place of flashes, travel and growth.
//   paused:  the visitor pressed "Pause animation". Nothing moves on its own.

export interface Motion {
  reduced: boolean;
  paused: boolean;
}

type Listener = (m: Motion) => void;

const STORAGE_KEY = 'portfolio:animation';
const query = window.matchMedia('(prefers-reduced-motion: reduce)');
const listeners = new Set<Listener>();

function readPaused(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'paused';
  } catch {
    return false;
  }
}

function writePaused(paused: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, paused ? 'paused' : 'playing');
  } catch {
    // Storage can be unavailable (private mode, blocked cookies); the toggle still works.
  }
}

let state: Motion = { reduced: query.matches, paused: readPaused() };

function apply(): void {
  const root = document.documentElement;
  root.classList.toggle('motion-paused', state.paused);
  root.classList.toggle('motion-reduced', state.reduced);
  for (const fn of listeners) fn(state);
}

query.addEventListener('change', (e) => {
  state = { ...state, reduced: e.matches };
  apply();
});

export const motion = {
  get: (): Motion => state,
  subscribe(fn: Listener): void {
    listeners.add(fn);
  },
  setPaused(paused: boolean): void {
    if (paused === state.paused) return;
    state = { ...state, paused };
    writePaused(paused);
    apply();
  },
};

apply();
