import { useSuspenseQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { clientsQueryOptions } from '@/entities/client';
import { useDrilldown } from '../model/drilldownStore';
import { Panel } from '@/shared/ui/panel';
import { TreeTable } from '@/shared/ui/tree-table';
import { clientColumns } from '../model/columns';

/** Month-by-month figures, expandable from the company down to channels. */
export function ClientsTable() {
  const { data } = useSuspenseQuery(clientsQueryOptions());
  const expanded = useDrilldown((state) => state.expanded);
  const setExpanded = useDrilldown((state) => state.setExpanded);
  const selectedId = useDrilldown((state) => state.selectedId);
  const select = useDrilldown((state) => state.select);
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
