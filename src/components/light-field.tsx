"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { signalPaletteGLSL } from "@/lib/theme";

// Additive points, a blurred glow and brightness-based colour on a transparent ground. The caller supplies a scene, without project-specific data or rules.
export type Put = (x: number, y: number, size: number, light: number) => void;
export type Scene = (put: Put, t: number, w: number, h: number, dark: boolean) => void;

const QUAD = `#version 300 es
in vec2 q; out vec2 vUv; void main() { vUv = q * 0.5 + 0.5; gl_Position = vec4(q, 0.0, 1.0); }`;
const POINT_V = `#version 300 es
in vec2 pos; in float size; in float alpha; uniform vec2 view; out float vAlpha;
void main() { vec2 p = pos / view * 2.0 - 1.0; gl_Position = vec4(p.x, -p.y, 0.0, 1.0); gl_PointSize = size; vAlpha = alpha; }`;
const POINT_F = `#version 300 es
precision highp float; in float vAlpha; out vec4 o;
void main() { vec2 d = gl_PointCoord * 2.0 - 1.0; float r2 = dot(d, d); if (r2 > 1.0) discard; float g = exp(-r2 * 3.2) * 0.55 + exp(-r2 * 16.0) * 0.75; o = vec4(vec3(g * vAlpha), 1.0); }`;
const DOWN = `#version 300 es
precision highp float; in vec2 vUv; out vec4 o; uniform sampler2D src; uniform vec2 texel;
void main() { o = 0.25 * (texture(src, vUv + texel * vec2(-1.0, -1.0)) + texture(src, vUv + texel * vec2(1.0, -1.0)) + texture(src, vUv + texel * vec2(-1.0, 1.0)) + texture(src, vUv + texel * vec2(1.0, 1.0))); }`;
const BLUR = `#version 300 es
precision highp float; in vec2 vUv; out vec4 o; uniform sampler2D src; uniform vec2 step;
void main() { vec4 s = texture(src, vUv) * 0.227; s += (texture(src, vUv + step * 1.385) + texture(src, vUv - step * 1.385)) * 0.316; s += (texture(src, vUv + step * 3.231) + texture(src, vUv - step * 3.231)) * 0.070; o = s; }`;
// The user-selected palettes come from content/theme.json. Brightness order and theme-aware compositing stay shared.
const FINAL = `#version 300 es
precision highp float; in vec2 vUv; out vec4 o; uniform sampler2D base, glow; uniform float light, glowK;
${signalPaletteGLSL}
vec3 ramp(float x) { return x < 1.0 ? DARK0 * 0.8 : x < 2.0 ? mix(DARK0, DARK1, x - 1.0) : x < 3.0 ? mix(DARK1, DARK2, x - 2.0) : mix(DARK2, DARK3, x - 3.0); }
vec3 flare(float t) {
  float y = t * 5.0;
  return y < 1.0 ? mix(LIGHT0, LIGHT1, y) : y < 2.0 ? mix(LIGHT1, LIGHT2, y - 1.0) : y < 3.0 ? mix(LIGHT2, LIGHT3, y - 2.0) : y < 4.0 ? mix(LIGHT3, LIGHT4, y - 3.0) : mix(LIGHT4, LIGHT5, y - 4.0);
}
void main() {
  float n = clamp(texture(base, vUv).r + glowK * texture(glow, vUv).r, 0.0, 1.0);
  vec3 c = light > 0.5 ? flare(n) : ramp(n * 4.0);
  float a = light > 0.5 ? smoothstep(0.0, 0.35, n) : smoothstep(0.0, 0.3, n);
  o = vec4(c * a, a);
}`;

type Gl = WebGL2RenderingContext;
function program(gl: Gl, vs: string, fs: string) {
  const make = (type: number, source: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, source); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader"); return s; };
  const p = gl.createProgram()!; gl.attachShader(p, make(gl.VERTEX_SHADER, vs)); gl.attachShader(p, make(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "program");
  return p;
}
function target(gl: Gl, w: number, h: number, float: boolean) {
  const tex = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, float ? gl.RGBA16F : gl.RGBA8, w, h, 0, gl.RGBA, float ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const fb = gl.createFramebuffer()!; gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return { tex, fb, w, h, free: () => { gl.deleteTexture(tex); gl.deleteFramebuffer(fb); } };
}

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

// `still` is the moment shown where motion is reduced. The words over the picture (`children`) are placed by the
// caller in fractions of the box, as the scene places its light; words that move with the light are moved by
// `onFrame`, which is given the same time and size as the scene on every frame.
export function LightField({ scene, label, still = 0, onFrame, children }: { scene: Scene; label: string; still?: number; onFrame?: (t: number, w: number, h: number) => void; children?: ReactNode }) {
  const box = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), live = useRef(scene), frame = useRef(onFrame);
  live.current = scene; frame.current = onFrame;

  useEffect(() => {
    const el = canvas.current!, holder = box.current!;
    const gl = el.getContext("webgl2", { antialias: false, premultipliedAlpha: true, alpha: true });
    if (!gl) { holder.dataset.flat = ""; return; }
    const float = !!gl.getExtension("EXT_color_buffer_float");
    const points = program(gl, POINT_V, POINT_F), down = program(gl, QUAD, DOWN), blur = program(gl, QUAD, BLUR), final = program(gl, QUAD, FINAL);
    const u = (p: WebGLProgram, name: string) => gl.getUniformLocation(p, name);
    const quad = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const quadVao = gl.createVertexArray()!; gl.bindVertexArray(quadVao); gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    for (const p of [down, blur, final]) { const at = gl.getAttribLocation(p, "q"); if (at >= 0) { gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0); } }
    const MAX = 9000, data = new Float32Array(MAX * 4), buffer = gl.createBuffer()!, vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
    for (const [name, size, offset] of [["pos", 2, 0], ["size", 1, 8], ["alpha", 1, 12]] as const) { const at = gl.getAttribLocation(points, name); gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, size, gl.FLOAT, false, 16, offset); }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dark = document.documentElement.classList.contains("dark");
    const theme = new MutationObserver(() => { dark = document.documentElement.classList.contains("dark"); });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    let size = "", W = 0, H = 0, dpr = 1, started = -1, raf = 0;
    let base: ReturnType<typeof target> | null = null, half: ReturnType<typeof target> | null = null, swap: ReturnType<typeof target> | null = null;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!holder.offsetParent) return;
      if (started < 0) started = now;
      const w = holder.clientWidth, h = holder.clientHeight;
      if (!w || !h) return;
      if (`${w}x${h}` !== size) {
        size = `${w}x${h}`; dpr = Math.min(window.devicePixelRatio || 1, 2); W = Math.max(1, Math.round(w * dpr)); H = Math.max(1, Math.round(h * dpr));
        el.width = W; el.height = H; base?.free(); half?.free(); swap?.free();
        base = target(gl, W, H, float); half = target(gl, Math.max(1, W >> 2), Math.max(1, H >> 2), float); swap = target(gl, Math.max(1, W >> 2), Math.max(1, H >> 2), float);
      }
      const scale = dpr * clamp(w / 900, 0.65, 1.15);
      let n = 0;
      const put: Put = (x, y, s, a) => { if (n >= MAX || a <= 0.002) return; data[n * 4] = x * dpr; data[n * 4 + 1] = y * dpr; data[n * 4 + 2] = s * scale; data[n * 4 + 3] = a; n++; };
      live.current(put, reduced ? still : now - started, w, h, dark);
      frame.current?.(reduced ? still : now - started, w, h);

      gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, n * 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, base!.fb); gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(points); gl.uniform2f(u(points, "view"), W, H); gl.drawArrays(gl.POINTS, 0, n);
      gl.disable(gl.BLEND);
      gl.bindVertexArray(quadVao);
      const pass = (prog: WebGLProgram, from: WebGLTexture, to: ReturnType<typeof target>, set: () => void) => { gl.bindFramebuffer(gl.FRAMEBUFFER, to.fb); gl.viewport(0, 0, to.w, to.h); gl.useProgram(prog); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, from); gl.uniform1i(u(prog, "src"), 0); set(); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
      pass(down, base!.tex, half!, () => gl.uniform2f(u(down, "texel"), 1.5 / W, 1.5 / H));
      for (let k = 0; k < 2; k++) {
        pass(blur, half!.tex, swap!, () => gl.uniform2f(u(blur, "step"), (1 + k) / half!.w, 0));
        pass(blur, swap!.tex, half!, () => gl.uniform2f(u(blur, "step"), 0, (1 + k) / half!.h));
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.useProgram(final);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, base!.tex); gl.uniform1i(u(final, "base"), 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, half!.tex); gl.uniform1i(u(final, "glow"), 1);
      gl.uniform1f(u(final, "light"), dark ? 0 : 1); gl.uniform1f(u(final, "glowK"), (dark ? 0.7 : 0.8) * clamp(w / 900, 0.5, 1));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf); theme.disconnect(); base?.free(); half?.free(); swap?.free();
      for (const p of [points, down, blur, final]) gl.deleteProgram(p);
      gl.deleteBuffer(quad); gl.deleteBuffer(buffer); gl.deleteVertexArray(vao); gl.deleteVertexArray(quadVao);
    };
  }, [still]);

  return <div className="lf" ref={box}>
    <canvas ref={canvas} role="img" aria-label={label} />
    <div className="lf-tags">{children}</div>
  </div>;
}
