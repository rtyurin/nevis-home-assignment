import { useMemo, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { buildParentMap, flattenVisible, type TreeItem, type VisibleRow } from './treeUtils';
import styles from './TreeTable.module.css';

export interface TreeTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (item: T) => ReactNode;
  align?: 'start' | 'end';
}

export interface TreeTableProps<T extends TreeItem<T>> {
  /** Root items. Any item may have `children`; depth does not need to be uniform. */
  items: readonly T[];
  /** The tree column: holds the expand affordance and indentation. */
  nameColumn: { header: ReactNode; cell: (item: T) => ReactNode };
  columns: readonly TreeTableColumn<T>[];
  expandedIds: ReadonlySet<string>;
  onExpandedChange: (id: string, expanded: boolean) => void;
  /**
   * The row that holds keyboard focus and is marked `aria-selected`.
   * Selection follows focus; pass `onActiveChange` to react to it.
   */
  activeId?: string | null;
  onActiveChange?: (id: string) => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

/**
 * An expandable table following the WAI-ARIA treegrid pattern (row focus mode).
 *
 * Keyboard: ↑/↓ move between rows, Home/End jump to the first/last row,
 * → expands a row or moves to its first child, ← collapses a row or moves to
 * its parent, Enter/Space toggle. Only one row is in the tab order.
 */
export function TreeTable<T extends TreeItem<T>>({
  items,
  nameColumn,
  columns,
  expandedIds,
  onExpandedChange,
  activeId = null,
  onActiveChange,
  ...labelProps
}: TreeTableProps<T>) {
  const rows = useMemo(() => flattenVisible(items, expandedIds), [items, expandedIds]);
  const parents = useMemo(() => buildParentMap(items), [items]);
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());

  // Roving tabindex: the active row, or its nearest visible ancestor if it is collapsed away.
  const tabbableId = useMemo(() => {
    const visible = new Set(rows.map((row) => row.item.id));
    let id = activeId;
    while (id !== null && !visible.has(id)) id = parents.get(id) ?? null;
    return id ?? rows[0]?.item.id ?? null;
  }, [rows, parents, activeId]);

  const focusRow = (row: VisibleRow<T> | undefined) => {
    if (row) rowRefs.current.get(row.item.id)?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, index: number) => {
    const row = rows[index];
    if (!row || event.target !== event.currentTarget) return;
    const { id } = row.item;

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
        if (row.hasChildren && !row.expanded) onExpandedChange(id, true);
        else if (row.expanded) focusRow(rows[index + 1]);
        break;
      case 'ArrowLeft':
        if (row.expanded) onExpandedChange(id, false);
        else if (row.parentId) focusRow(rows.find((r) => r.item.id === row.parentId));
        break;
      case 'Enter':
      case ' ':
        if (row.hasChildren) onExpandedChange(id, !row.expanded);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  return (
    <div className={styles.scroller}>
      {/* A native table upgraded to a treegrid, as in the WAI-ARIA APG treegrid example. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role */}
      <table role="treegrid" className={styles.table} {...labelProps}>
        <thead>
          <tr role="row">
            <th role="columnheader" scope="col" className={styles.nameHeader}>
              {nameColumn.header}
            </th>
            {columns.map((column) => (
              <th
                key={column.id}
                role="columnheader"
                scope="col"
                className={styles.header}
                data-align={column.align ?? 'start'}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const { id } = row.item;
            return (
              <tr
                key={id}
                ref={(element) => {
                  if (!element) return;
                  rowRefs.current.set(id, element);
                  return () => {
                    rowRefs.current.delete(id);
                  };
                }}
                role="row"
                className={styles.row}
                tabIndex={id === tabbableId ? 0 : -1}
                aria-level={row.level}
                aria-posinset={row.posInSet}
                aria-setsize={row.setSize}
                aria-expanded={row.hasChildren ? row.expanded : undefined}
                aria-selected={onActiveChange ? id === activeId : undefined}
                data-id={id}
                onFocus={(event) => {
                  if (event.target === event.currentTarget && id !== activeId) onActiveChange?.(id);
                }}
                // Focus (and so selection) is deferred from mousedown to click: if selecting
                // changes layout above the table, the row must not move between press and release.
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  event.currentTarget.focus({ focusVisible: false } as FocusOptions);
                  if (row.hasChildren) onExpandedChange(id, !row.expanded);
                }}
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                <th
                  role="rowheader"
                  scope="row"
                  className={styles.nameCell}
                  style={{ '--tree-level': row.level } as CSSProperties}
                >
                  <span className={styles.nameInner}>
                    <span className={styles.toggle} aria-hidden="true" data-expanded={row.expanded}>
                      {row.hasChildren && <Chevron />}
                    </span>
                    {nameColumn.cell(row.item)}
                  </span>
                </th>
                {columns.map((column) => (
                  <td
                    key={column.id}
                    role="gridcell"
                    className={styles.cell}
                    data-align={column.align ?? 'start'}
                  >
                    {column.cell(row.item)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
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
