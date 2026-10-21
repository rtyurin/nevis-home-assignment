import type { CSSProperties } from 'react';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  BAR_INSET,
  BAR_MAX_WIDTH,
  BAR_MIN_SHARE,
  CAP_RADIUS,
  CHART_HEIGHT,
  CHART_TOP_MARGIN,
  X_AXIS_HEIGHT,
  Y_AXIS_WIDTH,
} from './layout';
import styles from './StackedBarChartSkeleton.module.css';

export interface StackedBarChartSkeletonProps {
  /** One bar per category, as a share (0–1) of the plot height. */
  bars: readonly number[];
  /** Legend entries to stand in for. The chart shows no legend for a single series. */
  seriesCount: number;
  height?: number;
}

/** Five gridlines, as for a typical 0–400 scale. */
const GRID_LINES = [0, 0.25, 0.5, 0.75, 1];

export function StackedBarChartSkeleton({ bars, seriesCount, height = CHART_HEIGHT }: StackedBarChartSkeletonProps) {
  const layout = {
    '--chart-height': `${height}px`,
    '--chart-top': `${CHART_TOP_MARGIN}px`,
    '--y-axis-width': `${Y_AXIS_WIDTH}px`,
    '--x-axis-height': `${X_AXIS_HEIGHT}px`,
    '--bar-max-width': `${BAR_MAX_WIDTH}px`,
    '--bar-inset': `${BAR_INSET}px`,
    '--bar-min-share': `${BAR_MIN_SHARE * 100}%`,
    '--cap-radius': `${CAP_RADIUS}px`,
    '--categories': bars.length,
  } as CSSProperties;

  return (
    <div className={styles.root} style={layout} aria-hidden="true">
      <div className={styles.chart}>
        <div className={styles.yAxis}>
          {GRID_LINES.map((at) => (
            <Skeleton key={at} className={styles.yTick} style={{ bottom: `${at * 100}%` }} />
          ))}
        </div>
        <div className={styles.plot}>
          {GRID_LINES.map((at) => (
            <span key={at} className={styles.gridLine} style={{ bottom: `${at * 100}%` }} />
          ))}
          {bars.map((share, i) => (
            <div key={i} className={styles.band}>
              <Skeleton className={styles.bar} style={{ height: `${share * 100}%` }} />
            </div>
          ))}
        </div>
        <div className={styles.xAxis}>
          {bars.map((_, i) => (
            <Skeleton key={i} className={styles.xTick} />
          ))}
        </div>
      </div>
      {seriesCount > 1 && (
        <div className={styles.legend}>
          {Array.from({ length: seriesCount }, (_, i) => (
            <span key={i} className={styles.legendItem}>
              <Skeleton width={10} height={10} style={{ borderRadius: 2 }} />
              <Skeleton width={48} height={8} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
