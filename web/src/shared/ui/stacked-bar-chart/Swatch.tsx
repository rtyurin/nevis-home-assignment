import type { CSSProperties } from 'react';
import type { ChartSeries } from './types';
import styles from './StackedBarChart.module.css';

export function Swatch({ color, pattern }: Pick<ChartSeries, 'color' | 'pattern'>) {
  return (
    <span
      className={styles.swatch}
      data-pattern={pattern}
      style={{ '--swatch-color': color } as CSSProperties}
      aria-hidden="true"
    />
  );
}
