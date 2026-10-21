import type { ClientNode, ClientsData } from '@/entities/client';
import { useDrilldown } from './drilldownStore';

export function useSelectedNode({ index, root }: ClientsData): ClientNode {
  const selectedId = useDrilldown((state) => state.selectedId);
  return (selectedId !== null ? index.get(selectedId)?.node : undefined) ?? root;
}
