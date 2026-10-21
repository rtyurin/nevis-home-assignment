export type ClientNodeKind = 'company' | 'branch' | 'employee' | 'channel';

export interface ClientNode {
  id: string;
  name: string;
  kind: ClientNodeKind;
  /** Client count per month, aligned with `ClientsData.months`. `null`: no data for that month. */
  values: readonly (number | null)[];
  children: readonly ClientNode[];
  /** Advisor photo, where the API has one. */
  avatarUrl?: string;
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
