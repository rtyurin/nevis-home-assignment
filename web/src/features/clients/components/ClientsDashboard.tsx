import { useClientsQuery } from '../useClientsQuery';
import { ClientsViewProvider } from '../store';
import { ClientsChartPanel } from './ClientsChartPanel';
import { ClientsTablePanel } from './ClientsTablePanel';
import { DashboardSkeleton, ErrorState, RefreshError } from './DashboardStates';
import styles from './ClientsDashboard.module.css';

export function ClientsDashboard() {
  const { data, error, isError, isFetching, refetch } = useClientsQuery();
  const retry = () => void refetch();

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Clients</h1>
      {data ? (
        <div className={styles.stack}>
          {isError && <RefreshError error={error} onRetry={retry} retrying={isFetching} />}
          <ClientsViewProvider key={data.root.id} init={{ expandedIds: [data.root.id] }}>
            <ClientsChartPanel data={data} />
            <ClientsTablePanel data={data} />
          </ClientsViewProvider>
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={retry} retrying={isFetching} />
      ) : (
        <DashboardSkeleton />
      )}
    </main>
  );
}
