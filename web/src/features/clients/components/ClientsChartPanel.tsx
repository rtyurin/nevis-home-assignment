import { useMemo } from 'react';
import { Breadcrumbs } from '../../../components/Breadcrumbs';
import { Panel } from '../../../components/Panel';
import { StackedBarChart, type ChartCategory } from '../../../components/StackedBarChart';
import { formatMonth, formatMonthShort, formatNumber } from '../../../lib/format';
import { useStableId } from '../../../lib/useStableId';
import { getBreakdown } from '../breakdown';
import { pathTo, type ClientsData } from '../model';
import { useClientsView } from '../store';
import { MismatchNote } from './MismatchNote';
import styles from './ClientsChartPanel.module.css';

export function ClientsChartPanel({ data }: { data: ClientsData }) {
  const selectedId = useClientsView((state) => state.selectedId);
  const select = useClientsView((state) => state.select);
  const titleId = useStableId('chart-title');
  const descriptionId = useStableId('chart-desc');

  const node = (selectedId !== null && data.index.get(selectedId)?.node) || data.root;
  const path = pathTo(data.index, node.id);
  const breakdown = useMemo(() => getBreakdown(node), [node]);

  const categories = useMemo<ChartCategory[]>(
    () => data.months.map((month) => ({ id: month, label: formatMonth(month), shortLabel: formatMonthShort(month) })),
    [data.months],
  );

  const mismatchByMonth = new Map(breakdown.mismatches.map((m) => [m.monthIndex, m]));
  const firstMonth = categories[0]?.label;
  const lastMonth = categories[categories.length - 1]?.label;

  return (
    <Panel aria-labelledby={titleId} className={styles.panel}>
      <h2 id={titleId} className="sr-only">
        {`${node.name} clients${breakdown.dimension ? ` by ${breakdown.dimension}` : ''}`}
      </h2>
      <div className={styles.header}>
        <Breadcrumbs
          aria-label="Chart scope"
          items={path.map(({ id, name }) => ({ id, label: name }))}
          onSelect={select}
        />
        {breakdown.dimension && <span className={styles.dimension}>by {breakdown.dimension}</span>}
      </div>
      <p id={descriptionId} className="sr-only">
        Monthly number of clients from {firstMonth} to {lastMonth}. Use the arrow keys to move between months. The
        same figures are listed in the table below.
      </p>
      <StackedBarChart
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        categories={categories}
        series={breakdown.series}
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
