// A small, flat symbol: the same contour becomes discrete levels.
// Shared by the detail rail at every responsive size; no measured data.
export function QuantizationMark() {
  return <svg className="quantization-mark" viewBox="0 0 120 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 53H112" opacity=".16" />
    <path d="M8 45C17 45 21 15 34 15S49 43 60 43 75 22 85 22 101 42 112 36" opacity=".35" />
    <path d="M8 45H18V32H26V17H40V23H48V36H56V43H67V36H75V25H91V29H99V38H112" />
    <path d="M26 17H40M75 25H91" stroke="var(--signal)" strokeWidth="2" />
    <path d="M34 17V53M83 25V53" opacity=".12" strokeDasharray="2 4" />
  </svg>;
}
