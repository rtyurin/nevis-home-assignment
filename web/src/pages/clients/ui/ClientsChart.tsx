import { useSuspenseQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { clientsQueryOptions, getBreakdown } from '@/entities/client';
import { useSelectedNode } from '../model/useSelectedNode';
import { DrilldownBreadcrumbs } from './DrilldownBreadcrumbs';
import { formatMonth, formatMonthShort, formatNumber } from '@/shared/lib';
import { Panel } from '@/shared/ui/panel';
import { StackedBarChart, type ChartCategory } from '@/shared/ui/stacked-bar-chart';
import { SERIES_COLORS, toChartSeries } from '../lib/toChartSeries';
import { MismatchNote } from './MismatchNote';
import styles from './ClientsChart.module.css';

/** Monthly clients for the drilled-into node, stacked by the level beneath it. */
export function ClientsChart() {
  const { data } = useSuspenseQuery(clientsQueryOptions());
  const node = useSelectedNode(data);
  const breakdown = getBreakdown(node, { maxSeries: SERIES_COLORS.length });
  const titleId = useId();
  const descriptionId = useId();

  const categories: ChartCategory[] = data.months.map((month) => ({
    id: month,
    label: formatMonth(month),
    shortLabel: formatMonthShort(month),
  }));
  const mismatchByMonth = new Map(breakdown.mismatches.map((m) => [m.monthIndex, m]));

  return (
    <Panel aria-labelledby={titleId} className={styles.panel}>
      <h2 id={titleId} className="sr-only">
        {`${node.name} clients${breakdown.dimension ? ` by ${breakdown.dimension}` : ''}`}
      </h2>
      <div className={styles.header}>
        <DrilldownBreadcrumbs data={data} label="Chart scope" />
        {breakdown.dimension && <span className={styles.dimension}>by {breakdown.dimension}</span>}
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
        renderTooltipFooter={(index) => {
          const mismatch = mismatchByMonth.get(index);
          return mismatch ? `Breakdown adds up to ${formatNumber(mismatch.breakdownSum)}` : null;
        }}
      />
      <MismatchNote node={node} breakdown={breakdown} months={categories} />
    </Panel>
  );
}
