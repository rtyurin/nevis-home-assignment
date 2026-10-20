import { useMemo } from 'react';
import { Panel } from '../../../components/Panel';
import { TreeTable, type TreeTableColumn } from '../../../components/TreeTable';
import { formatMonth, formatNumber } from '../../../lib/format';
import { useStableId } from '../../../lib/useStableId';
import type { ClientNode, ClientsData } from '../model';
import { useClientsView } from '../store';
import { ClientName } from './ClientName';

const nameColumn = {
  header: <span className="sr-only">Name</span>,
  cell: (node: ClientNode) => <ClientName node={node} />,
};

export function ClientsTablePanel({ data }: { data: ClientsData }) {
  const expandedIds = useClientsView((state) => state.expandedIds);
  const setExpanded = useClientsView((state) => state.setExpanded);
  const selectedId = useClientsView((state) => state.selectedId);
  const select = useClientsView((state) => state.select);
  const titleId = useStableId('table-title');

  const items = useMemo(() => [data.root], [data.root]);
  const columns = useMemo<TreeTableColumn<ClientNode>[]>(
    () =>
      data.months.map((month, i) => ({
        id: month,
        header: formatMonth(month),
        align: 'end',
        cell: (node) => formatNumber(node.values[i] ?? 0),
      })),
    [data.months],
  );

  return (
    <Panel flush aria-labelledby={titleId}>
      <h2 id={titleId} className="sr-only">
        Clients by month
      </h2>
      <TreeTable
        aria-labelledby={titleId}
        items={items}
        nameColumn={nameColumn}
        columns={columns}
        expandedIds={expandedIds}
        onExpandedChange={setExpanded}
        activeId={selectedId}
        onActiveChange={select}
      />
    </Panel>
  );
}
