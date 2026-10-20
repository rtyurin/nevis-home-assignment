import type { Transition } from 'motion/react';
import { useEffect, useState } from 'react';
import { closest, diffRows, NO_ROWS_REVEALED, type ParentOf, type RowChange } from './rows';

export const ROW_TRANSITION: Transition = { duration: 0.28, ease: [0.4, 0, 0.2, 1] };

/** Where a leaving row slides to, or null to remove it at once. */
export type ExitTarget = (id: string) => number | null;

interface Options {
  rows: readonly { id: string }[];
  indexById: ReadonlyMap<string, number>;
  parentOf: ParentOf;
  rowHeight: number;
}

/** Rows slide out from under their nearest visible ancestor on expand, and back on collapse. */
export function useRowMotion({ rows, indexById, parentOf, rowHeight }: Options) {
  const [previousRows, setPreviousRows] = useState(rows);
  const [change, setChange] = useState<RowChange>({ revealed: NO_ROWS_REVEALED, isGrowing: false });
  if (rows !== previousRows) {
    setChange(diffRows(previousRows, rows, parentOf));
    setPreviousRows(rows);
  }

  // Motion reads `initial` only on mount: once the revealed rows have mounted, forget them,
  // so rows scrolled into view later don't slide in.
  useEffect(() => {
    if (change.revealed.size === 0) return;
    const frame = requestAnimationFrame(() => setChange({ revealed: NO_ROWS_REVEALED, isGrowing: change.isGrowing }));
    return () => cancelAnimationFrame(frame);
  }, [change]);

  const yOf = (id: string) => (indexById.get(id) ?? 0) * rowHeight;

  /** Where a just-revealed row slides in from; undefined for any other row. */
  const enterFrom = (id: string) => {
    const anchor = change.revealed.get(id);
    return anchor === undefined ? undefined : yOf(anchor ?? id);
  };

  const exitTarget: ExitTarget = (id) => {
    const anchor = closest(id, parentOf, (ancestor) => indexById.has(ancestor));
    // Still in the list: it only scrolled out of range.
    return anchor === null || anchor === id ? null : yOf(anchor);
  };

  return { enterFrom, exitTarget, isGrowing: change.isGrowing };
}
