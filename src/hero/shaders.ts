// GLSL for the hero. Three.js prepends its own uniforms (matrices, camera)
// and translates attribute/varying/gl_FragColor for WebGL 2.

/** Timing of a burn's ripple; mirrored in constellation.ts. */
export const RIPPLE = {
  delay: 0.25, // s after the flash before the ring leaves the satellite
  duration: 1.5, // s for the ring to reach its full radius
  maxAngle: 0.3, // rad on the shell (~17 degrees)
  halo: 2.4, // s an uncertainty halo lasts once the ring has passed
  softHalo: 3.6, // s a halo lasts in reduced motion, where all neighbours fade in together
};

const rippleDefines = /* glsl */ `
#define RIP_DELAY ${RIPPLE.delay.toFixed(3)}
#define RIP_DUR ${RIPPLE.duration.toFixed(3)}
#define RIP_MAX ${RIPPLE.maxAngle.toFixed(3)}
#define HALO_DUR ${RIPPLE.halo.toFixed(3)}
#define HALO_SOFT ${RIPPLE.softHalo.toFixed(3)}
`;

export const satVertex = /* glsl */ `
${rippleDefines}
uniform float uTime;
uniform float uClock;
uniform float uIntro;
uniform float uSize;
uniform float uDepthRef;
uniform float uDpr;
uniform float uHaloScale;
uniform float uSoft;
uniform vec3 uSunDir;
uniform vec2 uBurn;
uniform vec4 uRip0;
uniform vec4 uRip1;

attribute vec4 aOrbit;
attribute vec2 aMotion;
attribute float aSeed;
attribute float aIndex;

varying float vLight;
varying float vAppear;
varying float vPx;
varying float vCorePx;
varying float vHalo;
varying float vRingPx;
varying float vBurn;

// Progress (0..1) of the uncertainty halo a ripple leaves on this satellite,
// or -1 when the ring has not reached it. In reduced motion (uSoft = 1) every
// neighbour fades in at once instead of waiting for a travelling ring.
float halo(vec4 rip, vec3 dir) {
  float age = uClock - rip.w - RIP_DELAY;
  float dur = mix(HALO_DUR, HALO_SOFT, uSoft);
  if (age <= 0.0 || age > RIP_DUR + dur) return -1.0;
  float ang = acos(clamp(dot(dir, rip.xyz), -1.0, 1.0));
  if (ang > RIP_MAX) return -1.0;
  // The ring follows theta = RIP_MAX * (1 - (1 - t)^3); invert it.
  float hit = (1.0 - uSoft) * RIP_DUR * (1.0 - pow(1.0 - ang / RIP_MAX, 1.0 / 3.0));
  float since = age - hit;
  return since < 0.0 ? -1.0 : since / dur;
}

void main() {
  float raan = aOrbit.x + aMotion.y * uTime;
  float u = aOrbit.z + aMotion.x * uTime;
  float ci = cos(aOrbit.y);
  float si = sin(aOrbit.y);
  float cO = cos(raan);
  float sO = sin(raan);
  float cu = cos(u);
  float su = sin(u);
  vec3 p = aOrbit.w * vec3(cO * cu - sO * su * ci, su * si, -(sO * cu + cO * su * ci));

  vec4 world = modelMatrix * vec4(p, 1.0);
  vec4 mv = viewMatrix * world;
  gl_Position = projectionMatrix * mv;

  // Satellites inside Earth's shadow (a unit cylinder away from the sun) go dim.
  float along = dot(world.xyz, uSunDir);
  float off = length(world.xyz - along * uSunDir);
  float shadow = (1.0 - smoothstep(-0.1, 0.05, along)) * (1.0 - smoothstep(0.95, 1.05, off));

  vAppear = smoothstep(aSeed * 0.8, aSeed * 0.8 + 0.2, uIntro);
  vLight = vAppear * (0.7 + 0.3 * fract(aSeed * 91.7)) * mix(1.0, 0.18, shadow);

  float persp = uDepthRef / max(-mv.z, 0.001);
  float base = uSize * persp * (0.85 + 0.3 * fract(aSeed * 13.1));

  float isBurner = 1.0 - step(0.5, abs(aIndex - uBurn.x));
  float bAge = uClock - uBurn.y;
  // Full motion: a bright flash. Reduced motion: a slow amber fade, no growth.
  float flash = isBurner * smoothstep(0.0, 0.06, bAge) * (1.0 - smoothstep(0.2, 1.9, bAge));
  float tint = isBurner * smoothstep(0.0, 0.9, bAge) * (1.0 - smoothstep(2.4, 3.8, bAge));
  vBurn = mix(flash, tint, uSoft);

  vec3 dir = normalize(p);
  float h = max(halo(uRip0, dir), halo(uRip1, dir));
  float ringPx = 0.0;
  vHalo = -1.0;
  if (h >= 0.0 && h < 1.0) {
    vHalo = h;
    ringPx = mix(mix(2.5, 6.0, sqrt(h)), 4.5, uSoft) * uHaloScale * uDpr * persp;
  }
  // The burner's own catalogue entry is now the least certain of all.
  float hb = isBurner * step(0.35, bAge) * (bAge - 0.35) / 4.2;
  if (isBurner > 0.5 && bAge > 0.35 && hb < 1.0) {
    vHalo = hb;
    ringPx = mix(mix(5.0, 12.0, sqrt(hb)), 9.0, uSoft) * uHaloScale * uDpr * persp;
  }

  float size = base * (1.0 + 7.0 * flash * (1.0 - uSoft));
  size = max(size, (ringPx + 2.0 * uDpr) * 2.0);
  gl_PointSize = size;
  vPx = size * 0.5;
  vCorePx = base * 0.5;
  vRingPx = ringPx;
}
`;

export const satFragment = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uBurnColor;
uniform float uDpr;
uniform float uSoft;

varying float vLight;
varying float vAppear;
varying float vPx;
varying float vCorePx;
varying float vHalo;
varying float vRingPx;
varying float vBurn;

void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float r = length(c);
  if (r > 1.0) discard;
  float rp = r * vPx;

  float core = 1.0 - smoothstep(vCorePx * 0.4, vCorePx + 0.6, rp);
  vec3 col = uColor * core * vLight;

  if (vBurn > 0.0) {
    float glow = exp(-pow(rp / (vCorePx * 3.2 + 1.5), 2.0));
    vec3 hot = mix(vec3(1.0, 0.93, 0.8) * 1.6, uBurnColor * 1.2, uSoft);
    col = mix(col, hot * core, vBurn);
    col += uBurnColor * glow * vBurn * 1.1 * (1.0 - uSoft);
  }

  if (vHalo >= 0.0) {
    float fade = smoothstep(0.0, mix(0.08, 0.25, uSoft), vHalo) * (1.0 - smoothstep(0.4, 1.0, vHalo));
    float ring = 1.0 - smoothstep(0.3 * uDpr, 1.0 * uDpr, abs(rp - vRingPx));
    col += uBurnColor * (ring * 0.5 + core * 0.55) * fade * vAppear;
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

export const earthVertex = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vLocal;
varying vec3 vView;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vLocal = position;
  vView = cameraPosition - world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const earthFragment = /* glsl */ `
uniform vec3 uSunDir;
uniform vec3 uNight;
uniform vec3 uDay;
uniform vec3 uRim;
uniform vec3 uGrid;

varying vec3 vNormalW;
varying vec3 vLocal;
varying vec3 vView;

void main() {
  vec3 n = normalize(vNormalW);
  float day = smoothstep(-0.3, 0.6, dot(n, uSunDir));
  vec3 col = mix(uNight, uDay, day);

  // A graticule every 30 degrees, fixed to the ground.
  vec3 l = normalize(vLocal);
  float lat = asin(clamp(l.y, -1.0, 1.0));
  float lon = atan(-l.z, l.x);
  vec2 g = vec2(lon, lat) / radians(30.0);
  float lonAlt = fract(g.x / 12.0 + 0.5) * 12.0;
  vec2 fw = vec2(min(fwidth(g.x), fwidth(lonAlt)), fwidth(g.y));
  vec2 d = abs(fract(g - 0.5) - 0.5) / max(fw, vec2(1e-4));
  float line = 1.0 - min(min(d.x, d.y), 1.0);
  line *= 1.0 - smoothstep(0.8, 0.98, abs(l.y));
  col += uGrid * line * (0.4 + 0.6 * day);

  float facing = clamp(dot(n, normalize(vView)), 0.0, 1.0);
  col += uRim * pow(1.0 - facing, 3.0) * (0.25 + 0.75 * day);

  gl_FragColor = vec4(col, 1.0);
}
`;

export const coastVertex = /* glsl */ `
uniform vec3 uSunDir;
varying float vDay;
varying float vFacing;

void main() {
  vec3 nW = normalize(mat3(modelMatrix) * position);
  vDay = smoothstep(-0.25, 0.55, dot(nW, uSunDir));
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 nV = normalize(normalMatrix * position);
  vFacing = smoothstep(0.02, 0.4, dot(nV, normalize(-mv.xyz)));
  gl_Position = projectionMatrix * mv;
}
`;

export const coastFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
varying float vDay;
varying float vFacing;

void main() {
  gl_FragColor = vec4(uColor, uAlpha * (0.3 + 0.7 * vDay) * vFacing);
}
`;

export const glowVertex = /* glsl */ `
varying vec3 vNormalV;
varying vec3 vNormalW;

void main() {
  vNormalV = normalize(normalMatrix * normal);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const glowFragment = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uSunDir;
varying vec3 vNormalV;
varying vec3 vNormalW;

void main() {
  // Back faces of a slightly larger sphere: brightest just outside the limb
  // (where -normal.z reaches ~0.36 for a 1.07 shell), fading outwards.
  float k = clamp(-vNormalV.z / 0.36, 0.0, 1.0);
  float lit = 0.3 + 0.7 * smoothstep(-0.5, 0.5, dot(vNormalW, uSunDir));
  gl_FragColor = vec4(uColor * pow(k, 2.2) * lit, 1.0);
}
`;

export const ringVertex = /* glsl */ `
uniform vec3 uCenter;
uniform float uRadius;
uniform float uTheta;
uniform float uWidth;

attribute float aPhi;
attribute float aEdge;
varying float vEdge;

void main() {
  vec3 c = normalize(uCenter);
  vec3 helper = abs(c.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 e1 = normalize(cross(c, helper));
  vec3 e2 = cross(c, e1);
  float th = max(uTheta + aEdge * uWidth, 0.0);
  vec3 dir = cos(th) * c + sin(th) * (cos(aPhi) * e1 + sin(aPhi) * e2);
  vEdge = aEdge;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(dir * uRadius, 1.0);
}
`;

export const ringFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
varying float vEdge;

void main() {
  float a = 1.0 - abs(vEdge);
  gl_FragColor = vec4(uColor * a * a * uAlpha, 1.0);
}
`;

export const plumeVertex = /* glsl */ `
uniform vec3 uPos;
uniform vec3 uVel;
uniform float uAge;
uniform float uSize;
uniform float uDepthRef;

attribute float aK;
attribute vec2 aJit;
varying float vA;

void main() {
  float a = uAge - aK * 0.85;
  float life = 0.7;
  float alive = step(0.0, a) * step(a, life);
  float t = clamp(a / life, 0.0, 1.0);
  vec3 up = normalize(uPos);
  vec3 side = normalize(cross(uVel, up));
  vec3 pos = uPos - uVel * (0.008 + t * 0.07) + (side * aJit.x + up * aJit.y) * t * 0.012;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = alive * uSize * (1.0 - 0.55 * t) * (uDepthRef / max(-mv.z, 0.001));
  vA = alive * (1.0 - t) * (1.0 - t);
}
`;

export const plumeFragment = /* glsl */ `
uniform vec3 uColor;
varying float vA;

void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float r = dot(c, c);
  if (r > 1.0) discard;
  gl_FragColor = vec4(uColor * (1.0 - r) * vA, 1.0);
}
`;
