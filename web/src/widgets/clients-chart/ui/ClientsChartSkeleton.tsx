import { Panel } from '@/shared/ui/panel';
import { Skeleton } from '@/shared/ui/skeleton';
import { StackedBarChartSkeleton } from '@/shared/ui/stacked-bar-chart';
import styles from './ClientsChartSkeleton.module.css';

/** A year of monthly totals, as shares of the axis. */
const BARS = [0.73, 0.67, 0.5, 0.73, 0.79, 0.84, 0.88, 0.62, 0.62, 0.62, 0.62, 0.88];

/** Decorative: the caller announces the loading state. */
export function ClientsChartSkeleton() {
  return (
    <Panel aria-hidden="true" className={styles.panel}>
      <div className={styles.header}>
        <Skeleton width={60} height={10} />
        <Skeleton width={62} height={10} />
      </div>
      <StackedBarChartSkeleton bars={BARS} seriesCount={3} />
    </Panel>
  );
}
