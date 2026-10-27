// The fallback uses the same geometry as the moving specimen, with no option markers.
import fs from "node:fs";
import { draw, shot } from "../public/examples/quantization/scene.js";
const theme = JSON.parse(fs.readFileSync(new URL("../content/theme.json", import.meta.url), "utf8"));
const rgb = hex => { const h = hex.slice(1); const s = h.length === 3 ? [...h].map(x => x + x).join("") : h; return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16) / 255); };
const color = values => `rgb(${values.map(v => Math.round(Math.min(1, Math.max(0, v)) ** (1 / 2.2) * 255)).join(",")})`;
const tilt = shot.tilt, yaw = shot.yaw;
const screen = p => {
  const [x, y, z] = p.map((v, i) => v - shot.target[i]);
  const side = x * Math.cos(yaw) - z * Math.sin(yaw), ahead = x * Math.sin(yaw) + z * Math.cos(yaw);
  return [side, -y * Math.cos(tilt) + ahead * Math.sin(tilt), y * Math.sin(tilt) + ahead * Math.cos(tilt)];
};
const themes = ["dark", "light"].map(mode => {
  const primitives = [], add = (points, make, bias = 0) => {
    const projected = points.map(screen);
    primitives.push({ points: projected, depth: projected.reduce((s, p) => s + p[2], 0) / projected.length + bias, make });
  };
  const line = (a, b, c, alpha) => add([a, b], pts => `<path d="M${pts.map(p => p.slice(0, 2).join(",")).join("L")}" fill="none" stroke="${color(c)}" stroke-opacity="${alpha}" stroke-width=".01"/>`, .003);
  draw(5.6, {
    dark: mode === "dark", ink: rgb(theme[mode].stageInk), ground: rgb(theme[mode].stage),
    line, shine: line,
    dot() {}, lit() {},
    quad: (a, b, c, d, col) => add([a, b, c, d], pts => `<path d="M${pts.map(p => p.slice(0, 2).join(",")).join("L")}Z" fill="${color(col)}"/>`),
  });
  return { mode, primitives };
});
const points = themes[0].primitives.flatMap(p => p.points);
const minX = Math.min(...points.map(p => p[0])) - .18, minY = Math.min(...points.map(p => p[1])) - .18;
const width = Math.max(...points.map(p => p[0])) - minX + .18, height = Math.max(...points.map(p => p[1])) - minY + .18;
const groups = themes.map(({ mode, primitives }) => `<g id="${mode}" class="${mode}">${primitives.sort((a, b) => a.depth - b.depth).map(p => p.make(p.points)).join("")}</g>`).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" role="img" aria-labelledby="title"><title id="title">같은 지형의 계단면과 연속면을 비교하는 설명용 양자화 견본</title><style>.dark{display:none}.dark:target{display:inline}.dark:target~.light{display:none}</style>${groups}</svg>`;
fs.writeFileSync(new URL("../public/examples/quantization/still.svg", import.meta.url), svg);
console.log("양자화 정지 도식 생성 완료 · 동일 장면, 밝음/어두움, 선지 없음");
