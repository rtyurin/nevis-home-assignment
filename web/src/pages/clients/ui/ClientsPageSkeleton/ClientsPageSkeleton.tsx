import { Panel } from '@/shared/ui/panel';
import { Skeleton } from '@/shared/ui/skeleton';
import { StackedBarChartSkeleton } from '@/shared/ui/stacked-bar-chart';
import { TreeTableSkeleton } from '@/shared/ui/tree-table';
import { MONTH_COLUMN_META, NAME_COLUMN_META } from '../../model/columns';
import chartStyles from '../ClientsChart/ClientsChart.module.css';
import pageStyles from '../ClientsPage/ClientsPage.module.css';
import styles from './ClientsPageSkeleton.module.css';

/** A year of monthly totals, as shares of the axis. */
const BARS = [0.62, 0.67, 0.71, 0.75, 0.79, 0.84, 0.88, 0.62, 0.62, 0.62, 0.62, 0.88];
const COLUMNS = [NAME_COLUMN_META, ...BARS.map(() => MONTH_COLUMN_META)];
/** The company, expanded to its branches. */
const ROW_DEPTHS = [0, 1, 1, 1];

export function ClientsPageSkeleton() {
  return (
    <div role="status" className={pageStyles.stack}>
      <span className="sr-only">Loading client data…</span>
      <Panel aria-hidden="true" className={chartStyles.panel}>
        <div className={styles.chartHeader}>
          <Skeleton width={60} height={10} />
          <Skeleton width={62} height={10} />
        </div>
        <StackedBarChartSkeleton bars={BARS} seriesCount={3} />
      </Panel>
      <Panel flush aria-hidden="true">
        <TreeTableSkeleton columns={COLUMNS} rows={ROW_DEPTHS} />
      </Panel>
    </div>
  );
}
