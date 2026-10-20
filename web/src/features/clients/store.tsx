import { createContext, useContext, useState, type ReactNode } from 'react';
import { createStore, useStore, type StoreApi } from 'zustand';

/**
 * UI state for the clients dashboard: which rows are expanded, and which node
 * the chart is scoped to. Kept in a per-dashboard store (rather than a module
 * singleton) so each mounted dashboard, and each test, starts fresh.
 */
export interface ClientsViewState {
  expandedIds: ReadonlySet<string>;
  /** Node the chart breaks down; `null` means the root. */
  selectedId: string | null;
  setExpanded: (id: string, expanded: boolean) => void;
  select: (id: string | null) => void;
}

export interface ClientsViewInit {
  expandedIds?: Iterable<string>;
  selectedId?: string | null;
}

export function createClientsViewStore(init: ClientsViewInit = {}): StoreApi<ClientsViewState> {
  return createStore<ClientsViewState>()((set) => ({
    expandedIds: new Set(init.expandedIds),
    selectedId: init.selectedId ?? null,
    setExpanded: (id, expanded) =>
      set(({ expandedIds }) => {
        if (expandedIds.has(id) === expanded) return {};
        const next = new Set(expandedIds);
        if (expanded) next.add(id);
        else next.delete(id);
        return { expandedIds: next };
      }),
    select: (selectedId) => set({ selectedId }),
  }));
}

const ClientsViewContext = createContext<StoreApi<ClientsViewState> | null>(null);

export function ClientsViewProvider({ init, children }: { init?: ClientsViewInit; children: ReactNode }) {
  const [store] = useState(() => createClientsViewStore(init));
  return <ClientsViewContext.Provider value={store}>{children}</ClientsViewContext.Provider>;
}

export function useClientsView<T>(selector: (state: ClientsViewState) => T): T {
  const store = useContext(ClientsViewContext);
  if (!store) throw new Error('useClientsView must be used inside <ClientsViewProvider>');
  return useStore(store, selector);
}
