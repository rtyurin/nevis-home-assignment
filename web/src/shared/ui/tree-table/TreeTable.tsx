import {
  functionalUpdate,
  useTable,
  type ExpandedState,
  type Row,
  type RowData,
  type Updater,
} from '@tanstack/react-table';
import { defaultRangeExtractor, useWindowVirtualizer } from '@tanstack/react-virtual';
import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { columnLayoutStyle } from './columnLayout';
import { treeTableFeatures, type TreeExpandedState, type TreeTableColumn, type TreeTableFeatures } from './features';
import { useDocumentOffsetTop } from './useDocumentOffsetTop';
import styles from './TreeTable.module.css';

type TreeRow<TData extends RowData> = Row<TreeTableFeatures, TData>;

export interface TreeTableProps<TData extends RowData> {
  /** Root items. Children come from `getSubRows`; depth does not need to be uniform. */
  data: readonly TData[];
  /** The first column is the tree column: it gets the expand affordance and indentation. */
  columns: TreeTableColumn<TData>[];
  getRowId: (item: TData) => string;
  getSubRows: (item: TData) => readonly TData[] | undefined;
  expanded: TreeExpandedState;
  onExpandedChange: (expanded: TreeExpandedState) => void;
  /**
   * The row that holds keyboard focus and is marked `aria-selected`.
   * Selection follows focus; pass `onActiveRowChange` to react to it.
   */
  activeRowId?: string | null;
  onActiveRowChange?: (id: string) => void;
  /** Fixed row height in px; rows are virtualized at this size. */
  rowHeight?: number;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const ROW_TRANSITION: Transition = { duration: 0.28, ease: [0.4, 0, 0.2, 1] };

/**
 * An expandable, virtualized table following the WAI-ARIA treegrid pattern (row focus mode).
 *
 * Built on TanStack Table (row model, expansion), TanStack Virtual (window
 * virtualization) and Motion (rows slide out from under their parent on expand,
 * and back on collapse).
 *
 * Keyboard: ↑/↓ move between rows, Home/End jump to the first/last row,
 * → expands a row or moves to its first child, ← collapses a row or moves to
 * its parent, Enter/Space toggle. Only one row is in the tab order.
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
  // Opt out of React Compiler: the virtualizer is one mutable object whose identity never
  // changes, so memoizing on it caches stale reads (e.g. virtual items). The compiler skips
  // `useVirtualizer` automatically, but does not recognise `useWindowVirtualizer`.
  'use no memo';

  const table = useTable({
    features: treeTableFeatures,
    data: data as TData[],
    columns,
    getRowId: (item) => getRowId(item),
    getSubRows: (item) => getSubRows(item),
    state: { expanded },
    onExpandedChange: (updater: Updater<ExpandedState>) => {
      const next = functionalUpdate(updater, expanded);
      onExpandedChange(next === true ? expandAll(table.getCoreRowModel().flatRows) : next);
    },
  });

  const rows = table.getRowModel().rows;
  const indexById = new Map(rows.map((row, index) => [row.id, index]));
  const allRowsById = table.getCoreRowModel().rowsById;
  const rootCount = table.getCoreRowModel().rows.length;

  // Roving tabindex: the active row, or its nearest visible ancestor if it is collapsed away.
  const tabbableId = nearestVisible(activeRowId, allRowsById, indexById) ?? rows[0]?.id ?? null;
  const tabbableIndex = tabbableId === null ? -1 : (indexById.get(tabbableId) ?? -1);

  const [body, setBody] = useState<HTMLDivElement | null>(null);
  const scrollMargin = useDocumentOffsetTop(body);
  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => rowHeight,
    overscan: 6,
    scrollMargin,
    getItemKey: (index) => rows[index]?.id ?? index,
    // Keep the focusable row mounted while it is scrolled away, so focus is never lost.
    rangeExtractor: (range) => {
      const indexes = defaultRangeExtractor(range);
      if (tabbableIndex >= 0 && !indexes.includes(tabbableIndex)) {
        indexes.push(tabbableIndex);
        indexes.sort((a, b) => a - b);
      }
      return indexes;
    },
  });

  // Rows that just appeared because something expanded animate in; rows that
  // mount because they scrolled into view must not.
  const rowKey = rows.map((row) => row.id).join('\u0000');
  const [previousRowKey, setPreviousRowKey] = useState(rowKey);
  const [revealedIds, setRevealedIds] = useState<ReadonlySet<string>>(new Set());
  const [isGrowing, setIsGrowing] = useState(false);
  if (rowKey !== previousRowKey) {
    const previous = new Set(previousRowKey.split('\u0000'));
    setRevealedIds(new Set(rows.filter((row) => !previous.has(row.id)).map((row) => row.id)));
    setIsGrowing(rows.length > previous.size);
    setPreviousRowKey(rowKey);
  }
  const visibleIds = new Set(indexById.keys());

  const rowElements = useRef(new Map<string, HTMLDivElement>());
  const pendingFocusId = useRef<string | null>(null);

  const focusRow = (row: TreeRow<TData> | undefined) => {
    if (!row) return;
    const element = rowElements.current.get(row.id);
    if (element) {
      element.focus();
      return;
    }
    // Off-screen: scroll it into the rendered range, then focus it once it mounts.
    pendingFocusId.current = row.id;
    virtualizer.scrollToIndex(indexById.get(row.id) ?? 0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, row: TreeRow<TData>, index: number) => {
    if (event.target !== event.currentTarget) return;
    const canExpand = row.getCanExpand();
    const isExpanded = row.getIsExpanded();

    switch (event.key) {
      case 'ArrowDown':
        focusRow(rows[index + 1]);
        break;
      case 'ArrowUp':
        focusRow(rows[index - 1]);
        break;
      case 'Home':
        focusRow(rows[0]);
        break;
      case 'End':
        focusRow(rows[rows.length - 1]);
        break;
      case 'ArrowRight':
        if (canExpand && !isExpanded) row.toggleExpanded(true);
        else if (isExpanded) focusRow(rows[index + 1]);
        break;
      case 'ArrowLeft':
        if (isExpanded) row.toggleExpanded(false);
        else focusRow(row.getParentRow());
        break;
      case 'Enter':
      case ' ':
        if (canExpand) row.toggleExpanded();
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const leafColumns = table.getAllLeafColumns();

  return (
    <div className={styles.scroller}>
      <div
        role="treegrid"
        aria-rowcount={rows.length + 1}
        aria-colcount={leafColumns.length}
        className={styles.grid}
        style={columnLayoutStyle(leafColumns, rowHeight)}
        {...labelProps}
      >
        <div role="rowgroup">
          {table.getHeaderGroups().map((headerGroup) => (
            <div key={headerGroup.id} role="row" aria-rowindex={1} className={styles.headerRow}>
              {headerGroup.headers.map((header, columnIndex) => (
                <div
                  key={header.id}
                  role="columnheader"
                  className={columnIndex === 0 ? styles.treeHeader : styles.header}
                  data-align={header.column.columnDef.meta?.align ?? 'start'}
                >
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </div>
              ))}
            </div>
          ))}
        </div>

        <motion.div
          ref={setBody}
          role="rowgroup"
          className={styles.body}
          initial={false}
          // Rows have a fixed height, so the body's height is known up front. (The virtualizer's
          // getTotalSize() can briefly lag while it anchors the scroll position.)
          animate={{ height: rows.length * rowHeight }}
          // Grow at once so rows sliding down are never clipped; shrink along with the rows.
          // (Height animates on the main thread, rows on the compositor, so they can't be kept in lockstep.)
          transition={isGrowing ? { duration: 0 } : ROW_TRANSITION}
        >
          <AnimatePresence initial={false} custom={visibleIds}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              if (!row) return null;
              const { id } = row;
              const parent = row.getParentRow();
              const y = virtualRow.start - scrollMargin;
              const parentY = parent ? (indexById.get(parent.id) ?? 0) * rowHeight : y;
              const canExpand = row.getCanExpand();
              const isExpanded = row.getIsExpanded();
              const [treeCell, ...cells] = row.getAllCells();

              return (
                <motion.div
                  key={id}
                  ref={(element: HTMLDivElement | null) => {
                    if (!element) return;
                    rowElements.current.set(id, element);
                    if (pendingFocusId.current === id) {
                      pendingFocusId.current = null;
                      element.focus();
                    }
                    return () => {
                      rowElements.current.delete(id);
                    };
                  }}
                  role="row"
                  className={styles.row}
                  style={{ zIndex: 100 - row.depth }}
                  custom={visibleIds}
                  variants={{
                    // Collapsed away: slide back under the parent. Merely scrolled away: leave at once.
                    exit: (stillVisible: ReadonlySet<string>) =>
                      stillVisible.has(id) ? { opacity: 1, transition: { duration: 0 } } : { y: parentY, opacity: 0 },
                  }}
                  initial={revealedIds.has(id) ? { y: parentY, opacity: 0 } : false}
                  animate={{ y, opacity: 1 }}
                  exit="exit"
                  transition={ROW_TRANSITION}
                  tabIndex={id === tabbableId ? 0 : -1}
                  aria-rowindex={virtualRow.index + 2}
                  aria-level={row.depth + 1}
                  aria-posinset={row.index + 1}
                  aria-setsize={parent ? parent.subRows.length : rootCount}
                  aria-expanded={canExpand ? isExpanded : undefined}
                  aria-selected={onActiveRowChange ? id === activeRowId : undefined}
                  data-id={id}
                  onFocus={(event) => {
                    if (event.target === event.currentTarget && id !== activeRowId) onActiveRowChange?.(id);
                  }}
                  // Focus (and so selection) is deferred from mousedown to click: if selecting
                  // changes layout above the table, the row must not move between press and release.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={(event) => {
                    event.currentTarget.focus({ focusVisible: false } as FocusOptions);
                    if (canExpand) row.toggleExpanded();
                  }}
                  onKeyDown={(event) => handleKeyDown(event, row, virtualRow.index)}
                >
                  {treeCell && (
                    <div
                      role="rowheader"
                      className={styles.treeCell}
                      style={{ '--tree-depth': row.depth } as CSSProperties}
                    >
                      <motion.span
                        className={styles.toggle}
                        aria-hidden="true"
                        initial={false}
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={ROW_TRANSITION}
                      >
                        {canExpand && <Chevron />}
                      </motion.span>
                      <table.FlexRender cell={treeCell} />
                    </div>
                  )}
                  {cells.map((cell) => (
                    <div
                      key={cell.id}
                      role="gridcell"
                      className={styles.cell}
                      data-align={cell.column.columnDef.meta?.align ?? 'start'}
                    >
                      <table.FlexRender cell={cell} />
                    </div>
                  ))}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

function nearestVisible<TData extends RowData>(
  id: string | null,
  allRowsById: Record<string, TreeRow<TData>>,
  visible: ReadonlyMap<string, number>,
): string | null {
  let row = id === null ? undefined : allRowsById[id];
  while (row && !visible.has(row.id)) row = row.getParentRow();
  return row?.id ?? null;
}

function expandAll<TData extends RowData>(rows: TreeRow<TData>[]): TreeExpandedState {
  return Object.fromEntries(rows.filter((row) => row.getCanExpand()).map((row) => [row.id, true]));
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M6 3.5 10.5 8 6 12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
