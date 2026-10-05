import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  ColorManagement,
  DoubleSide,
  Group,
  LineSegments,
  LinearSRGBColorSpace,
  Mesh,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
} from 'three';
import type { Motion } from '../motion';
import { COAST } from './coast-data';
import { EARTH_RATE, SIM_SPEED, buildConstellation, prng, rebase, satState } from './orbits';
import * as glsl from './shaders';

export interface ConstellationOptions {
  hero: HTMLElement;
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  context: WebGL2RenderingContext;
  anchor: HTMLElement;
  motion: Motion;
  onReady: () => void;
  onBurn: () => void;
  onLost: () => void;
}

export interface ConstellationHandle {
  setMotion: (m: Motion) => void;
}

// Colours are authored in sRGB and drawn as-is by the custom shaders.
ColorManagement.enabled = false;

const COLORS = {
  background: 0x05070b,
  satellite: new Color('#a8c7e6'),
  burn: new Color('#ffb347'),
  night: new Color('#05080c'),
  day: new Color('#0a1119'),
  rim: new Color('#284360'),
  grid: new Color('#09121c'),
  coast: new Color('#7f9cbb'),
  glow: new Color('#2b4a6b'),
};

const SPIN = 0.03; // rad/s around the polar axis
const SPIN_GENTLE = 0.015; // reduced motion: slower, and never sped up
const GENTLE_SPEED = 0.4; // reduced motion: satellites drift at 40% speed
const SOFT_RING = 3.4; // s a reduced-motion ripple ring takes to fade in and out
const RIPPLE_SLOTS = 2;

function decodeCoast(): Float32Array {
  const bin = atob(COAST);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const view = new DataView(bytes.buffer);
  const out: number[] = [];
  const r = 1.0015;
  const toXYZ = (lon: number, lat: number): [number, number, number] => {
    const lo = (lon / 10) * (Math.PI / 180);
    const la = (lat / 10) * (Math.PI / 180);
    return [r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo)];
  };
  let o = 0;
  while (o < bytes.length) {
    const n = view.getUint16(o, true);
    let lon = view.getInt16(o + 2, true);
    let lat = view.getInt16(o + 4, true);
    o += 6;
    let prev = toXYZ(lon, lat);
    for (let k = 1; k < n; k++) {
      lon += view.getInt8(o);
      lat += view.getInt8(o + 1);
      o += 2;
      const next = toXYZ(lon, lat);
      out.push(...prev, ...next);
      prev = next;
    }
  }
  return new Float32Array(out);
}

function ringGeometry(segments: number): BufferGeometry {
  const verts = (segments + 1) * 2;
  const phi = new Float32Array(verts);
  const edge = new Float32Array(verts);
  const index: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    phi[i * 2] = a;
    phi[i * 2 + 1] = a;
    edge[i * 2] = -1;
    edge[i * 2 + 1] = 1;
    if (i < segments) {
      const k = i * 2;
      index.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(verts * 3), 3));
  g.setAttribute('aPhi', new BufferAttribute(phi, 1));
  g.setAttribute('aEdge', new BufferAttribute(edge, 1));
  g.setIndex(index);
  return g;
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

export function mountConstellation(opts: ConstellationOptions): ConstellationHandle {
  const { hero, stage, canvas, anchor } = opts;
  let reduced = opts.motion.reduced;
  let paused = opts.motion.paused;

  const renderer = new WebGLRenderer({
    canvas,
    context: opts.context,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = LinearSRGBColorSpace;
  renderer.setClearColor(COLORS.background, 1);

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 50);

  // rig: pointer parallax and drag pitch; tilt: the polar axis leans right
  // and towards the viewer; spin: slow rotation about the polar axis.
  const rig = new Group();
  const tilt = new Group();
  const spin = new Group();
  tilt.rotation.set(0.42, 0, -0.3);
  scene.add(rig);
  rig.add(tilt);
  tilt.add(spin);

  const sunDir = new Vector3(0.5, 0.36, 0.79).normalize();
  const shared = { uSunDir: { value: sunDir } };

  // Earth
  const earthMat = new ShaderMaterial({
    vertexShader: glsl.earthVertex,
    fragmentShader: glsl.earthFragment,
    uniforms: {
      ...shared,
      uNight: { value: COLORS.night },
      uDay: { value: COLORS.day },
      uRim: { value: COLORS.rim },
      uGrid: { value: COLORS.grid },
    },
  });
  const earth = new Mesh(new SphereGeometry(1, 96, 64), earthMat);
  spin.add(earth);

  const coastGeo = new BufferGeometry();
  coastGeo.setAttribute('position', new BufferAttribute(decodeCoast(), 3));
  const coast = new LineSegments(
    coastGeo,
    new ShaderMaterial({
      vertexShader: glsl.coastVertex,
      fragmentShader: glsl.coastFragment,
      uniforms: { ...shared, uColor: { value: COLORS.coast }, uAlpha: { value: 0.32 } },
      transparent: true,
      depthWrite: false,
    }),
  );
  earth.add(coast);

  const glow = new Mesh(
    new SphereGeometry(1.07, 64, 32),
    new ShaderMaterial({
      vertexShader: glsl.glowVertex,
      fragmentShader: glsl.glowFragment,
      uniforms: { ...shared, uColor: { value: COLORS.glow } },
      side: BackSide,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
  tilt.add(glow);

  // Satellites: one Points draw call, positions computed on the GPU.
  const lite = Math.min(window.innerWidth, window.innerHeight) < 600 || window.innerWidth < 720;
  const sats = buildConstellation(lite);
  const satGeo = new BufferGeometry();
  const index = new Float32Array(sats.count);
  for (let i = 0; i < sats.count; i++) index[i] = i;
  const orbitAttr = new BufferAttribute(sats.orbit, 4);
  satGeo.setAttribute('position', new BufferAttribute(new Float32Array(sats.count * 3), 3));
  satGeo.setAttribute('aOrbit', orbitAttr);
  satGeo.setAttribute('aMotion', new BufferAttribute(sats.motion, 2));
  satGeo.setAttribute('aSeed', new BufferAttribute(sats.seed, 1));
  satGeo.setAttribute('aIndex', new BufferAttribute(index, 1));

  const satUniforms = {
    ...shared,
    uTime: { value: 0 },
    uClock: { value: 0 },
    uIntro: { value: 0 },
    uSize: { value: 2 },
    uDepthRef: { value: 6 },
    uDpr: { value: 1 },
    uHaloScale: { value: 1 },
    uSoft: { value: reduced ? 1 : 0 },
    uBurn: { value: new Vector2(-1, -100) },
    uRip0: { value: new Vector4(0, 1, 0, -100) },
    uRip1: { value: new Vector4(0, 1, 0, -100) },
    uColor: { value: COLORS.satellite },
    uBurnColor: { value: COLORS.burn },
  };
  const satPoints = new Points(
    satGeo,
    new ShaderMaterial({
      vertexShader: glsl.satVertex,
      fragmentShader: glsl.satFragment,
      uniforms: satUniforms,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
  satPoints.frustumCulled = false;
  spin.add(satPoints);

  // Ripple rings, drawn on the shell around the burn.
  const ringGeo = ringGeometry(160);
  const rings = Array.from({ length: RIPPLE_SLOTS }, () => {
    const mat = new ShaderMaterial({
      vertexShader: glsl.ringVertex,
      fragmentShader: glsl.ringFragment,
      uniforms: {
        uCenter: { value: new Vector3(0, 1, 0) },
        uRadius: { value: 1.16 },
        uTheta: { value: 0 },
        uWidth: { value: 0.01 },
        uAlpha: { value: 0 },
        uColor: { value: COLORS.burn },
      },
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    });
    const mesh = new Mesh(ringGeo, mat);
    mesh.frustumCulled = false;
    mesh.visible = false;
    spin.add(mesh);
    return { mesh, mat, start: -100 };
  });

  // Thrust plume: a short streak of particles behind the burning satellite.
  const PLUME = 36;
  const plumeGeo = new BufferGeometry();
  const rand = prng(42);
  const k = new Float32Array(PLUME);
  const jit = new Float32Array(PLUME * 2);
  for (let i = 0; i < PLUME; i++) {
    k[i] = i / PLUME;
    jit[i * 2] = rand() * 2 - 1;
    jit[i * 2 + 1] = rand() * 2 - 1;
  }
  plumeGeo.setAttribute('position', new BufferAttribute(new Float32Array(PLUME * 3), 3));
  plumeGeo.setAttribute('aK', new BufferAttribute(k, 1));
  plumeGeo.setAttribute('aJit', new BufferAttribute(jit, 2));
  const plumeUniforms = {
    uPos: { value: new Vector3(0, 1.2, 0) },
    uVel: { value: new Vector3(1, 0, 0) },
    uAge: { value: 100 },
    uSize: { value: 3 },
    uDepthRef: satUniforms.uDepthRef,
    uColor: { value: COLORS.burn },
  };
  const plume = new Points(
    plumeGeo,
    new ShaderMaterial({
      vertexShader: glsl.plumeVertex,
      fragmentShader: glsl.plumeFragment,
      uniforms: plumeUniforms,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
  plume.frustumCulled = false;
  spin.add(plume);

  // ---- state ----------------------------------------------------------------
  let clock = 0; // real seconds while running
  let sim = 2400; // simulated seconds since the elements' epoch
  let earthAngle = 1.3;
  let spinAngle = -0.6;
  let spinVel = reduced ? SPIN_GENTLE : SPIN;
  let pitch = 0;
  let introStart = -1;
  let burnIndex = -1;
  let burnStart = -100;
  let nextBurn = 2.4;
  let ripSlot = 0;
  let dragging = false;
  let dprCap = 2;
  const parallax = { x: 0, y: 0, tx: 0, ty: 0 };
  const burnRand = prng(7);

  const tmpPos = { x: 0, y: 0, z: 0 };
  const tmpVel = { x: 0, y: 0, z: 0 };
  const tmpV = new Vector3();

  function applyTransforms() {
    spin.rotation.y = spinAngle;
    earth.rotation.y = earthAngle;
    rig.rotation.set(pitch + parallax.y * 0.05, parallax.x * 0.08, 0);
    scene.updateMatrixWorld();
  }

  /** Pick a sunlit satellite on the visible face, away from the limb. */
  function pickBurner(random: () => number): number {
    const camDir = camera.position.clone().normalize();
    for (let tries = 0; tries < 60; tries++) {
      const i = Math.floor(random() * sats.count);
      satState(sats, i, sim, tmpPos);
      const w = tmpV.set(tmpPos.x, tmpPos.y, tmpPos.z).applyMatrix4(spin.matrixWorld);
      const r = w.length();
      const facing = w.dot(camDir) / r;
      if (facing < 0.72) continue;
      if (w.dot(sunDir) / r < -0.1) continue;
      return i;
    }
    return -1;
  }

  function fireBurn(i: number) {
    burnIndex = i;
    burnStart = clock;
    satState(sats, i, sim, tmpPos);
    const len = Math.hypot(tmpPos.x, tmpPos.y, tmpPos.z);
    const slot = rings[ripSlot];
    slot.start = clock;
    slot.mat.uniforms.uCenter.value.set(tmpPos.x / len, tmpPos.y / len, tmpPos.z / len);
    slot.mat.uniforms.uRadius.value = len;
    const rip = ripSlot === 0 ? satUniforms.uRip0.value : satUniforms.uRip1.value;
    rip.set(tmpPos.x / len, tmpPos.y / len, tmpPos.z / len, clock);
    ripSlot = (ripSlot + 1) % RIPPLE_SLOTS;
    satUniforms.uBurn.value.set(i, clock);
  }

  function updateEffects() {
    // The thrust streak follows the burning satellite (full motion only).
    const age = clock - burnStart;
    plumeUniforms.uAge.value = reduced ? 100 : age;
    if (!reduced && burnIndex >= 0 && age < 1.8) {
      satState(sats, burnIndex, sim, tmpPos, tmpVel);
      plumeUniforms.uPos.value.set(tmpPos.x, tmpPos.y, tmpPos.z);
      plumeUniforms.uVel.value.set(tmpVel.x, tmpVel.y, tmpVel.z);
    }
    for (const ring of rings) {
      const u = ring.mat.uniforms;
      const since = clock - ring.start - glsl.RIPPLE.delay;
      if (reduced) {
        // The ring fades in and out at its full size instead of travelling.
        const on = since > 0 && since < SOFT_RING;
        ring.mesh.visible = on;
        if (!on) continue;
        u.uTheta.value = glsl.RIPPLE.maxAngle;
        u.uWidth.value = 0.02;
        u.uAlpha.value = 0.3 * smooth(0, 0.8, since) * (1 - smooth(SOFT_RING - 1.3, SOFT_RING, since));
        continue;
      }
      const t = since / glsl.RIPPLE.duration;
      const on = t > 0 && t < 1;
      ring.mesh.visible = on;
      if (!on) continue;
      u.uTheta.value = glsl.RIPPLE.maxAngle * easeOutCubic(t);
      u.uWidth.value = 0.008 + 0.02 * t;
      u.uAlpha.value = 0.55 * (1 - t) ** 1.4 * smooth(0, 0.06, t);
    }
  }

  function syncUniforms() {
    satUniforms.uTime.value = sim;
    satUniforms.uClock.value = clock;
    satUniforms.uIntro.value =
      reduced || introStart < 0 ? 1 : Math.min((clock - introStart) / 2.4, 1);
  }

  function render() {
    applyTransforms();
    updateEffects();
    syncUniforms();
    renderer.render(scene, camera);
  }

  // ---- layout -----------------------------------------------------------------
  function layout() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);

    const s = stage.getBoundingClientRect();
    const a = anchor.getBoundingClientRect();
    const cx = a.left - s.left + a.width / 2;
    const cy = a.top - s.top + a.height / 2;
    const rPx = Math.max(a.width / 2, 40);

    const fov = 30;
    const halfTan = Math.tan((fov * Math.PI) / 360);
    const alpha = Math.atan((rPx / (height / 2)) * halfTan);
    const dist = 1 / Math.sin(alpha);
    camera.fov = fov;
    camera.aspect = width / height;
    camera.near = Math.max(dist - 2, 0.1);
    camera.far = dist + 2;
    camera.position.set(0, 0, dist);
    camera.lookAt(0, 0, 0);
    camera.setViewOffset(width, height, width / 2 - cx, height / 2 - cy, width, height);
    camera.updateProjectionMatrix();

    satUniforms.uDepthRef.value = dist;
    satUniforms.uDpr.value = dpr;
    satUniforms.uSize.value = Math.min(Math.max(rPx / 92, 1.4), 2.6) * dpr;
    satUniforms.uHaloScale.value = Math.min(Math.max(rPx / 250, 0.6), 1.2);
    plumeUniforms.uSize.value = Math.min(Math.max(rPx / 70, 2), 3.6) * dpr;
  }

  // ---- loop ---------------------------------------------------------------------
  let raf = 0;
  let running = false;
  let last = 0;
  let visible = true;
  let slowFrames = 0;
  let frames = 0;
  let ready = false;

  function markReady() {
    if (ready) return;
    ready = true;
    opts.onReady();
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (introStart < 0) introStart = clock;
    const speed = reduced ? GENTLE_SPEED : 1;
    clock += dt;
    sim += dt * SIM_SPEED * speed;
    earthAngle += dt * SIM_SPEED * speed * EARTH_RATE;

    if (!dragging) {
      if (reduced) spinVel = SPIN_GENTLE;
      else spinVel += (SPIN - spinVel) * Math.min(dt * 1.5, 1);
      spinAngle += spinVel * dt;
    }
    parallax.x += (parallax.tx - parallax.x) * Math.min(dt * 2.5, 1);
    parallax.y += (parallax.ty - parallax.y) * Math.min(dt * 2.5, 1);
    pitch *= 1 - Math.min(dt * 0.6, 1);

    if (sim > 40_000) {
      rebase(sats, sim);
      orbitAttr.needsUpdate = true;
      sim = 0;
    }

    if (clock >= nextBurn) {
      const i = pickBurner(burnRand);
      if (i >= 0) {
        fireBurn(i);
        opts.onBurn();
        nextBurn = clock + (reduced ? 5 + burnRand() * 3 : 3.6 + burnRand() * 2.6);
      } else {
        nextBurn = clock + 0.5;
      }
    }

    render();
    markReady();

    // If the device keeps missing frames, drop to a 1x pixel ratio once.
    frames++;
    if (frames > 30) slowFrames = dt > 0.034 ? slowFrames + 1 : Math.max(slowFrames - 1, 0);
    if (slowFrames > 60 && dprCap > 1 && renderer.getPixelRatio() > 1) {
      dprCap = 1;
      layout();
    }
  }

  function start() {
    if (running || paused || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  /** Paused before anything ran: one still frame, mid-burn, so the idea still reads. */
  function renderStill() {
    clock = 30;
    sim = 2400;
    spinAngle = -0.6;
    earthAngle = 1.3;
    parallax.x = parallax.y = parallax.tx = parallax.ty = 0;
    applyTransforms();
    const i = pickBurner(prng(11));
    if (i >= 0) {
      clock = 28.85;
      fireBurn(i);
      clock = 30;
    }
    render();
    markReady();
  }

  // ---- interaction ----------------------------------------------------------------
  let lastX = 0;
  let lastY = 0;
  let lastT = 0;
  const finePointer = window.matchMedia('(pointer: fine)');

  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || reduced || dragging) return;
    const r = hero.getBoundingClientRect();
    parallax.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    parallax.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  hero.addEventListener('pointerleave', () => {
    parallax.tx = 0;
    parallax.ty = 0;
  });

  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch' || e.button !== 0 || !finePointer.matches) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = performance.now();
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('is-dragging');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const dt = Math.max((now - lastT) / 1000, 1 / 240);
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = now;
    spinAngle += dx * 0.006;
    // Reduced motion: the globe follows the pointer but keeps no momentum.
    spinVel = reduced ? SPIN_GENTLE : (dx * 0.006) / dt;
    pitch = Math.min(Math.max(pitch + dy * 0.004, -0.45), 0.45);
    if (!running) render();
  });
  const endDrag = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove('is-dragging');
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    spinVel = reduced ? SPIN_GENTLE : Math.min(Math.max(spinVel, -2), 2);
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  // ---- lifecycle --------------------------------------------------------------------
  const resizeObserver = new ResizeObserver(() => {
    layout();
    if (!running) render();
  });
  resizeObserver.observe(stage);

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) start();
      else stop();
    },
    { threshold: 0 },
  );
  io.observe(stage);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    stop();
    resizeObserver.disconnect();
    io.disconnect();
    opts.onLost();
  });

  layout();
  if (paused) renderStill();
  else start();

  return {
    setMotion(m: Motion) {
      reduced = m.reduced;
      paused = m.paused;
      satUniforms.uSoft.value = reduced ? 1 : 0;
      if (reduced) parallax.tx = parallax.ty = 0;
      if (paused) {
        stop();
        render();
      } else {
        start();
      }
    },
  };
}
