// MIT License · Copyright (c) jihyun-el
export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const ease = q => q < 0.5 ? 4 * q ** 3 : 1 - (-2 * q + 2) ** 3 / 2;
export const mix = (a, b, t) => a + (b - a) * t;
export const mixV = (a, b, t) => a.map((v, k) => mix(v, b[k], t));
const LOOP = 8.8, TILE = 0.2;
const NF4 = [-1, -0.6962, -0.5251, -0.3949, -0.2844, -0.1848, -0.0911, 0, 0.0796, 0.1609, 0.2461, 0.3379, 0.4407, 0.5626, 0.723, 1];
const nf4 = (v) => NF4.reduce((best, level) => (Math.abs(level - v) < Math.abs(best - v) ? level : best), NF4[0]);

const field = (a, w) => 0.55 * Math.sin(a * 1.9 + 0.4) * Math.cos(w * 1.5 - 0.3) + 0.3 * Math.sin((a + w) * 2.4 + 1.1) + 0.12 * Math.sin(a * 5.1 - w * 3.3);




const PARTNERS = [[1, 0], [0, 2], [2, 1]];
const swapSpan = (t, a, b) => ease(clamp((t - a) / (b - a)));
function swapsAt(s) {
  const t = ((s % LOOP) + LOOP) % LOOP, [p1, p2] = PARTNERS[Math.floor(s / LOOP) % PARTNERS.length], a0 = 3;
  const e1 = t < 8.05 ? swapSpan(t, 4.2, 5.0) : 1 - swapSpan(t, 8.05, 8.55), e2 = t < 7.5 ? swapSpan(t, 5.7, 6.5) : 1 - swapSpan(t, 7.5, 8.0);
  const place = [0, 1, 2, 3], lift = [0, 0, 0, 0];
  place[a0] = e2 > 0 ? mix(p1, p2, e2) : mix(a0, p1, e1); lift[a0] = -0.52 * Math.sin(Math.PI * (e2 > 0 ? e2 : e1));
  place[p1] = mix(p1, a0, e1); lift[p1] = -0.27 * Math.sin(Math.PI * e1);
  place[p2] = mix(p2, p1, e2); lift[p2] = -0.27 * Math.sin(Math.PI * e2);
  return { place, lift };
}
const shuffleAt = (s, m) => swapsAt(s).place[m];
const shuffleLift = (s, m) => swapsAt(s).lift[m];
const P = { N: 12, PITCH: 0.27, Y: 1.6, H: 0.62, BLOCK: 6 }, BASE = -P.H * 1.03;
const ZF = (P.N / 2) * P.PITCH, TOP = P.Y + P.H + 0.18, CY = P.Y + BASE - 0.75, HALF_X = (P.N / 2) * P.PITCH + 0.42;
const cSlot = (cx, m) => cx + (m - 1.5) * 0.82;
const span = (t, a, b) => ease(clamp((t - a) / (b - a)));

const plate = (cx, i, j, h = 0) => [cx + (i - (P.N - 1) / 2) * P.PITCH, P.Y + h, (j - (P.N - 1) / 2) * P.PITCH];
const weight = (i, j) => field((i / (P.N - 1) - 0.5) * 2.6, (j / (P.N - 1) - 0.5) * 2.6);

const held = (i, j) => {
  const b0 = Math.floor(i / P.BLOCK) * P.BLOCK;
  let top = 1e-6;
  for (let k = b0; k < b0 + P.BLOCK; k++) top = Math.max(top, Math.abs(weight(k, j)));
  return top * nf4(weight(i, j) / top);
};

const settled = (s, j) => {
  const t = ((s % LOOP) + LOOP) % LOOP, d = (P.N - 1 - j) * 0.07;
  return span(t, 0.4 + d, 1.3 + d) * (1 - span(t, 7.8 + d * 0.4, 8.5 + d * 0.4));
};



const HUE = { neg: [[0.29, 0.45, 0.69], [0.44, 0.58, 0.84]], pos: [[0.753, 0.267, 0.4], [0.851, 0.267, 0.275]] };
const TINT = 0.6, PALE = 0.45;
const lean = (v) => Math.min(1, Math.abs(v)) ** 0.7;
const hueOf = (pen, v) => HUE[v < 0 ? "neg" : "pos"][pen.dark ? 1 : 0];


const inkOf = (pen, v) => (pen.dark ? mixV(pen.ink, hueOf(pen, v), TINT * lean(v)) : mixV(pen.ink, mixV(hueOf(pen, v), pen.ink, 0.25), lean(v)));


const shadeOf = (pen, k, v = 0) => {
  const deep = inkOf(pen, v);
  if (pen.dark) return mixV(pen.ground, deep, k);
  return mixV(mixV(mixV(pen.ground, pen.ink, 0.06), mixV(pen.ground, hueOf(pen, v), PALE), lean(v)), deep, k);
};

const glowOf = (pen, v) => mixV(pen.ground, hueOf(pen, v), lean(v));

export function draw(s, pen) {
  const dk = pen.dark, solid = [1, 1, 1, 1], yb = P.Y + BASE, e = 0.004;
  const face = (q, k, v = 0) => pen.quad(q[0], q[1], q[2], q[3], shadeOf(pen, k, v), solid);
  
  const topK = (v) => (dk ? 0.38 + 0.5 * (v + 1) / 2 : 0.34 - 0.24 * (v + 1) / 2), frontK = dk ? 0.14 : 0.66, sideK = dk ? 0.24 : 0.5;
  const edge = dk ? 0.9 : 1, faint = dk ? 0.35 : 0.42;
  const [L, R] = [-HALF_X, HALF_X];
  
  for (const cx of [L, R]) {
    const b0 = plate(cx, -1, -0.5), b1 = plate(cx, -1, P.N - 0.5), a0 = plate(cx, -0.5, -1), a1 = plate(cx, P.N - 0.5, -1);
    pen.line([b0[0], TOP, b0[2]], [b1[0], TOP, b1[2]], pen.ink, 0.7); pen.line([a0[0], TOP, a0[2]], [a1[0], TOP, a1[2]], pen.ink, 0.7);
    for (let n = 0; n < 2; n++) {
      const q = ((s * 0.25 + n * 0.5) % 1);
      pen.lit(mix(b0[0], b1[0], q), TOP, mix(b0[2], b1[2], q), 0.06, pen.ink, 0.9); pen.lit(mix(a0[0], a1[0], q), TOP, mix(a0[2], a1[2], q), 0.06, pen.ink, 0.9);
    }
  }
  
  
  const hw = P.PITCH / 2;
  for (let j = 0; j < P.N; j++) for (let i = 0; i < P.N; i++) {
    const v = mix(weight(i, j), held(i, j), settled(s, j)), c = plate(L, i, j, P.H * v), tone = inkOf(pen, v);
    const x0 = c[0] - hw, x1 = c[0] + hw, y = c[1], z0 = c[2] - hw, z1 = c[2] + hw;
    face([[x0, y, z0], [x0, y, z1], [x0, yb, z1], [x0, yb, z0]], sideK, v);
    face([[x1, y, z0], [x1, y, z1], [x1, yb, z1], [x1, yb, z0]], sideK, v);
    face([[x0, y, z1], [x1, y, z1], [x1, yb, z1], [x0, yb, z1]], frontK, v);
    face([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], topK(v), v);
    pen.shine([x0, y + e, z1 + e], [x1, y + e, z1 + e], tone, edge, glowOf(pen, v));
    pen.line([x0 - e, y + e, z0], [x0 - e, y + e, z1], tone, faint); pen.line([x1 + e, y + e, z0], [x1 + e, y + e, z1], tone, faint);
  }
  
  
  const hAt = (i, j) => P.H * weight(i, j), at = (i, j) => plate(R, i, j, hAt(i, j));
  const lit = (i, j) => clamp(0.5 + 1.5 * (hAt(i - 0.25, j) - hAt(i + 0.25, j)) * 2 + 1.5 * (hAt(i, j - 0.25) - hAt(i, j + 0.25)) * 2);
  const sheetK = (i, j) => (dk ? 0.3 + 0.55 * lit(i, j) : 0.42 - 0.34 * lit(i, j));
  const lo = -0.5, hi = P.N - 0.5, st = 0.5;
  const ground = (i, j) => plate(R, i, j, BASE);
  for (let i = lo; i < hi - 1e-6; i += st) {
    face([at(i, hi), at(i + st, hi), ground(i + st, hi), ground(i, hi)], frontK, weight(i + st / 2, hi));
    face([at(i, lo), at(i + st, lo), ground(i + st, lo), ground(i, lo)], frontK, weight(i + st / 2, lo));
  }
  for (let j = lo; j < hi - 1e-6; j += st) {
    face([at(lo, j), at(lo, j + st), ground(lo, j + st), ground(lo, j)], sideK, weight(lo, j + st / 2));
    face([at(hi, j), at(hi, j + st), ground(hi, j + st), ground(hi, j)], sideK, weight(hi, j + st / 2));
  }
  for (let j = lo; j < hi - 1e-6; j += st) for (let i = lo; i < hi - 1e-6; i += st)
    face([at(i, j), at(i + st, j), at(i + st, j + st), at(i, j + st)], sheetK(i + st / 2, j + st / 2), weight(i + st / 2, j + st / 2));
  for (let j = 0; j < P.N; j++) {
    let last = null;
    for (let q = 0; q <= (hi - lo) * 4; q++) { const c = at(lo + q / 4, j); c[1] += e; if (last) pen.line(last, c, inkOf(pen, weight(lo + q / 4, j)), faint); last = c; }
  }
  let last = null;
  for (let q = 0; q <= (hi - lo) * 4; q++) { const c = at(lo + q / 4, hi); c[1] += e; c[2] += e; if (last) pen.shine(last, c, inkOf(pen, weight(lo + q / 4, hi)), edge, glowOf(pen, weight(lo + q / 4, hi))); last = c; }
  
  [L, R].forEach((cx, k) => {
    for (let m = 0; m < 4; m++) pen.dot(cSlot(cx, m), CY, ZF, TILE * 1.6, pen.ink, 0.55, 2);
    const gx = mix(cSlot(cx, 0), cSlot(cx, 3), (k ? shuffleAt(s, 3) : 3) / 3);
    for (let n = 0; n < 44; n++) { const a = n / 44 * Math.PI * 2; pen.lit(gx + 0.34 * Math.cos(a), CY + 0.34 * Math.sin(a), ZF, 0.032, pen.ink, 0.95); }
  });
}

export const shot = {
  target: [0, P.Y - 0.2, 0.3], yaw: -0.03, tilt: 0.42, glow: 1.3,
  bounds: [[-HALF_X * 2 - 0.1, P.Y + BASE, ZF], [HALF_X * 2 + 0.1, P.Y + BASE, ZF], [-HALF_X * 2 - 0.1, TOP + 1.0, -ZF - 0.4], [HALF_X * 2 + 0.1, TOP + 1.0, -ZF - 0.4], [-3.6, CY - 0.95, ZF], [3.6, CY - 0.95, ZF]],
};
