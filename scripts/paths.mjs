export function normalizeBasePath(value) {
  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed || trimmed === "/") return "";
  if (!/^\/[a-zA-Z0-9._-]+$/.test(trimmed) || trimmed === "/.." || trimmed === "/.") {
    throw new Error("PAGES_BASE_PATH must be empty or a repository path such as /portfolio");
  }
  return trimmed;
}

export function withBasePath(basePath, pathname) {
  const base = normalizeBasePath(basePath);
  if (!pathname.startsWith("/") || pathname.startsWith("//")) {
    throw new Error("Site paths must begin with one slash");
  }
  return `${base}${pathname}`;
}
