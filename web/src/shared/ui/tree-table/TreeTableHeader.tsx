import { FlexRender, type HeaderGroup, type RowData } from '@tanstack/react-table';
import type { TreeTableFeatures } from './features';
import styles from './TreeTable.module.css';

export function TreeTableHeader<TData extends RowData>({
  headerGroups,
}: {
  headerGroups: HeaderGroup<TreeTableFeatures, TData>[];
}) {
  return (
    <div role="rowgroup">
      {headerGroups.map((headerGroup, groupIndex) => (
        <div key={headerGroup.id} role="row" aria-rowindex={groupIndex + 1} className={styles.headerRow}>
          {headerGroup.headers.map((header, columnIndex) => (
            <div
              key={header.id}
              role="columnheader"
              aria-colspan={header.colSpan > 1 ? header.colSpan : undefined}
              className={columnIndex === 0 ? styles.treeHeader : styles.header}
              style={header.colSpan > 1 ? { gridColumn: `span ${header.colSpan}` } : undefined}
              data-align={header.column.columnDef.meta?.align ?? 'start'}
            >
              {header.isPlaceholder ? null : <FlexRender header={header} />}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
