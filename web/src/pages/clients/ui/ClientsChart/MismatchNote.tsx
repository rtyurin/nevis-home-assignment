import { UNATTRIBUTED_NAME, type Breakdown, type ClientNode } from '@/entities/client';
import { formatNumber } from '@/shared/lib';
import type { ChartCategory } from '@/shared/ui/stacked-bar-chart';
import styles from './MismatchNote.module.css';

interface MismatchNoteProps {
  node: ClientNode;
  breakdown: Breakdown;
  months: readonly ChartCategory[];
}

/** Explains months where a node's children don't sum to its own reported total. */
export function MismatchNote({ node, breakdown, months }: MismatchNoteProps) {
  const { mismatches, dimension } = breakdown;
  if (mismatches.length === 0) return null;

  const hasShortfall = mismatches.some((m) => m.breakdownSum < m.reported);
  const details = mismatches
    .map(
      (m) => `${months[m.monthIndex]?.label} (${formatNumber(m.breakdownSum)} vs ${formatNumber(m.reported)} reported)`,
    )
    .join(', ');

  return (
    <div className={styles.note} role="note">
      <svg className={styles.icon} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 7v4.2M8 4.8v.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <p>
        The {dimension} figures don&rsquo;t add up to {node.name}&rsquo;s reported total in {details}.
        {hasShortfall && <> Where they fall short, the gap is shown as &ldquo;{UNATTRIBUTED_NAME}&rdquo;.</>}
      </p>
    </div>
  );
}
