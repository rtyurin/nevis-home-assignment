import type { CSSProperties } from 'react';
import { Skeleton } from '@/shared/ui/skeleton';
import { columnLayoutStyle } from './columnLayout';
import type { TreeTableColumnMeta } from './features';
import tableStyles from './TreeTable.module.css';
import styles from './TreeTableSkeleton.module.css';

export interface TreeTableSkeletonProps {
  /** Meta of the columns the loaded table will have, so the tracks match. */
  columns: readonly TreeTableColumnMeta[];
  /** Depth of each placeholder row, for its indentation. */
  rows: readonly number[];
  rowHeight?: number;
}

/** Built on the TreeTable's own grid styles, so tracks, paddings and row height match. */
export function TreeTableSkeleton({ columns, rows, rowHeight = 56 }: TreeTableSkeletonProps) {
  const [, ...valueColumns] = columns;
  return (
    <div className={styles.clip} aria-hidden="true">
      <div
        className={tableStyles.grid}
        style={columnLayoutStyle(
          columns.map((meta) => ({ columnDef: { meta } })),
          rowHeight,
        )}
      >
        <div className={tableStyles.headerRow}>
          <div className={tableStyles.treeHeader} />
          {valueColumns.map((meta, i) => (
            <div key={i} className={tableStyles.header} data-align={meta.align ?? 'start'}>
              <Skeleton width="min(64px, 100%)" height={12} />
            </div>
          ))}
        </div>
        {rows.map((depth, r) => (
          <div key={r} className={`${tableStyles.headerRow} ${styles.row}`}>
            <div className={tableStyles.treeCell} style={{ '--tree-depth': depth } as CSSProperties}>
              <span className={tableStyles.toggle} />
              <Skeleton width={depth === 0 ? 68 : 60} height={12} />
            </div>
            {valueColumns.map((meta, i) => (
              <div key={i} className={tableStyles.cell} data-align={meta.align ?? 'start'}>
                <Skeleton width={28} height={12} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
