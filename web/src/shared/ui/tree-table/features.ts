import {
  createColumnHelper,
  createExpandedRowModel,
  rowExpandingFeature,
  tableFeatures,
  type ColumnDef,
  type RowData,
} from '@tanstack/react-table';

export interface TreeTableColumnMeta {
  align?: 'start' | 'end';
  /** Minimum track width in px. Below the sum of these, the table scrolls horizontally. */
  minWidth?: number;
  /** Share of the leftover width this column takes (CSS `fr`). */
  grow?: number;
}

/** The TanStack Table features every TreeTable runs with. */
export const treeTableFeatures = tableFeatures({
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
  columnMeta: {} as TreeTableColumnMeta,
});

export type TreeTableFeatures = typeof treeTableFeatures;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- columns of different value types share one array, as in TanStack's own examples
export type TreeTableColumn<TData extends RowData> = ColumnDef<TreeTableFeatures, TData, any>;

/** Typed column helper for TreeTable columns (meta is `TreeTableColumnMeta`). */
export function createTreeTableColumnHelper<TData extends RowData>() {
  return createColumnHelper<TreeTableFeatures, TData>();
}

/** Which rows are expanded, by row id. */
export type TreeExpandedState = Record<string, boolean>;
