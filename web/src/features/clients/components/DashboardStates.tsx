import { Panel } from '../../../components/Panel';
import { ApiError } from '../api';
import styles from './DashboardStates.module.css';

const SKELETON_BARS = [62, 66, 70, 74, 79, 83, 87, 65, 65, 65, 65, 90];

export function DashboardSkeleton() {
  return (
    <div role="status" className={styles.stack}>
      <span className="sr-only">Loading client data…</span>
      <Panel aria-hidden="true">
        <div className={styles.chart}>
          {SKELETON_BARS.map((height, i) => (
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

export function describeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong.';
}

interface ErrorStateProps {
  error: unknown;
  onRetry: () => void;
  retrying: boolean;
}

export function ErrorState({ error, onRetry, retrying }: ErrorStateProps) {
  return (
    <Panel className={styles.error}>
      <div role="alert">
        <h2 className={styles.errorTitle}>Client data couldn&rsquo;t be loaded</h2>
        <p className={styles.errorMessage}>{describeError(error)}</p>
      </div>
      <button type="button" className={styles.button} onClick={onRetry} disabled={retrying}>
        {retrying ? 'Retrying…' : 'Try again'}
      </button>
    </Panel>
  );
}

/** Shown above stale data when a background refetch fails. */
export function RefreshError({ error, onRetry, retrying }: ErrorStateProps) {
  return (
    <div className={styles.banner} role="alert">
      <span>Couldn&rsquo;t refresh client data. {describeError(error)}</span>
      <button type="button" className={styles.button} onClick={onRetry} disabled={retrying}>
        {retrying ? 'Retrying…' : 'Try again'}
      </button>
    </div>
  );
}
