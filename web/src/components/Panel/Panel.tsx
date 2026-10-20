import type { ComponentPropsWithoutRef } from 'react';
import styles from './Panel.module.css';

export interface PanelProps extends ComponentPropsWithoutRef<'section'> {
  /** Remove inner padding, for content that runs edge to edge (tables). */
  flush?: boolean;
}

/** White rounded surface that groups one piece of the dashboard. */
export function Panel({ flush = false, className, ...props }: PanelProps) {
  return (
    <section
      className={[styles.panel, flush && styles.flush, className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}
