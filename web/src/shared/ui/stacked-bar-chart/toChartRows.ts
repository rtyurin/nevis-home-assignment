import type { ChartCategory, ChartSeries } from './types';

/** One row per category, in the shape Recharts consumes. */
export interface ChartRow {
  id: string;
  label: string;
  shortLabel: string;
  /** `null` where a series has no data for the category. */
  values: Record<string, number | null>;
  /** The reported total when given, else the stack sum. `null`: no data at all. */
  total: number | null;
  /** Sum of the drawn segments. */
  stackSum: number;
  /** Highest and lowest non-empty segments: the ones that get rounded corners. */
  topSeriesId: string | null;
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
      stackSum: sum ?? 0,
      topSeriesId,
      bottomSeriesId,
      marker:
        topSeriesId === null && markerSeriesId !== undefined
          ? { kind: total === null ? 'missing' : 'zero', seriesId: markerSeriesId }
          : null,
    };
  });
}
