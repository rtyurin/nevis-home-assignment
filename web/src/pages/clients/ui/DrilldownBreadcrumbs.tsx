import { pathTo, type ClientsData } from '@/entities/client';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { useDrilldown } from '../model/drilldownStore';
import { useSelectedNode } from '../model/useSelectedNode';

/** Root-to-selection trail; picking an ancestor moves the drill-down back up. */
export function DrilldownBreadcrumbs({ data, label }: { data: ClientsData; label: string }) {
  const node = useSelectedNode(data);
  const select = useDrilldown((state) => state.select);
  return (
    <Breadcrumbs
      aria-label={label}
      items={pathTo(data.index, node.id).map(({ id, name }) => ({ id, label: name }))}
      onSelect={select}
    />
  );
}
