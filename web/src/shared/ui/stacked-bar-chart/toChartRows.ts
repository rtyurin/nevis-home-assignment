import type { ChartCategory, ChartSeries } from './types';

/** One row per category, in the shape Recharts consumes. */
export interface ChartRow {
  id: string;
  label: string;
  shortLabel: string;
  values: Record<string, number>;
  /** Shown as the bar's total; the reported total when given, else the stack sum. */
  total: number;
  /** Highest non-empty segment of the stack: the one that gets the rounded cap. */
  topSeriesId: string | null;
}

export function toChartRows(
  categories: readonly ChartCategory[],
  series: readonly ChartSeries[],
  totals?: readonly number[],
): ChartRow[] {
  return categories.map((category, index) => {
    const values: Record<string, number> = {};
    let topSeriesId: string | null = null;
    let sum = 0;
    for (const s of series) {
      const value = Math.max(0, s.values[index] ?? 0);
      values[s.id] = value;
      sum += value;
      if (value > 0) topSeriesId = s.id;
    }
    return {
      id: category.id,
      label: category.label,
      shortLabel: category.shortLabel ?? category.label,
      values,
      total: totals?.[index] ?? sum,
      topSeriesId,
    };
  });
}

/** SVG path for a bar with optionally rounded top corners. */
export function barPath(x: number, y: number, width: number, height: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, height, width / 2));
  return [
    `M${x},${y + height}`,
    `V${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `H${x + width - r}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `V${y + height}`,
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
