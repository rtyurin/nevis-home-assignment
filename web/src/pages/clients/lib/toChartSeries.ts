import type { BreakdownSeries } from '@/entities/client';
import type { ChartSeries } from '@/shared/ui/stacked-bar-chart';

/** Categorical chart slots in fixed order (see --series-* in global.css). 1–3 are the design's channel colors. */
export const SERIES_COLORS = [
  'var(--series-1)',
  'var(--series-2)',
  'var(--series-3)',
  'var(--series-4)',
  'var(--series-5)',
] as const;
const UNATTRIBUTED_COLOR = 'var(--series-unattributed)';

/** Colors follow series order, so an entity keeps its color while you drill. */
export function toChartSeries(series: readonly BreakdownSeries[]): ChartSeries[] {
  let slot = 0;
  return series.map(({ id, name, values, kind }) =>
    kind === 'unattributed'
      ? { id, name, values, color: UNATTRIBUTED_COLOR, pattern: 'hatch' }
      : { id, name, values, color: SERIES_COLORS[slot++ % SERIES_COLORS.length] ?? SERIES_COLORS[0] },
  );
}
