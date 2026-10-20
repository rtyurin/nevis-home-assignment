import type { ClientNode, ClientsData } from '@/entities/client';
import { useDrilldown } from './drilldownStore';

/** The node the drill-down is scoped to (the root until something is selected). */
export function useSelectedNode({ index, root }: ClientsData): ClientNode {
  const selectedId = useDrilldown((state) => state.selectedId);
  return (selectedId !== null ? index.get(selectedId)?.node : undefined) ?? root;
}
