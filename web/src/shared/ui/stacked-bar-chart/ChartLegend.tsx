import { Swatch } from './Swatch';
import type { ChartSeries } from './types';
import styles from './StackedBarChart.module.css';

type ChartLegendItem = Pick<ChartSeries, 'id' | 'name' | 'color' | 'pattern'>;

export function ChartLegend({ items }: { items: readonly ChartLegendItem[] }) {
  return (
    <ul className={styles.legend} aria-label="Legend">
      {items.map((item) => (
        <li key={item.id} className={styles.legendItem}>
          <Swatch color={item.color} pattern={item.pattern} />
          {item.name}
        </li>
      ))}
    </ul>
  );
}
