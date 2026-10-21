import { createContext, use, useState, type ReactNode } from 'react';
import { createStore, useStore, type StoreApi } from 'zustand';

export interface DrilldownState {
  expanded: Record<string, boolean>;
  selectedId: string | null;
  setExpanded: (expanded: Record<string, boolean>) => void;
  select: (id: string) => void;
}

const DrilldownContext = createContext<StoreApi<DrilldownState> | null>(null);

export function DrilldownProvider({ rootId, children }: { rootId: string; children: ReactNode }) {
  const [store] = useState(() =>
    createStore<DrilldownState>()((set) => ({
      expanded: { [rootId]: true },
      selectedId: null,
      setExpanded: (expanded) => set({ expanded }),
      select: (selectedId) => set({ selectedId }),
    })),
  );
  return <DrilldownContext value={store}>{children}</DrilldownContext>;
}

export function useDrilldown<T>(selector: (state: DrilldownState) => T): T {
  const store = use(DrilldownContext);
  if (!store) throw new Error('useDrilldown must be used inside <DrilldownProvider>');
  return useStore(store, selector);
}
