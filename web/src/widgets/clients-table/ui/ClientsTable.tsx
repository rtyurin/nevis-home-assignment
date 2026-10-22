import { useSuspenseQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { clientsQueryOptions } from '@/entities/client';
import { Panel } from '@/shared/ui/panel';
import { TreeTable, type TreeExpandedState } from '@/shared/ui/tree-table';
import { clientColumns } from '../model/columns';

export interface ClientsTableProps {
  expanded: TreeExpandedState;
  onExpandedChange: (expanded: TreeExpandedState) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Month-by-month figures, expandable from the company down to channels. */
export function ClientsTable({ expanded, onExpandedChange, selectedId, onSelect }: ClientsTableProps) {
  const { data } = useSuspenseQuery(clientsQueryOptions());
  const titleId = useId();

  return (
    <Panel flush aria-labelledby={titleId}>
      <h2 id={titleId} className="sr-only">
        Clients by month
      </h2>
      <TreeTable
        aria-labelledby={titleId}
        data={[data.root]}
        columns={clientColumns(data.months)}
        getRowId={(node) => node.id}
        getSubRows={(node) => node.children}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        activeRowId={selectedId}
        onActiveRowChange={onSelect}
      />
    </Panel>
  );
}
