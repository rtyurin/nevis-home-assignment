import { useSuspenseQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { clientsQueryOptions } from '@/entities/client';
import { Panel } from '@/shared/ui/panel';
import { TreeTable } from '@/shared/ui/tree-table';
import { clientColumns } from '../../model/columns';
import { useDrilldown } from '../../model/drilldownStore';

/** Month-by-month figures, expandable from the company down to channels. */
export function ClientsTable() {
  const { data } = useSuspenseQuery(clientsQueryOptions());
  const { expanded, setExpanded, selectedId, select } = useDrilldown((state) => state);
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
        onExpandedChange={setExpanded}
        activeRowId={selectedId}
        onActiveRowChange={select}
      />
    </Panel>
  );
}
