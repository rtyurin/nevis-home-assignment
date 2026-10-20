import type { CSSProperties } from 'react';
import styles from './StackedBarChart.module.css';

export interface ChartLegendItem {
  id: string;
  name: string;
  color: string;
  pattern?: 'hatch';
}

export function ChartLegend({ items }: { items: readonly ChartLegendItem[] }) {
  return (
    <ul className={styles.legend} aria-label="Legend">
      {items.map((item) => (
        <li key={item.id} className={styles.legendItem}>
          <span
            className={styles.swatch}
            data-pattern={item.pattern}
            style={{ '--swatch-color': item.color } as CSSProperties}
            aria-hidden="true"
          />
          {item.name}
        </li>
      ))}
    </ul>
  );
}
