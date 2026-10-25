import type { NextConfig } from "next";
import { normalizeBasePath } from "./scripts/paths.mjs";

const basePath = normalizeBasePath(process.env.PAGES_BASE_PATH || "");
const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  turbopack: { root: process.cwd() },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};
export default config;
