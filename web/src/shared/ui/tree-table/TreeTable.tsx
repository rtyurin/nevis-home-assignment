import { functionalUpdate, useTable, type ExpandedState, type RowData, type Updater } from '@tanstack/react-table';
import { defaultRangeExtractor, useWindowVirtualizer } from '@tanstack/react-virtual';
import { AnimatePresence, domAnimation, LazyMotion, m } from 'motion/react';
import { useMemo, useState } from 'react';
import { columnLayoutStyle } from './columnLayout';
import { treeTableFeatures, type TreeExpandedState, type TreeTableColumn } from './features';
import { closest, expandAll, type ParentOf } from './rows';
import { TreeTableHeader } from './TreeTableHeader';
import { TreeTableRow } from './TreeTableRow';
import { useDocumentOffsetTop } from './useDocumentOffsetTop';
import { useRowInteractions } from './useRowInteractions';
import { ROW_TRANSITION, useRowMotion } from './useRowMotion';
import styles from './TreeTable.module.css';

export interface TreeTableProps<TData extends RowData> {
  /** Root items. Children come from `getSubRows`; depth can vary. */
  data: readonly TData[];
  /**
   * The first column is the tree column, with the expand toggle and indentation.
   * Keep cells free of focusable controls: rows are the focus targets.
   */
  columns: TreeTableColumn<TData>[];
  getRowId: (item: TData) => string;
  getSubRows: (item: TData) => readonly TData[] | undefined;
  expanded: TreeExpandedState;
  onExpandedChange: (expanded: TreeExpandedState) => void;
  /** The focused row, marked `aria-selected`. Selection follows focus. */
  activeRowId?: string | null;
  onActiveRowChange?: (id: string) => void;
  /** Fixed height in px of every row, header included. */
  rowHeight?: number;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

/**
 * An expandable, window-virtualized table: the WAI-ARIA treegrid pattern in row focus mode.
 *
 * Keys: ↑/↓, PageUp/PageDown and Home/End move between rows; → expands or moves to the
 * first child; ← collapses or moves to the parent; Enter/Space toggle; * expands all siblings.
 */
export function TreeTable<TData extends RowData>({
  data,
  columns,
  getRowId,
  getSubRows,
  expanded,
  onExpandedChange,
  activeRowId = null,
  onActiveRowChange,
  rowHeight = 56,
  ...labelProps
}: TreeTableProps<TData>) {
  // The compiler would cache reads of the (mutable) window virtualizer and render stale rows.
  'use no memo';

  const table = useTable({
    features: treeTableFeatures,
    data: data as TData[],
    columns,
    getRowId,
    getSubRows,
    state: { expanded },
    onExpandedChange: (updater: Updater<ExpandedState>) => {
      const next = functionalUpdate(updater, expanded);
      onExpandedChange(next === true ? expandAll(table.getCoreRowModel().flatRows) : next);
    },
  });

  const rows = table.getRowModel().rows;
  const { rows: rootRows, rowsById } = table.getCoreRowModel();
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- TanStack replaces `rows`, never mutates it
  const indexById = useMemo(() => new Map(rows.map((row, index) => [row.id, index])), [rows]);
  const parentOf: ParentOf = (id) => rowsById[id]?.parentId;
  const headerGroups = table.getHeaderGroups();
  const leafColumns = table.getAllLeafColumns();

  // Roving tabindex: the active row, or its nearest visible ancestor.
  const tabbableId = closest(activeRowId, parentOf, (id) => indexById.has(id)) ?? rows[0]?.id ?? null;
  const tabbableIndex = tabbableId === null ? -1 : (indexById.get(tabbableId) ?? -1);

  const [body, setBody] = useState<HTMLDivElement | null>(null);
  const scrollMargin = useDocumentOffsetTop(body);
  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => rowHeight,
    overscan: 6,
    scrollMargin,
    getItemKey: (index) => rows[index]?.id ?? index,
    // Keep the tabbable row mounted, so focus survives scrolling.
    rangeExtractor: (range) => {
      const indexes = defaultRangeExtractor(range);
      if (tabbableIndex >= 0 && !indexes.includes(tabbableIndex)) {
        indexes.push(tabbableIndex);
        indexes.sort((a, b) => a - b);
      }
      return indexes;
    },
  });

  const { enterFrom, exitTarget, isGrowing } = useRowMotion({ rows, indexById, parentOf, rowHeight });
  const handlers = useRowInteractions({
    rows,
    rootRows,
    indexById,
    body,
    rowHeight,
    scrollToIndex: (index) => virtualizer.scrollToIndex(index),
    activeRowId,
    onActiveRowChange,
    expanded,
    onExpandedChange,
  });

  return (
    <LazyMotion features={domAnimation} strict>
      <div className={styles.scroller}>
        <div
          role="treegrid"
          aria-rowcount={headerGroups.length + rows.length}
          aria-colcount={leafColumns.length}
          className={styles.grid}
          style={columnLayoutStyle(leafColumns, rowHeight)}
          {...handlers}
          {...labelProps}
        >
          <TreeTableHeader headerGroups={headerGroups} />
          <m.div
            ref={setBody}
            role="rowgroup"
            className={styles.body}
            initial={false}
            animate={{ height: rows.length * rowHeight }}
            // Grow at once so sliding rows aren't clipped; shrink along with them.
            transition={isGrowing ? { duration: 0 } : ROW_TRANSITION}
          >
            <AnimatePresence initial={false} custom={exitTarget}>
              {virtualizer.getVirtualItems().map(({ index }) => {
                const row = rows[index];
                if (!row) return null;
                return (
                  <TreeTableRow
                    key={row.id}
                    row={row}
                    cells={row.getAllCells()}
                    rowIndex={headerGroups.length + index + 1}
                    setSize={(row.getParentRow()?.subRows ?? rootRows).length}
                    y={index * rowHeight}
                    enterFrom={enterFrom(row.id)}
                    canExpand={row.getCanExpand()}
                    isExpanded={row.getIsExpanded()}
                    isTabbable={row.id === tabbableId}
                    isSelected={onActiveRowChange ? row.id === activeRowId : undefined}
                    isLast={index === rows.length - 1}
                  />
                );
              })}
            </AnimatePresence>
          </m.div>
        </div>
      </div>
    </LazyMotion>
  );
}
