import data from "../../content/portfolio.json";
import type { PortfolioData } from "./types";

export const portfolio = data as PortfolioData;
export function sitePath(pathname: string) {
  return `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${pathname}`;
}
