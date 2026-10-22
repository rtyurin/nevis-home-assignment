import { UNATTRIBUTED_NAME, type Breakdown, type ClientNode } from '@/entities/client';
import { formatNumber } from '@/shared/lib';
import type { ChartCategory } from '@/shared/ui/stacked-bar-chart';
import { Toggletip } from '@/shared/ui/toggletip';
import styles from './MismatchSummary.module.css';

interface MismatchSummaryProps {
  node: ClientNode;
  breakdown: Breakdown;
  months: readonly ChartCategory[];
  className?: string;
}

/** Flags months where a node's children don't sum to its own reported total, with the detail on demand. */
export function MismatchSummary({ node, breakdown, months, className }: MismatchSummaryProps) {
  const { mismatches, dimension } = breakdown;
  if (mismatches.length === 0) return null;

  const count = mismatches.length;
  const hasShortfall = mismatches.some((m) => m.breakdownSum < m.reported);

  return (
    <Toggletip
      className={className}
      label={
        <>
          <InfoIcon />
          {count === 1 ? '1 month doesn’t add up' : `${count} months don’t add up`}
        </>
      }
    >
      <p>
        The {dimension} figures don&rsquo;t add up to {node.name}&rsquo;s reported total:
      </p>
      <ul className={styles.list}>
        {mismatches.map((m) => (
          <li key={m.monthIndex}>
            {months[m.monthIndex]?.label}: {formatNumber(m.breakdownSum)} vs {formatNumber(m.reported)} reported
          </li>
        ))}
      </ul>
      {hasShortfall && <p>Where they fall short, the gap is shown as &ldquo;{UNATTRIBUTED_NAME}&rdquo;.</p>}
    </Toggletip>
  );
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 7v4.2M8 4.8v.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
