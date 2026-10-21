import { QueryErrorResetBoundary, useSuspenseQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { clientsQueryOptions } from '@/entities/client';
import { ApiError } from '@/shared/api';
import { ErrorState } from '@/shared/ui/error-state';
import { DrilldownProvider, useDrilldown } from '../../model/drilldownStore';
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
      <ClientsPanels />
    </DrilldownProvider>
  );
}

/** Each panel fails on its own: a chart that can't be drawn leaves the table usable, and the other way round. */
function ClientsPanels() {
  const selectedId = useDrilldown((state) => state.selectedId);
  return (
    <div className={styles.stack}>
      {/* Selecting another row is a fresh attempt at drawing the chart. */}
      <ErrorBoundary
        resetKeys={[selectedId]}
        fallbackRender={({ resetErrorBoundary }) => (
          <ErrorState
            title="The chart couldn’t be drawn"
            message="The figures are still in the table below."
            onRetry={resetErrorBoundary}
          />
        )}
      >
        <ClientsChart />
      </ErrorBoundary>
      <ErrorBoundary
        fallbackRender={({ resetErrorBoundary }) => (
          <ErrorState
            title="The table couldn’t be drawn"
            message="Try again, or reload the page."
            onRetry={resetErrorBoundary}
          />
        )}
      >
        <ClientsTable />
      </ErrorBoundary>
    </div>
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
