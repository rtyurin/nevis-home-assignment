/** Geometry shared by the chart and its loading skeleton, so the two line up. */
export const CHART_HEIGHT = 400;
export const CHART_TOP_MARGIN = 12;
export const Y_AXIS_WIDTH = 44;
/** Recharts' default XAxis height. */
export const X_AXIS_HEIGHT = 30;
export const BAR_MAX_WIDTH = 87.5;
/** Space kept on either side of a bar: 24px between bars, 12px at the plot's edges. */
export const BAR_INSET = 12;
/** On narrow plots the insets give way, and a bar keeps this share of its band. */
export const BAR_MIN_SHARE = 0.56;
export const CAP_RADIUS = 4;
export const ZERO_STUB_HEIGHT = 3;
export const MISSING_PLACEHOLDER_HEIGHT = 16;

export function barWidth(band: number): number {
  return Math.min(BAR_MAX_WIDTH, Math.max(band - 2 * BAR_INSET, band * BAR_MIN_SHARE));
}

/** SVG path for a bar with optionally rounded top and bottom corners. */
export function barPath(
  x: number,
  y: number,
  width: number,
  height: number,
  { top = 0, bottom = 0 }: { top?: number; bottom?: number },
): string {
  // Rounded at both ends, each end gets at most half the height.
  const limit = Math.min(width / 2, top > 0 && bottom > 0 ? height / 2 : height);
  const t = Math.max(0, Math.min(top, limit));
  const b = Math.max(0, Math.min(bottom, limit));
  const y2 = y + height;
  return [
    `M${x},${y2 - b}`,
    `V${y + t}`,
    `Q${x},${y} ${x + t},${y}`,
    `H${x + width - t}`,
    `Q${x + width},${y} ${x + width},${y + t}`,
    `V${y2 - b}`,
    `Q${x + width},${y2} ${x + width - b},${y2}`,
    `H${x + b}`,
    `Q${x},${y2} ${x},${y2 - b}`,
    'Z',
  ].join(' ');
}

/** A 0-based linear axis with round tick steps (1, 2, 5 × 10ⁿ, never below 1). */
export function niceScale(max: number, targetTickCount = 4): { max: number; ticks: number[] } {
  if (!(max > 0)) return { max: 1, ticks: [0, 1] };
  const rough = max / targetTickCount;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = Math.max(1, [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough);
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let tick = 0; tick <= niceMax; tick += step) ticks.push(tick);
  return { max: niceMax, ticks };
}
