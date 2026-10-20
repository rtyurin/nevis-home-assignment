import { Panel } from '@/shared/ui/panel';
import styles from './ClientsPageSkeleton.module.css';

const BARS = [62, 66, 70, 74, 79, 83, 87, 65, 65, 65, 65, 90];

/** Placeholder in the shape of the chart and table while client data loads. */
export function ClientsPageSkeleton() {
  return (
    <div role="status" className={styles.stack}>
      <span className="sr-only">Loading client data…</span>
      <Panel aria-hidden="true">
        <div className={styles.chart}>
          {BARS.map((height, i) => (
            <span key={i} className={styles.bar} style={{ height: `${height}%` }} />
          ))}
        </div>
      </Panel>
      <Panel flush aria-hidden="true">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className={styles.row}>
            <span className={styles.line} style={{ width: row === 0 ? '30%' : '18%' }} />
            <span className={styles.line} style={{ width: '50%' }} />
          </div>
        ))}
      </Panel>
    </div>
  );
}
