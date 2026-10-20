import type { TreeExpandedState } from './features';

/** A row's parent id; undefined for a root. */
export type ParentOf = (id: string) => string | undefined;

/** `id` or its nearest ancestor that `accept` takes. */
export function closest(
  id: string | null | undefined,
  parentOf: ParentOf,
  accept: (id: string) => boolean,
): string | null {
  for (let current = id ?? undefined; current !== undefined; current = parentOf(current)) {
    if (accept(current)) return current;
  }
  return null;
}

export interface RowChange {
  /** Each new row, mapped to its nearest ancestor that was already visible (null if none). */
  revealed: ReadonlyMap<string, string | null>;
  isGrowing: boolean;
}

export const NO_ROWS_REVEALED: RowChange['revealed'] = new Map();

export function diffRows(
  previous: readonly { id: string }[],
  next: readonly { id: string }[],
  parentOf: ParentOf,
): RowChange {
  const before = new Set(previous.map((row) => row.id));
  const wasVisible = (id: string) => before.has(id);
  const revealed = new Map<string, string | null>();
  for (const { id } of next) {
    if (!wasVisible(id)) revealed.set(id, closest(parentOf(id), parentOf, wasVisible));
  }
  return { revealed, isGrowing: next.length > previous.length };
}

export function expandAll(rows: readonly { id: string; getCanExpand: () => boolean }[]): TreeExpandedState {
  return Object.fromEntries(rows.filter((row) => row.getCanExpand()).map((row) => [row.id, true]));
}
