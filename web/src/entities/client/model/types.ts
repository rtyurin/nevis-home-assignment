export type ClientNodeKind = 'company' | 'branch' | 'employee' | 'channel';

/**
 * The client tree normalised to one shape. The API nests levels under different
 * keys (`branches`, `employees`, `channels`) and omits them when empty; the UI
 * only cares about `children`, with `kind` recording the level.
 */
export interface ClientNode {
  id: string;
  name: string;
  kind: ClientNodeKind;
  /** Client count per month, aligned with `ClientsData.months`. */
  values: readonly number[];
  children: readonly ClientNode[];
}

export interface ClientIndexEntry {
  node: ClientNode;
  parentId: string | null;
}

export type ClientIndex = ReadonlyMap<string, ClientIndexEntry>;

export interface ClientsData {
  /** `YYYY-MM` for each index of every node's `values`. */
  months: readonly string[];
  root: ClientNode;
  index: ClientIndex;
}
