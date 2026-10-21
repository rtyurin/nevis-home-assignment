import type { CSSProperties } from 'react';
import type { TreeTableColumnMeta } from './features';

const DEFAULT_MIN_WIDTH = 84;
/** On small screens the tree column gives up width so more value columns fit. */
const TREE_COLUMN_MAX_VW = 50;

/**
 * Rows are absolutely positioned (virtualized and animated), so each is its own CSS grid;
 * sharing one `grid-template-columns` keeps them aligned. Below the columns' summed
 * minimum widths, the table scrolls horizontally.
 */
export function columnLayoutStyle(
  columns: readonly { columnDef: { meta?: TreeTableColumnMeta } }[],
  rowHeight: number,
): CSSProperties {
  const minWidths = columns.map(({ columnDef: { meta } }, index) => {
    const min = `${meta?.minWidth ?? DEFAULT_MIN_WIDTH}px`;
    return index === 0 ? `min(${min}, ${TREE_COLUMN_MAX_VW}vw)` : min;
  });
  const tracks = columns.map(({ columnDef: { meta } }, index) => `minmax(${minWidths[index]}, ${meta?.grow ?? 1}fr)`);

  return {
    '--tree-table-columns': tracks.join(' '),
    '--tree-table-min-width': `calc(${minWidths.join(' + ')})`,
    '--tree-table-row-height': `${rowHeight}px`,
  } as CSSProperties;
}
