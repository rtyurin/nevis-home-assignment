import type { ComponentPropsWithoutRef } from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps extends ComponentPropsWithoutRef<'span'> {
  width?: number | string;
  height?: number | string;
}

/** Pulsing placeholder block, sized to stand in for content that is still loading. */
export function Skeleton({ width, height, className, style, ...props }: SkeletonProps) {
  return (
    <span
      className={[styles.skeleton, className].filter(Boolean).join(' ')}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}
