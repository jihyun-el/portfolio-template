import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { normalizeBasePath } from "./paths.mjs";

const root = path.resolve(import.meta.dirname, "../out");
const basePath = normalizeBasePath(process.env.PAGES_BASE_PATH || "");
const port = Number(process.env.PORT || 4173);
const types = { ".html":"text/html; charset=utf-8", ".css":"text/css", ".js":"text/javascript", ".svg":"image/svg+xml", ".json":"application/json", ".txt":"text/plain", ".ttf":"font/ttf", ".woff2":"font/woff2", ".png":"image/png", ".jpg":"image/jpeg" };
http.createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (basePath && pathname !== basePath && !pathname.startsWith(`${basePath}/`)) { res.writeHead(404).end(); return; }
    pathname = pathname.slice(basePath.length) || "/";
    const candidate = path.resolve(root, `.${pathname}`);
    if (candidate !== root && !candidate.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    let file = candidate;
    if ((await fs.stat(file)).isDirectory()) file = path.join(file, "index.html");
    res.writeHead(200, { "Content-Type":types[path.extname(file)] || "application/octet-stream" });
    res.end(await fs.readFile(file));
  } catch {
    res.writeHead(404, { "Content-Type":"text/html; charset=utf-8" });
    res.end(await fs.readFile(path.join(root, "404.html")).catch(() => "Not found"));
  }
}).listen(port, "127.0.0.1", () => console.log(`Static preview: http://127.0.0.1:${port}${basePath}/`));
