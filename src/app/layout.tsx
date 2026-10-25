import type { Metadata } from "next";
import localFont from "next/font/local";
import { portfolio, sitePath } from "@/lib/content";
import "./globals.css";

const pretendard = localFont({ src: "../../public/fonts/PretendardVariable.woff2", variable: "--font-pretendard", weight: "100 900", display: "swap" });
const mono = localFont({ src: "../../public/fonts/GeistMono-Variable.woff2", variable: "--font-mono", weight: "100 900", display: "swap" });
export const metadata: Metadata = {
  title: { default: `${portfolio.profile.name} | ${portfolio.site.title}`, template: `%s | ${portfolio.profile.name}` },
  description: portfolio.site.description,
  icons: { icon: sitePath("/favicon.svg") },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: "try{const t=localStorage.getItem('portfolio-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch{}" }} /></head>
    <body className={`${pretendard.variable} ${mono.variable}`}><a className="skip-link" href="#main-content">본문으로 이동</a>{children}</body>
  </html>;
}
