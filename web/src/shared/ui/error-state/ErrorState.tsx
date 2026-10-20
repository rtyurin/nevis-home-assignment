import { Panel } from '../panel';
import styles from './ErrorState.module.css';

export interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({ title, message, onRetry, retryLabel = 'Try again' }: ErrorStateProps) {
  return (
    <Panel className={styles.error}>
      <div role="alert">
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
      </div>
      {onRetry && (
        <button type="button" className={styles.button} onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </Panel>
  );
}
