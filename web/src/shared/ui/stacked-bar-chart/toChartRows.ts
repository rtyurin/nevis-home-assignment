import type { ChartCategory, ChartSeries } from './types';

/** One row per category, in the shape Recharts consumes. */
export interface ChartRow {
  id: string;
  label: string;
  shortLabel: string;
  /** `null` where a series has no data for the category. */
  values: Record<string, number | null>;
  /** Shown as the bar's total; the reported total when given, else the stack sum. `null`: no data at all. */
  total: number | null;
  /** Highest non-empty segment of the stack: the one that gets the rounded top. */
  topSeriesId: string | null;
  /** Lowest non-empty segment of the stack: the one that gets the rounded bottom. */
  bottomSeriesId: string | null;
  /** Drawn on the baseline when nothing stacks above it, by the segment of `seriesId`. */
  marker: { kind: 'zero' | 'missing'; seriesId: string } | null;
}

export function toChartRows(
  categories: readonly ChartCategory[],
  series: readonly ChartSeries[],
  totals?: readonly (number | null)[],
): ChartRow[] {
  return categories.map((category, index) => {
    const values: Record<string, number | null> = {};
    let topSeriesId: string | null = null;
    let bottomSeriesId: string | null = null;
    let zeroSeriesId: string | null = null;
    let sum: number | null = null;
    for (const s of series) {
      const raw = s.values[index];
      const value = raw == null ? null : Math.max(0, raw);
      values[s.id] = value;
      if (value === null) continue;
      sum = (sum ?? 0) + value;
      if (value > 0) {
        topSeriesId = s.id;
        bottomSeriesId ??= s.id;
      } else {
        zeroSeriesId ??= s.id;
      }
    }
    const total = totals?.[index] ?? sum;
    // A real 0 takes the color of a series that reported it.
    const markerSeriesId = zeroSeriesId ?? series[0]?.id;
    return {
      id: category.id,
      label: category.label,
      shortLabel: category.shortLabel ?? category.label,
      values,
      total,
      topSeriesId,
      bottomSeriesId,
      marker:
        topSeriesId === null && markerSeriesId !== undefined
          ? { kind: total === null ? 'missing' : 'zero', seriesId: markerSeriesId }
          : null,
    };
  });
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
