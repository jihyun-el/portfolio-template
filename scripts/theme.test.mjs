import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateTheme, createThemeCss, createSignalPaletteGLSL } from "./theme.mjs";
const baseline = JSON.parse(fs.readFileSync(new URL("../content/theme.json", import.meta.url), "utf8"));
test("theme accepts a different color family in both page tokens and signal palettes", () => {
  const custom = structuredClone(baseline);
  custom.light.accent = "#007a64";
  custom.dark.paper = "#001a20";
  custom.dark.signalPalette = ["#012", "#135", "#39b", "#bff"];
  assert.deepEqual(validateTheme(custom), []);
  assert.ok(createThemeCss(custom).includes("--signal:#007a64"));
  assert.ok(createThemeCss(custom).includes("--paper:#001a20"));
  assert.ok(createSignalPaletteGLSL(custom).includes("DARK0 = vec3(0.000000, 0.066667, 0.133333)"));
});
test("theme reports missing roles and an incomplete palette without prescribing colors", () => {
  const broken = structuredClone(baseline);
  delete broken.light.ink;
  broken.dark.signalPalette = ["#123456"];
  assert.equal(validateTheme(broken).length, 2);
});
test("invalid CSS or shader input is rejected before interpolation", () => {
  const broken = structuredClone(baseline);
  broken.light.paper = "#fff;}body{display:none}";
  broken.dark.signalPalette[0] = "url(https://example.com/x)";
  assert.ok(validateTheme(broken).length >= 2);
  assert.throws(() => createThemeCss(broken));
  assert.throws(() => createSignalPaletteGLSL(broken));
});
test("generated colors preserve theme roles and all shader stops", () => {
  const shader = createSignalPaletteGLSL(baseline);
  assert.equal([...shader.matchAll(/const vec3 (?:DARK|LIGHT)\d/g)].length, 10);
  assert.ok(createThemeCss(baseline).startsWith(":root{"));
  assert.ok(createThemeCss(baseline).includes(".dark{"));
});
