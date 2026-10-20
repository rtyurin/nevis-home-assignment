import { FlexRender, type RowData } from '@tanstack/react-table';
import { motion } from 'motion/react';
import type { CSSProperties } from 'react';
import type { TreeRow } from './features';
import { ROW_TRANSITION, type ExitTarget } from './useRowMotion';
import styles from './TreeTable.module.css';

interface TreeTableRowProps<TData extends RowData> {
  row: TreeRow<TData>;
  /** `row.getAllCells()`: a prop so the row re-renders when the columns change. */
  cells: ReturnType<TreeRow<TData>['getAllCells']>;
  /** 1-based, after the header rows. */
  rowIndex: number;
  setSize: number;
  y: number;
  enterFrom: number | undefined;
  canExpand: boolean;
  isExpanded: boolean;
  isTabbable: boolean;
  isSelected: boolean | undefined;
  isLast: boolean;
}

export function TreeTableRow<TData extends RowData>({
  row,
  cells,
  rowIndex,
  setSize,
  y,
  enterFrom,
  canExpand,
  isExpanded,
  isTabbable,
  isSelected,
  isLast,
}: TreeTableRowProps<TData>) {
  const { id, depth } = row;
  const [treeCell, ...otherCells] = cells;

  return (
    <motion.div
      role="row"
      className={styles.row}
      // Children stack under their parent, so they slide out from beneath it.
      style={{ zIndex: -depth }}
      variants={{
        exit: (exitTarget: ExitTarget) => {
          const target = exitTarget(id);
          return target === null ? { opacity: 1, transition: { duration: 0 } } : { y: target, opacity: 0 };
        },
      }}
      initial={enterFrom === undefined ? false : { y: enterFrom, opacity: 0 }}
      animate={{ y, opacity: 1 }}
      exit="exit"
      transition={ROW_TRANSITION}
      tabIndex={isTabbable ? 0 : -1}
      aria-rowindex={rowIndex}
      aria-level={depth + 1}
      aria-posinset={row.index + 1}
      aria-setsize={setSize}
      aria-expanded={canExpand ? isExpanded : undefined}
      aria-selected={isSelected}
      data-id={id}
      data-last={isLast || undefined}
    >
      {treeCell && (
        <div role="rowheader" className={styles.treeCell} style={{ '--tree-depth': depth } as CSSProperties}>
          <motion.span
            className={styles.toggle}
            aria-hidden="true"
            initial={false}
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={ROW_TRANSITION}
          >
            {canExpand && <Chevron />}
          </motion.span>
          <FlexRender cell={treeCell} />
        </div>
      )}
      {otherCells.map((cell) => (
        <div
          key={cell.id}
          role="gridcell"
          className={styles.cell}
          data-align={cell.column.columnDef.meta?.align ?? 'start'}
        >
          <FlexRender cell={cell} />
        </div>
      ))}
    </motion.div>
  );
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6.5 4.5 10 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}
