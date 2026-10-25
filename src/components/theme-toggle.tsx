"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      let saved: string | null = null;
      try { saved = localStorage.getItem("portfolio-theme"); } catch {}
      const next = saved ? saved === "dark" : media.matches;
      document.documentElement.classList.toggle("dark", next);
      setDark(next);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return <button className="icon-button" type="button" aria-label={dark ? "밝은 화면으로 전환" : "어두운 화면으로 전환"}
    onClick={() => {
      const next = !dark;
      document.documentElement.classList.toggle("dark", next);
      try { localStorage.setItem("portfolio-theme", next ? "dark" : "light"); } catch {}
      setDark(next);
    }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      {dark ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></> : <path d="M20 14.5A9 9 0 0 1 9.5 4 9 9 0 1 0 20 14.5Z" />}
    </svg>
  </button>;
}
