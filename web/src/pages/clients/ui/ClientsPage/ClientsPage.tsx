import { QueryErrorResetBoundary, useSuspenseQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { clientsQueryOptions } from '@/entities/client';
import { DrilldownProvider } from '../../model/drilldownStore';
import { ApiError } from '@/shared/api';
import { ErrorState } from '@/shared/ui/error-state';
import { ClientsChart } from '../ClientsChart/ClientsChart';
import { ClientsTable } from '../ClientsTable/ClientsTable';
import { ClientsPageSkeleton } from '../ClientsPageSkeleton/ClientsPageSkeleton';
import styles from './ClientsPage.module.css';

export function ClientsPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Clients</h1>
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary onReset={reset} FallbackComponent={ClientsLoadError}>
            <Suspense fallback={<ClientsPageSkeleton />}>
              <ClientsDashboard />
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </main>
  );
}

function ClientsDashboard() {
  const { data } = useSuspenseQuery(clientsQueryOptions());
  return (
    <DrilldownProvider key={data.root.id} rootId={data.root.id}>
      <div className={styles.stack}>
        <ClientsChart />
        <ClientsTable />
      </div>
    </DrilldownProvider>
  );
}

function ClientsLoadError({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <ErrorState
      title="Client data couldn’t be loaded"
      message={error instanceof ApiError ? error.message : 'Something went wrong.'}
      onRetry={resetErrorBoundary}
    />
  );
}
