export const COLOR_PROPERTIES = Object.freeze({ paper: "--paper", ink: "--ink", mutedInk: "--ink-2", subtleInk: "--ink-3", line: "--line", wash: "--wash", stage: "--stage", stageInk: "--stage-ink", accent: "--signal" });
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
export const isHexColor = (value) => typeof value === "string" && /^#(?:[a-f0-9]{3}|[a-f0-9]{6})$/i.test(value);
export function validateTheme(data) {
  const errors = [];
  if (!isObject(data)) return ["theme: light와 dark를 가진 객체여야 합니다."];
  for (const key of Object.keys(data)) if (!["light", "dark"].includes(key)) errors.push(`theme.${key}: light 또는 dark를 사용하세요.`);
  for (const mode of ["light", "dark"]) {
    const colors = data[mode];
    if (!isObject(colors)) { errors.push(`theme.${mode}: 색 토큰 객체가 필요합니다.`); continue; }
    for (const key of Object.keys(colors)) if (!(key in COLOR_PROPERTIES) && key !== "signalPalette") errors.push(`theme.${mode}.${key}: 지원하지 않는 토큰입니다.`);
    for (const key of Object.keys(COLOR_PROPERTIES)) if (!isHexColor(colors[key])) errors.push(`theme.${mode}.${key}: #123456 또는 #abc 형식의 색을 입력하세요.`);
    const count = mode === "light" ? 6 : 4;
    if (!Array.isArray(colors.signalPalette) || colors.signalPalette.length !== count || !colors.signalPalette.every(isHexColor)) errors.push(`theme.${mode}.signalPalette: HEX 색 ${count}개를 입력하세요. 색상 선택은 자유입니다.`);
  }
  return errors;
}
function assertTheme(data) { const errors = validateTheme(data); if (errors.length) throw new Error(errors.join("\n")); }
export function createThemeCss(data) {
  assertTheme(data);
  return ["light", "dark"].map((mode) => `${mode === "light" ? ":root" : ".dark"}{${Object.entries(COLOR_PROPERTIES).map(([key, property]) => `${property}:${data[mode][key]}`).join(";")}}`).join("\n");
}
function glslColor(hex) {
  const raw = hex.slice(1), full = raw.length === 3 ? [...raw].map((c) => c + c).join("") : raw;
  return [0, 2, 4].map((offset) => (parseInt(full.slice(offset, offset + 2), 16) / 255).toFixed(6)).join(", ");
}
export function createSignalPaletteGLSL(data) {
  assertTheme(data);
  return ["dark", "light"].flatMap((mode) => data[mode].signalPalette.map((color, i) => `const vec3 ${mode.toUpperCase()}${i} = vec3(${glslColor(color)});`)).join("\n");
}
