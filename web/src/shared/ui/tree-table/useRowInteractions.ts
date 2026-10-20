import type { RowData } from '@tanstack/react-table';
import { useLayoutEffect, useRef, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react';
import type { TreeExpandedState, TreeRow } from './features';
import { expandAll } from './rows';

/** Elements that handle their own clicks; clicking one doesn't toggle its row. */
const CONTROL_SELECTOR = 'a[href], button, input, select, textarea, label, summary, [contenteditable], [tabindex]';

interface Options<TData extends RowData> {
  rows: TreeRow<TData>[];
  rootRows: TreeRow<TData>[];
  indexById: ReadonlyMap<string, number>;
  body: HTMLElement | null;
  rowHeight: number;
  scrollToIndex: (index: number) => void;
  activeRowId: string | null;
  onActiveRowChange?: (id: string) => void;
  expanded: TreeExpandedState;
  onExpandedChange: (expanded: TreeExpandedState) => void;
}

/**
 * Focus, selection, clicks and keys for all rows, as handlers for the grid element
 */
export function useRowInteractions<TData extends RowData>({
  rows,
  rootRows,
  indexById,
  body,
  rowHeight,
  scrollToIndex,
  activeRowId,
  onActiveRowChange,
  expanded,
  onExpandedChange,
}: Options<TData>) {
  // A row focused while off-screen is scrolled into range, then focused once it mounts.
  const pendingFocusId = useRef<string | null>(null);
  useLayoutEffect(() => {
    const id = pendingFocusId.current;
    if (id === null) return;
    if (indexById.has(id)) findRowElement(body, id)?.focus();
    else pendingFocusId.current = null;
  });

  const focusRow = (row: TreeRow<TData> | undefined) => {
    if (!row) return;
    const element = findRowElement(body, row.id);
    if (element) {
      element.focus();
    } else {
      pendingFocusId.current = row.id;
      scrollToIndex(indexById.get(row.id) ?? 0);
    }
  };

  /** The visible row this element is; undefined for anything else, including leaving rows. */
  const rowOf = (element: EventTarget | null) => {
    const id = element instanceof HTMLElement && element.role === 'row' ? element.dataset.id : undefined;
    const index = id === undefined ? undefined : indexById.get(id);
    const row = index === undefined ? undefined : rows[index];
    return row && index !== undefined ? { row, index } : undefined;
  };

  /** The row a pointer event happened in, unless it was on a control inside it. */
  const pointerRow = (target: EventTarget) => {
    if (!(target instanceof Element)) return undefined;
    const element = target.closest<HTMLElement>('[role="row"]');
    const control = target.closest(CONTROL_SELECTOR);
    if (!element || (control && control !== element && element.contains(control))) return undefined;
    const hit = rowOf(element);
    return hit && { ...hit, element };
  };

  const onFocus = (event: FocusEvent<HTMLElement>) => {
    const hit = rowOf(event.target);
    if (!hit) return;
    pendingFocusId.current = null;
    if (hit.row.id !== activeRowId) onActiveRowChange?.(hit.row.id);
  };

  // Focus (and so selection) waits for the click, so the row can't move between press and release.
  const onMouseDown = (event: MouseEvent<HTMLElement>) => {
    if (pointerRow(event.target)) event.preventDefault();
  };

  const onClick = (event: MouseEvent<HTMLElement>) => {
    const hit = pointerRow(event.target);
    if (!hit) return;
    hit.element.focus({ focusVisible: false } as FocusOptions);
    if (hit.row.getCanExpand()) hit.row.toggleExpanded();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const hit = rowOf(event.target);
    if (!hit) return;
    const { row, index } = hit;
    const canExpand = row.getCanExpand();
    const isExpanded = row.getIsExpanded();
    const pageSize = Math.max(1, Math.floor(window.innerHeight / rowHeight) - 1);

    switch (event.key) {
      case 'ArrowDown':
        focusRow(rows[index + 1]);
        break;
      case 'ArrowUp':
        focusRow(rows[index - 1]);
        break;
      case 'PageDown':
        focusRow(rows[Math.min(index + pageSize, rows.length - 1)]);
        break;
      case 'PageUp':
        focusRow(rows[Math.max(index - pageSize, 0)]);
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
      case '*':
        onExpandedChange({ ...expanded, ...expandAll(row.getParentRow()?.subRows ?? rootRows) });
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  return { onFocus, onMouseDown, onClick, onKeyDown };
}

function findRowElement(body: HTMLElement | null, id: string): HTMLElement | undefined {
  return Array.from(body?.children ?? []).find(
    (element): element is HTMLElement => element instanceof HTMLElement && element.dataset.id === id,
  );
}
