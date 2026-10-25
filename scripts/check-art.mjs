import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COLOR_PROPERTIES, validateTheme } from "./theme.mjs";

export function findStyleDrift({ css, shader, layout, theme }, contract) {
  const errors = validateTheme(theme);
  for (const property of Object.values(COLOR_PROPERTIES)) {
    if (new RegExp(`${property}\\s*:`).test(css)) errors.push(`${property}: content/theme.json 대신 CSS에 색을 중복 정의했습니다.`);
  }
  if (!layout.includes("themeCss") || !layout.includes('id="portfolio-theme-tokens"')) errors.push("페이지의 색 토큰 연결이 없습니다.");
  if (!shader.includes("${signalPaletteGLSL}")) errors.push("그림의 팔레트 토큰 연결이 없습니다.");
  if (!layout.includes(contract.monoUnicodeRange)) errors.push("Geist Mono의 unicode-range가 바뀌었습니다. 한글·띄어쓰기·가운뎃점은 본문 글꼴에 남겨야 합니다.");
  return errors;
}

export function checkArt(root) {
  const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
  const contract = JSON.parse(read("docs/art/style-contract.json"));
  const errors = findStyleDrift({ css: read(contract.cssFile), shader: read(contract.rampFile), layout: read("src/app/layout.tsx"), theme: JSON.parse(read(contract.themeFile)) }, contract);
  for (const file of [...contract.fontFiles, ...contract.requiredDocuments]) if (!fs.existsSync(path.join(root, file))) errors.push(`필수 파일 누락: ${file}`);
  const docs = [];
  const walk = (dir) => { for (const item of fs.readdirSync(dir, { withFileTypes: true })) { const file = path.join(dir, item.name); if (item.isDirectory()) walk(file); else if (file.endsWith(".md")) docs.push(file); } };
  walk(path.join(root, "docs"));
  docs.push(...["AGENTS.md", "CLAUDE.md", "README.md"].map((f) => path.join(root, f)));
  for (const file of docs) for (const [, href] of fs.readFileSync(file, "utf8").matchAll(/!?\[[^\]]*\]\(([^)\s]+)\)/g)) {
    if (/^[a-z][a-z0-9+.-]*:|^#/i.test(href)) continue;
    const target = path.resolve(path.dirname(file), decodeURIComponent(href.split("#")[0]));
    if (!fs.existsSync(target)) errors.push(`문서 링크 누락: ${path.relative(root, file)} → ${href}`);
  }
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = checkArt(path.resolve(import.meta.dirname, ".."));
  if (errors.length) { console.error(`아트 토큰과 연결을 확인하세요:\n${errors.join("\n")}\n색상은 content/theme.json에서 자유롭게 바꿀 수 있습니다. 값의 형식과 연결을 고치세요.`); process.exitCode = 1; }
  else console.log("아트 기준 확인 완료 · 자유 색 토큰 형식·런타임 연결·폰트·문서 링크 (의미·미감·명암·동작은 별도 화면 검수 필요)");
}
