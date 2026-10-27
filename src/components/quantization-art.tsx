"use client";

import { useEffect, useRef } from "react";
import { sitePath } from "@/lib/content";

export function QuantizationArt() {
  const frame = useRef<HTMLIFrameElement>(null);
  const visible = useRef(true);
  const syncTheme = () => {
    const el = frame.current;
    if (!el) return;
    const style = getComputedStyle(el);
    el.contentWindow?.postMessage({
      type: "portfolio:art-theme",
      dark: document.documentElement.classList.contains("dark"),
      stage: style.getPropertyValue("--stage").trim(),
      ink: style.getPropertyValue("--stage-ink").trim(),
    }, window.location.origin);
    el.contentWindow?.postMessage({ type: "portfolio:art-visible", visible: visible.current }, window.location.origin);
  };
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    syncTheme();
    const theme = new MutationObserver(syncTheme);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
    const visibility = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
      el.contentWindow?.postMessage({ type: "portfolio:art-visible", visible: entry.isIntersecting }, window.location.origin);
    });
    visibility.observe(el);
    return () => { theme.disconnect(); visibility.disconnect(); };
  }, []);
  return <figure className="art-study quantization-study">
    <iframe ref={frame} className="quantization-frame" src={sitePath("/examples/quantization/index.html?embedded=1")}
      title="같은 지형의 계단면과 연속면을 비교하는 양자화 도식 견본" onLoad={syncTheme} />
    <figcaption><span className="num">QUANTIZATION / ART SPECIMEN</span><span>설명용 양자화 견본</span></figcaption>
  </figure>;
}
