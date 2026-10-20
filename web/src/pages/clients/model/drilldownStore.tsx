import { createContext, use, useState, type ReactNode } from 'react';
import { createStore, useStore, type StoreApi } from 'zustand';

/**
 * Drill-down state shared by the chart and the table: which rows are expanded,
 * and which node the chart is scoped to. One store per provider (not a module
 * singleton), so each mounted dashboard, and each test, starts fresh.
 */
export interface DrilldownState {
  /** Expanded row ids. */
  expanded: Record<string, boolean>;
  /** Node the chart breaks down; `null` means the root. */
  selectedId: string | null;
  setExpanded: (expanded: Record<string, boolean>) => void;
  select: (id: string | null) => void;
}

export interface DrilldownInit {
  expandedIds?: readonly string[];
  selectedId?: string | null;
}

export function createDrilldownStore({
  expandedIds = [],
  selectedId = null,
}: DrilldownInit = {}): StoreApi<DrilldownState> {
  return createStore<DrilldownState>()((set) => ({
    expanded: Object.fromEntries(expandedIds.map((id) => [id, true])),
    selectedId,
    setExpanded: (expanded) => set({ expanded }),
    select: (id) => set({ selectedId: id }),
  }));
}

const DrilldownContext = createContext<StoreApi<DrilldownState> | null>(null);

export function DrilldownProvider({ init, children }: { init?: DrilldownInit; children: ReactNode }) {
  const [store] = useState(() => createDrilldownStore(init));
  return <DrilldownContext value={store}>{children}</DrilldownContext>;
}

export function useDrilldown<T>(selector: (state: DrilldownState) => T): T {
  const store = use(DrilldownContext);
  if (!store) throw new Error('useDrilldown must be used inside <DrilldownProvider>');
  return useStore(store, selector);
}
