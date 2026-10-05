// A Starlink-like constellation on circular orbits: two-body motion plus the
// J2 drift of each orbital plane. Scene units are Earth radii; the same
// equations run in the vertex shader, so the CPU copy is only used for the
// handful of satellites that need it (the one firing a burn).

const MU = 398_600.4418; // km^3 / s^2
const R_EARTH = 6_378.137; // km
const J2 = 1.082_63e-3;
const DEG = Math.PI / 180;

/** Simulated seconds per real second. A 550 km orbit takes ~2 minutes. */
export const SIM_SPEED = 45;
/** Earth's sidereal rotation rate, rad per simulated second. */
export const EARTH_RATE = 7.292_115_9e-5;

interface Shell {
  inc: number; // degrees
  alt: number; // km, used for the orbital rates
  radius: number; // scene units; altitudes are exaggerated so shells separate
  planes: number;
  perPlane: number;
  phasing: number; // Walker relative phasing
}

export interface Constellation {
  count: number;
  /** Per satellite: RAAN, inclination, argument of latitude (rad), radius. */
  orbit: Float32Array;
  /** Per satellite: mean motion and RAAN drift (rad per simulated second). */
  motion: Float32Array;
  seed: Float32Array;
}

function shells(lite: boolean): Shell[] {
  const k = lite ? 0.72 : 1;
  const n = (v: number) => Math.max(4, Math.round(v * k));
  return [
    { inc: 53, alt: 550, radius: 1.155, planes: n(54), perPlane: n(18), phasing: 17 },
    { inc: 97.6, alt: 560, radius: 1.17, planes: n(14), perPlane: n(24), phasing: 5 },
    { inc: 70, alt: 570, radius: 1.185, planes: n(26), perPlane: n(18), phasing: 9 },
  ];
}

function rates(altKm: number, incDeg: number): [number, number] {
  const a = R_EARTH + altKm;
  const n = Math.sqrt(MU / (a * a * a));
  const raanDot = -1.5 * n * J2 * (R_EARTH / a) ** 2 * Math.cos(incDeg * DEG);
  return [n, raanDot];
}

/** Small deterministic PRNG so every load (and the static frame) is identical. */
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

export function buildConstellation(lite: boolean): Constellation {
  const rand = prng(1957);
  const orbit: number[] = [];
  const motion: number[] = [];
  const seed: number[] = [];

  const push = (raan: number, inc: number, u: number, r: number, n: number, drift: number) => {
    orbit.push(raan, inc, u, r);
    motion.push(n, drift);
    seed.push(rand());
  };

  for (const sh of shells(lite)) {
    const [n, drift] = rates(sh.alt, sh.inc);
    const inc = sh.inc * DEG;
    const total = sh.planes * sh.perPlane;
    for (let p = 0; p < sh.planes; p++) {
      // Planes are launched at different times, so their spacing is uneven.
      const raan = (2 * Math.PI * p) / sh.planes + (rand() - 0.5) * 2.4 * DEG;
      for (let s = 0; s < sh.perPlane; s++) {
        if (rand() < 0.03) continue; // a few empty slots
        const u =
          (2 * Math.PI * s) / sh.perPlane +
          (2 * Math.PI * sh.phasing * p) / total +
          (rand() - 0.5) * 1.2 * DEG;
        push(raan, inc, u, sh.radius, n, drift);
      }
    }
  }

  // A freshly launched batch still raising its orbit: a short, tight "train".
  const [n, drift] = rates(340, 53);
  const trainRaan = 2.1;
  const trainLen = lite ? 12 : 16;
  for (let i = 0; i < trainLen; i++) {
    push(trainRaan, 53 * DEG, 0.9 + i * 1.4 * DEG, 1.1, n, drift);
  }

  return {
    count: seed.length,
    orbit: new Float32Array(orbit),
    motion: new Float32Array(motion),
    seed: new Float32Array(seed),
  };
}

/**
 * Position (and, optionally, unit velocity) of satellite `i` at simulated time
 * `t`, in the constellation's local frame (y is the polar axis). Mirrors the
 * vertex shader exactly.
 */
export function satState(
  c: Constellation,
  i: number,
  t: number,
  pos: { x: number; y: number; z: number },
  vel?: { x: number; y: number; z: number },
): void {
  const o = i * 4;
  const raan = c.orbit[o] + c.motion[i * 2 + 1] * t;
  const u = c.orbit[o + 2] + c.motion[i * 2] * t;
  const r = c.orbit[o + 3];
  const ci = Math.cos(c.orbit[o + 1]);
  const si = Math.sin(c.orbit[o + 1]);
  const cO = Math.cos(raan);
  const sO = Math.sin(raan);
  const cu = Math.cos(u);
  const su = Math.sin(u);
  pos.x = r * (cO * cu - sO * su * ci);
  pos.y = r * (su * si);
  pos.z = -r * (sO * cu + cO * su * ci);
  if (vel) {
    const vx = -cO * su - sO * cu * ci;
    const vy = cu * si;
    const vz = sO * su - cO * cu * ci;
    const len = Math.hypot(vx, vy, vz) || 1;
    vel.x = vx / len;
    vel.y = vy / len;
    vel.z = vz / len;
  }
}

/** Fold elapsed simulated time into the elements to keep float32 precision. */
export function rebase(c: Constellation, t: number): void {
  const TAU = Math.PI * 2;
  for (let i = 0; i < c.count; i++) {
    c.orbit[i * 4] = (c.orbit[i * 4] + c.motion[i * 2 + 1] * t) % TAU;
    c.orbit[i * 4 + 2] = (c.orbit[i * 4 + 2] + c.motion[i * 2] * t) % TAU;
  }
}
