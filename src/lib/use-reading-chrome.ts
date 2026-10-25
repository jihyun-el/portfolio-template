"use client";

import { useEffect, type RefObject } from "react";
import { advanceReadingShift, readingRange, settledReadingShift } from "../../scripts/reading-chrome.mjs";

export function useReadingChrome(root: RefObject<HTMLDivElement | null>, selection: string) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const phone = window.matchMedia("(max-width:680px)");
    const strip = window.matchMedia("(max-aspect-ratio:5/4)");
    const last = new WeakMap<HTMLElement, number>();
    let shift = 0, limit = 0, settle = 0, down = false, side = 0, head = 0, place = 0, ride = false, across = false;
    const px = (name: string, value: number) => el.style.setProperty(name, `${Math.round(value)}px`);
    const apply = () => {
      el.toggleAttribute("data-collapsed", shift < 0);
      px("--bar-shift", shift);
      el.style.setProperty("--bar-hide", limit ? String(-shift / limit) : "0");
      px("--reading-top", ride ? Math.max(0, side + head + shift) + (across ? place : 0) + 12 : 12);
      window.dispatchEvent(new Event("portfolio:reading-offset"));
    };
    const measure = () => {
      const bar = el.querySelector<HTMLElement>(".browser-side");
      const name = el.querySelector<HTMLElement>(".browser-name-row");
      const list = el.querySelector<HTMLElement>(".browser-choices");
      const header = el.querySelector<HTMLElement>(".detail-head");
      const rail = el.querySelector<HTMLElement>(".detail-place");
      const footer = el.querySelector<HTMLElement>(".detail-footer");
      const outerAcross = phone.matches || strip.matches;
      across = !!rail && getComputedStyle(rail).getPropertyValue("--across").trim() === "1";
      ride = outerAcross || across;
      side = outerAcross ? bar?.offsetHeight ?? 0 : 0;
      head = header?.offsetHeight ?? 0;
      place = rail?.offsetHeight ?? 0;
      let row = 0, pad = 0;
      if (outerAcross && bar && name) {
        const style = getComputedStyle(bar);
        pad = parseFloat(style.paddingTop) || 0;
        row = phone.matches ? name.offsetTop + name.offsetHeight : (list?.offsetTop ?? name.offsetTop + name.offsetHeight) - (parseFloat(style.rowGap) || 0);
      }
      limit = readingRange({ sideHeight: side, keepHeight: row + pad, headerHeight: head, outerAcross, detailAcross: across });
      shift = Math.max(-limit, shift);
      px("--side-h", side); px("--head-h", head); px("--rail-h", place);
      px("--keep-row", row); px("--keep-pad", pad);
      px("--foot-h", footer?.offsetHeight ?? 0);
      el.toggleAttribute("data-bar", true);
      el.toggleAttribute("data-ride", ride);
      el.toggleAttribute("data-across", across);
      for (const box of el.querySelectorAll<HTMLElement>(".browser-main,.detail-body")) if (!last.has(box)) last.set(box, Math.max(0, box.scrollTop));
      apply();
    };
    const show = () => { window.clearTimeout(settle); el.removeAttribute("data-snap"); shift = 0; measure(); };
    const onFocus = (event: FocusEvent) => { if (event.target instanceof HTMLElement && event.target.closest(".browser-side,.detail-head,.detail-footer")) show(); };
    const onScroll = (event: Event) => {
      const box = event.target;
      if (!(box instanceof HTMLElement) || !box.matches(".browser-main,.detail-body")) return;
      const top = Math.max(0, box.scrollTop), before = last.get(box) ?? 0;
      last.set(box, top);
      el.removeAttribute("data-snap");
      shift = advanceReadingShift(shift, top - before, limit, top);
      if (top !== before) down = top > before;
      apply();
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        const to = settledReadingShift(down, limit, top);
        if (to !== shift) { el.toggleAttribute("data-snap", true); shift = to; apply(); }
      }, 160);
    };
    const sized = new ResizeObserver(measure);
    const observe = () => {
      sized.disconnect();
      for (const part of el.querySelectorAll(".browser-side,.browser-main,.detail-head,.detail-place,.detail-footer")) sized.observe(part);
      measure();
    };
    // Style and current-section changes do not rebuild the observer or reset the reading position.
    const changed = new MutationObserver(observe);
    changed.observe(el.querySelector(".browser-main") ?? el, { childList: true, subtree: false });
    el.addEventListener("scroll", onScroll, { capture: true, passive: true });
    el.addEventListener("focusin", onFocus);
    window.addEventListener("resize", show);
    phone.addEventListener("change", show); strip.addEventListener("change", show);
    window.addEventListener("portfolio:show-chrome", show);
    observe();
    return () => {
      window.clearTimeout(settle); sized.disconnect(); changed.disconnect();
      el.removeEventListener("scroll", onScroll, { capture: true });
      el.removeEventListener("focusin", onFocus);
      window.removeEventListener("resize", show);
      phone.removeEventListener("change", show); strip.removeEventListener("change", show);
      window.removeEventListener("portfolio:show-chrome", show);
    };
  }, [root, selection]);
}
