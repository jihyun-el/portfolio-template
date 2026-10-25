import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { normalizeBasePath } from "./paths.mjs";
const root = path.resolve(import.meta.dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "content/portfolio.json"), "utf8"));
const base = normalizeBasePath(process.env.PAGES_BASE_PATH || "");
const routes = ["index.html", "404.html", ...data.projects.map((p) => `projects/${p.id}/index.html`)];
for (const route of routes) {
  const file = path.join(root, "out", route);
  assert.ok(fs.existsSync(file), `내보낸 페이지 누락: ${route}`);
  const html = fs.readFileSync(file, "utf8");
  assert.ok(html.includes('id="main-content"'), `본문 영역 누락: ${route}`);
  for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"\s]*)"/g)) {
    assert.ok(!url.startsWith("//"), `프로토콜 없는 외부 경로: ${url}`);
    if (base) assert.ok(url === base || url.startsWith(`${base}/`), `배포 경로 이탈: ${route} → ${url}`);
  }
}
assert.ok(fs.existsSync(path.join(root, "out/.nojekyll")), ".nojekyll 누락");
console.log(`정적 내보내기 확인 완료 · ${routes.length}개 경로 · basePath=${base || "/"}`);
