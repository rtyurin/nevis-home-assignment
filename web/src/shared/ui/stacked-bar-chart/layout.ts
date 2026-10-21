/** Geometry shared by the chart and its loading skeleton, so the two line up. */
export const CHART_HEIGHT = 400;
export const CHART_TOP_MARGIN = 12;
export const Y_AXIS_WIDTH = 44;
/** Recharts' default XAxis height. */
export const X_AXIS_HEIGHT = 30;
/** Widest a bar gets, as in the design. */
export const BAR_MAX_WIDTH = 87.5;
/** Space kept on either side of a bar: 24px between bars, 12px at the plot's edges. */
export const BAR_INSET = 12;
/** On narrow plots the insets give way, and a bar keeps this share of its band. */
export const BAR_MIN_SHARE = 0.56;
export const CAP_RADIUS = 4;
/** A real 0: a stub on the baseline, so it reads differently from no data. */
export const ZERO_STUB_HEIGHT = 3;
/** No data: a hatched block on the baseline. */
export const MISSING_PLACEHOLDER_HEIGHT = 16;

/** Width of a bar in a category band of the given width. */
export function barWidth(band: number): number {
  return Math.min(BAR_MAX_WIDTH, Math.max(band - 2 * BAR_INSET, band * BAR_MIN_SHARE));
}
