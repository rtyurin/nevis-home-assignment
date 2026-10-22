import { useSuspenseQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { clientsQueryOptions, getBreakdown, pathTo } from '@/entities/client';
import { formatMonth, formatMonthShort, formatNumber } from '@/shared/lib';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { Panel } from '@/shared/ui/panel';
import { StackedBarChart, type ChartCategory } from '@/shared/ui/stacked-bar-chart';
import { SERIES_COLORS, toChartSeries } from '../lib/toChartSeries';
import { MismatchSummary } from './MismatchSummary';
import styles from './ClientsChart.module.css';

export interface ClientsChartProps {
  /** The node to chart; the company when null. */
  selectedId: string | null;
  /** From the breadcrumbs. */
  onSelect: (id: string) => void;
}

/** Monthly clients for the drilled-into node, stacked by the level beneath it. */
export function ClientsChart({ selectedId, onSelect }: ClientsChartProps) {
  const { data } = useSuspenseQuery(clientsQueryOptions());
  const node = (selectedId !== null ? data.index.get(selectedId)?.node : undefined) ?? data.root;
  const breakdown = getBreakdown(node, { maxSeries: SERIES_COLORS.length });
  const titleId = useId();
  const descriptionId = useId();

  const categories: ChartCategory[] = data.months.map((month) => ({
    id: month,
    label: formatMonth(month),
    shortLabel: formatMonthShort(month),
  }));
  const mismatchByMonth = new Map(breakdown.mismatches.map((m) => [data.months[m.monthIndex], m]));

  return (
    <Panel aria-labelledby={titleId} className={styles.panel}>
      <h2 id={titleId} className="sr-only">
        {`${node.name} clients${breakdown.dimension ? ` by ${breakdown.dimension}` : ''}`}
      </h2>
      <div className={styles.header}>
        <Breadcrumbs aria-label="Chart scope" items={pathTo(data.index, node.id)} onSelect={onSelect} />
        {breakdown.dimension && <span className={styles.dimension}>by {breakdown.dimension}</span>}
        <MismatchSummary
          key={node.id}
          className={styles.mismatches}
          node={node}
          breakdown={breakdown}
          months={categories}
        />
      </div>
      <p id={descriptionId} className="sr-only">
        Monthly number of clients from {categories[0]?.label} to {categories.at(-1)?.label}. The same figures are listed
        in the table below.
      </p>
      <StackedBarChart
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        categories={categories}
        series={toChartSeries(breakdown.series)}
        totals={breakdown.totals}
        formatValue={formatNumber}
        animationKey={node.id}
        renderTooltipFooter={(month) => {
          const mismatch = mismatchByMonth.get(month);
          return mismatch ? `Breakdown adds up to ${formatNumber(mismatch.breakdownSum)}` : null;
        }}
      />
    </Panel>
  );
}
