// The category rail and the detail rail have independent breakpoints.
export function readingRange({ sideHeight = 0, keepHeight = 0, headerHeight = 0, outerAcross = false, detailAcross = false }) {
  return Math.max(0, (outerAcross ? Math.max(0, sideHeight - keepHeight) : 0) + (detailAcross ? headerHeight : 0));
}
export function advanceReadingShift(current, delta, limit, scrollTop) {
  return Math.min(0, Math.max(-limit, current - delta, -Math.max(0, scrollTop))) || 0;
}
export function settledReadingShift(down, limit, scrollTop) {
  return down && limit > 0 && scrollTop >= limit ? -limit : 0;
}
