import fs from "node:fs";
import path from "node:path";
import { validatePortfolio } from "./schema.mjs";
const root = path.resolve(import.meta.dirname, "..");
let data;
try { data = JSON.parse(fs.readFileSync(path.join(root, "content/portfolio.json"), "utf8")); }
catch (error) { console.error(`content/portfolio.json을 읽을 수 없습니다. JSON의 쉼표와 따옴표를 확인하세요.\n${error.message}`); process.exit(1); }
const errors = validatePortfolio(data);
if (!errors.length) for (const p of data.projects) if (p.image && !fs.existsSync(path.join(root, "public", p.image))) errors.push(`projects.${p.id}.image: public${p.image} 파일이 없습니다.`);
if (errors.length) { console.error(`콘텐츠를 확인해 주세요:\n${errors.join("\n")}`); process.exit(1); }
console.log(`콘텐츠 확인 완료 · ${data.projects.length}개 프로젝트${data.site.example ? " · 샘플 표시 중" : ""}`);
