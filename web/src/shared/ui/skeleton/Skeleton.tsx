import type { ComponentPropsWithoutRef } from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps extends ComponentPropsWithoutRef<'span'> {
  width?: number | string;
  height?: number | string;
}

export function Skeleton({ width, height, className, style, ...props }: SkeletonProps) {
  return (
    <span
      className={[styles.skeleton, className].filter(Boolean).join(' ')}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}
