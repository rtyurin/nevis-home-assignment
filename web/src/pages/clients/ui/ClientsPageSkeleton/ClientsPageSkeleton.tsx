import { ClientsChartSkeleton } from '@/widgets/clients-chart';
import { ClientsTableSkeleton } from '@/widgets/clients-table';
import styles from './ClientsPageSkeleton.module.css';

export function ClientsPageSkeleton() {
  return (
    <div role="status" className={styles.stack}>
      <span className="sr-only">Loading client data…</span>
      <ClientsChartSkeleton />
      <ClientsTableSkeleton />
    </div>
  );
}
