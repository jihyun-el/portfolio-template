// MIT License · Copyright (c) jihyun-el
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { clamp } from "./scene.js";

const DOT_VERTEX = `attribute float size; attribute vec4 tint; attribute float soft; varying vec4 vTint; varying float vSoft;
uniform float unit; uniform float fogNear; uniform float fogFar; uniform float fogAmount;
void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vSoft = soft;
  vTint = vec4(tint.rgb, tint.a * (1.0 - fogAmount * smoothstep(fogNear, fogFar, -mv.z)));
  gl_PointSize = max(1.0, size * unit / -mv.z); gl_Position = projectionMatrix * mv; }`;
const DOT_FRAGMENT = `varying vec4 vTint; varying float vSoft;
void main() { vec2 p = gl_PointCoord * 2.0 - 1.0; float a;
  if (vSoft > 1.5) { vec2 q = abs(p); a = smoothstep(1.0, 0.9, pow(pow(q.x, 6.0) + pow(q.y, 6.0), 1.0 / 6.0)); }
  else { float d = dot(p, p); if (d > 1.0) discard; a = mix(smoothstep(1.0, 0.64, d), pow(1.0 - sqrt(d), 2.0), vSoft); }
  if (a < 0.003) discard;
  gl_FragColor = vec4(vTint.rgb, vTint.a * a); }`;

function dotsOf(max) {
  const geometry = new THREE.BufferGeometry(), pos = new Float32Array(max * 3), tint = new Float32Array(max * 4), size = new Float32Array(max), soft = new Float32Array(max);
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geometry.setAttribute("tint", new THREE.BufferAttribute(tint, 4));
  geometry.setAttribute("size", new THREE.BufferAttribute(size, 1)); geometry.setAttribute("soft", new THREE.BufferAttribute(soft, 1));
  const uniforms = { unit: { value: 1 }, fogNear: { value: 0 }, fogFar: { value: 1 }, fogAmount: { value: 0 } };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: DOT_VERTEX, fragmentShader: DOT_FRAGMENT, transparent: true, depthWrite: false, depthTest: true });
  const object = new THREE.Points(geometry, material); object.frustumCulled = false;
  let n = 0;
  return {
    object, material, uniforms,
    begin() { n = 0; },
    add(x, y, z, s, c, a, sf) {
      if (n >= max || a < 0.004 || s <= 0) return;
      pos[n * 3] = x; pos[n * 3 + 1] = y; pos[n * 3 + 2] = z; size[n] = s; soft[n] = sf;
      tint[n * 4] = c[0]; tint[n * 4 + 1] = c[1]; tint[n * 4 + 2] = c[2]; tint[n * 4 + 3] = Math.min(1, a); n++;
    },
    end() { geometry.setDrawRange(0, n); for (const name of ["position", "tint", "size", "soft"]) geometry.getAttribute(name).needsUpdate = true; },
    dispose() { geometry.dispose(); material.dispose(); },
  };
}
function linesOf(max) {
  const geometry = new THREE.BufferGeometry(), pos = new Float32Array(max * 6), col = new Float32Array(max * 8);
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geometry.setAttribute("color", new THREE.BufferAttribute(col, 4));
  const material = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, depthTest: true });
  const object = new THREE.LineSegments(geometry, material); object.frustumCulled = false; object.renderOrder = -1;
  let n = 0;
  return {
    object, material,
    begin() { n = 0; },
    add(a, b, c, aa, ab) {
      if (n >= max || (aa < 0.004 && ab < 0.004)) return;
      pos.set([a[0], a[1], a[2], b[0], b[1], b[2]], n * 6); col.set([c[0], c[1], c[2], Math.min(1, aa), c[0], c[1], c[2], Math.min(1, ab)], n * 8); n++;
    },
    end() { geometry.setDrawRange(0, n * 2); geometry.getAttribute("position").needsUpdate = true; geometry.getAttribute("color").needsUpdate = true; },
    dispose() { geometry.dispose(); material.dispose(); },
  };
}
function facesOf(max) {
  const geometry = new THREE.BufferGeometry(), pos = new Float32Array(max * 18), col = new Float32Array(max * 24);
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geometry.setAttribute("color", new THREE.BufferAttribute(col, 4));
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: true, depthTest: true, side: THREE.DoubleSide });
  const object = new THREE.Mesh(geometry, material); object.frustumCulled = false; object.renderOrder = -2;
  let n = 0;
  const corner = (k, q, c, a) => { pos.set([q[0], q[1], q[2]], k * 3); col.set([c[0], c[1], c[2], Math.min(1, a)], k * 4); };
  return {
    object, material,
    begin() { n = 0; },
    add(q, c, a) {
      if (n >= max || Math.max(...a) < 0.004) return;
      [0, 1, 2, 0, 2, 3].forEach((v, k) => corner(n * 6 + k, q[v], c, a[v]));
      n++;
    },
    end() { geometry.setDrawRange(0, n * 6); geometry.getAttribute("position").needsUpdate = true; geometry.getAttribute("color").needsUpdate = true; },
    dispose() { geometry.dispose(); material.dispose(); },
  };
}

const INK_SPREAD = {
  uniforms: { tDiffuse: { value: null }, tGlow: { value: null } },
  vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: `uniform sampler2D tDiffuse; uniform sampler2D tGlow; varying vec2 vUv;
void main() { vec4 c = texture2D(tDiffuse, vUv); vec3 g = texture2D(tGlow, vUv).rgb; gl_FragColor = vec4(c.rgb * (1.0 - clamp(g, 0.0, 0.92)), c.a); }`,
};

export function mount(canvas, draw, shot) {
  const holder = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const dpr = Math.min(window.devicePixelRatio || 1, 2), fov = shot.fov ?? 24;
  renderer.setPixelRatio(dpr);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 400);
  const D = dotsOf(3000), L = linesOf(4000), F = facesOf(2000);
  scene.add(F.object, L.object, D.object);
  const composer = new EffectComposer(renderer);
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.4, 0.72);
  composer.setPixelRatio(dpr); composer.addPass(new RenderPass(scene, camera));
  composer.addPass(bloom); composer.addPass(new OutputPass());
  const GL = linesOf(4000), glowScene = new THREE.Scene();
  GL.material.blending = THREE.AdditiveBlending; glowScene.add(GL.object);
  const glowTarget = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const black = new THREE.MeshBasicMaterial({ color: 0, side: THREE.DoubleSide });
  const spread = new UnrealBloomPass(new THREE.Vector2(256, 256), shot.glow ?? 0, 0.08, 0);
  const inkPass = new ShaderPass(INK_SPREAD), inked = new EffectComposer(renderer);
  inkPass.uniforms.tGlow.value = glowTarget.texture;
  inked.setPixelRatio(dpr); inked.addPass(new RenderPass(scene, camera));
  inked.addPass(inkPass); inked.addPass(new OutputPass());
  let dark, ink, ground;
  const stage = new THREE.Color();
  const theme = () => {
    dark = document.documentElement.classList.contains("dark");
    const style = getComputedStyle(holder);
    const rgb = value => { const c = new THREE.Color(value), out = {}; c.getRGB(out, THREE.SRGBColorSpace); return [out.r, out.g, out.b]; };
    ink = rgb(style.getPropertyValue("--stage-ink").trim() || (dark ? "#e7e5eb" : "#232323"));
    ground = rgb(style.getPropertyValue("--stage").trim() || (dark ? "#110f15" : "#fafafa"));
    stage.setRGB(...ground, THREE.LinearSRGBColorSpace);
    renderer.setClearColor(stage, 1);
    D.material.blending = L.material.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    D.material.needsUpdate = L.material.needsUpdate = F.material.needsUpdate = true;
  };
  theme();
  const observer = new MutationObserver(theme);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const target = new THREE.Vector3(...shot.target), p = new THREE.Vector3();
  const look = (yaw, tilt) => new THREE.Vector3(Math.sin(yaw) * Math.cos(tilt), Math.sin(tilt), Math.cos(yaw) * Math.cos(tilt));
  let size = "", distance = 20, fogNear = 0, fogFar = 1;
  const fit = (w, h) => {
    camera.aspect = w / h; camera.clearViewOffset(); camera.updateProjectionMatrix();
    const dir = look(shot.yaw, shot.tilt);
    for (let i = 0; i < 8; i++) {
      camera.position.copy(target).addScaledVector(dir, distance); camera.lookAt(target); camera.updateMatrixWorld();
      let most = 0;
      for (const b of shot.bounds) { p.set(...b).project(camera); most = Math.max(most, Math.abs(p.x) / 0.96, Math.abs(p.y) / 0.94); }
      distance *= most;
    }
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const b of shot.bounds) { p.set(...b).project(camera); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    camera.setViewOffset(w, h, (x0 + x1) / 2 * w / 2, -(y0 + y1) / 2 * h / 2, w, h); camera.updateProjectionMatrix();
  };
  const span = Math.max(...[0, 1, 2].map(k => Math.max(...shot.bounds.map(b => b[k])) - Math.min(...shot.bounds.map(b => b[k]))));
  const fade = (x, y, z) => { const depth = -p.set(x, y, z).applyMatrix4(camera.matrixWorldInverse).z; return 1 - 0.5 * clamp((depth - fogNear) / Math.max(fogFar - fogNear, 1e-3)); };
  const pen = {
    dot: (x, y, z, s, c, a, soft = 0) => D.add(x, y, z, s, c, a, soft),
    lit: (x, y, z, s, c, a) => { D.add(x, y, z, s * (dark ? 3.4 : 2.8), c, a * (dark ? 0.2 : 0.11), 1); D.add(x, y, z, s, c, a, 0); },
    line: (a, b, c, aa, ab = aa) => L.add(a, b, c, aa * fade(...a), ab * fade(...b)),
    shine: (a, b, c, alpha, g = c) => {
      const aa = alpha * fade(...a), ab = alpha * fade(...b);
      L.add(a, b, c, aa, ab);
      if (!dark) GL.add(a, b, g.map((v, k) => Math.max(0, ground[k] - v)), aa, ab);
    },
    quad: (a, b, c, d, col, alphas) => F.add([a, b, c, d], col, [a, b, c, d].map((q, k) => alphas[k] * fade(...q))),
    get ink() { return ink; }, get ground() { return ground; }, get dark() { return dark; },
  };
  let raf, started = -1, shown = -1, last = 0, paused = false, clock = 0, stopped = false, active = true;
  const aim = { x: 0, y: 0 }, lean = { x: 0, y: 0 };
  const pointer = event => {
    if (event.pointerType === "touch") return;
    const b = holder.getBoundingClientRect();
    aim.x = (event.clientX - b.left) / b.width * 2 - 1;
    aim.y = (event.clientY - b.top) / b.height * 2 - 1;
  };
  const leave = () => { aim.x = aim.y = 0; };
  holder.addEventListener("pointermove", pointer, { passive: true });
  holder.addEventListener("pointerleave", leave);
  const frame = now => {
    if (stopped) return;
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
    if (!active || document.hidden || !holder.offsetParent) { shown = -1; return; }
    if (started < 0) started = now;
    if (shown < 0) shown = now;
    const w = holder.clientWidth, h = holder.clientHeight;
    if (!w || !h) return;
    if (`${w}x${h}` !== size) {
      size = `${w}x${h}`; renderer.setSize(w, h, false); composer.setSize(w, h); fit(w, h);
      glowTarget.setSize(w * dpr, h * dpr); spread.setSize(w * dpr, h * dpr); inked.setSize(w, h);
      D.uniforms.unit.value = h * dpr / (2 * Math.tan(fov * Math.PI / 360));
    }
    if (!paused) clock += dt;
    const s = motion.matches ? 5.6 : clock;
    const k = 1 - Math.exp(-dt * 3.2);
    lean.x += (aim.x - lean.x) * k; lean.y += (aim.y - lean.y) * k;
    const settle = motion.matches || paused ? 0 : (1 - clamp((now - shown) / 1100)) ** 3;
    const yaw = shot.yaw + (motion.matches || paused ? 0 : 0.04 * Math.sin(s * 0.21) + 0.1 * lean.x) - 0.5 * settle;
    const tilt = shot.tilt + (motion.matches || paused ? 0 : 0.05 * lean.y) + 0.16 * settle;
    camera.position.copy(target).addScaledVector(look(yaw, tilt), distance * (1 + 0.6 * settle));
    camera.lookAt(target); camera.updateMatrixWorld();
    let near = Infinity, far = -Infinity;
    for (const b of shot.bounds) { const depth = -p.set(...b).applyMatrix4(camera.matrixWorldInverse).z; near = Math.min(near, depth); far = Math.max(far, depth); }
    fogNear = near + 0.25 * (far - near); fogFar = far + 0.3 * span;
    D.uniforms.fogNear.value = fogNear; D.uniforms.fogFar.value = fogFar; D.uniforms.fogAmount.value = 0.5;
    D.begin(); L.begin(); F.begin(); GL.begin(); draw(s, pen); D.end(); L.end(); F.end(); GL.end();
    if (dark) composer.render();
    else {
      renderer.setRenderTarget(glowTarget); renderer.setClearColor(0, 1);
      D.object.visible = L.object.visible = false; F.object.material = black; renderer.render(scene, camera);
      F.object.material = F.material; D.object.visible = L.object.visible = true;
      renderer.autoClear = false; renderer.render(glowScene, camera); renderer.autoClear = true;
      renderer.setRenderTarget(null); renderer.setClearColor(stage, 1);
      spread.render(renderer, glowTarget, glowTarget, 0, false); inked.render();
    }
  };
  raf = requestAnimationFrame(frame);
  return {
    pause(value) { paused = value; },
    setActive(value) { active = value; },
    dispose() {
      stopped = true; cancelAnimationFrame(raf); observer.disconnect();
      holder.removeEventListener("pointermove", pointer); holder.removeEventListener("pointerleave", leave);
      D.dispose(); L.dispose(); F.dispose(); GL.dispose(); bloom.dispose(); composer.dispose();
      glowTarget.dispose(); black.dispose(); spread.dispose(); inkPass.dispose(); inked.dispose(); renderer.dispose();
    },
  };
}
