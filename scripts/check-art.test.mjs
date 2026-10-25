import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { findStyleDrift } from "./check-art.mjs";
const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const contract = JSON.parse(read("docs/art/style-contract.json"));
const baseline = { css: read(contract.cssFile), shader: read(contract.rampFile), layout: read("src/app/layout.tsx"), theme: JSON.parse(read(contract.themeFile)) };
test("user palettes can change freely without replacing art grammar", () => {
  assert.deepEqual(findStyleDrift(baseline, contract), []);
  const theme = structuredClone(baseline.theme);
  theme.light.accent = "#007a64";
  theme.dark.paper = "#001a20";
  theme.dark.signalPalette = ["#123", "#234567", "#6bcdef", "#cfffff"];
  assert.deepEqual(findStyleDrift({ ...baseline, theme }, contract), []);
});
test("bypassing shared theme tokens is reported before publication", () => {
  const css = `${baseline.css}\n.dark { --paper:#000000; }`;
  assert.ok(findStyleDrift({ ...baseline, css }, contract).some((e) => e.includes("--paper")));
  const shader = baseline.shader.replace("${signalPaletteGLSL}", "");
  assert.ok(findStyleDrift({ ...baseline, shader }, contract).some((e) => e.includes("팔레트 토큰")));
});
test("removing the mono character boundary reports Korean spacing regression", () => {
  const layout = baseline.layout.replace(contract.monoUnicodeRange, "U+0000-FFFF");
  assert.ok(findStyleDrift({ ...baseline, layout }, contract).some((e) => e.includes("unicode-range")));
});
