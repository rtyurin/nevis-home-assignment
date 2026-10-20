import { ClientName, type ClientNode } from '@/entities/client';
import { formatMonth, formatNumber } from '@/shared/lib';
import { createTreeTableColumnHelper, type TreeTableColumn } from '@/shared/ui/tree-table';

const column = createTreeTableColumnHelper<ClientNode>();

/** Name column, then one right-aligned column per month. */
export function clientColumns(months: readonly string[]): TreeTableColumn<ClientNode>[] {
  return [
    column.accessor('name', {
      header: () => <span className="sr-only">Name</span>,
      cell: ({ row }) => <ClientName node={row.original} />,
      meta: { minWidth: 240, grow: 3 },
    }),
    ...months.map((month, i) =>
      column.accessor((node) => node.values[i] ?? 0, {
        id: month,
        header: formatMonth(month),
        cell: ({ getValue }) => formatNumber(getValue()),
        meta: { align: 'end', minWidth: 84 },
      }),
    ),
  ];
}
