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

export interface ClientsData {
  /** `YYYY-MM` for each index of every node's `values`. */
  months: readonly string[];
  root: ClientNode;
  index: ClientIndex;
}

export interface ClientIndexEntry {
  node: ClientNode;
  parentId: string | null;
}

export type ClientIndex = ReadonlyMap<string, ClientIndexEntry>;

export function indexTree(root: ClientNode): ClientIndex {
  const index = new Map<string, ClientIndexEntry>();
  const visit = (node: ClientNode, parentId: string | null) => {
    index.set(node.id, { node, parentId });
    node.children.forEach((child) => visit(child, node.id));
  };
  visit(root, null);
  return index;
}

/** Root-first list of nodes from the root down to `id` (inclusive). */
export function pathTo(index: ClientIndex, id: string): ClientNode[] {
  const path: ClientNode[] = [];
  let entry = index.get(id);
  while (entry) {
    path.unshift(entry.node);
    entry = entry.parentId === null ? undefined : index.get(entry.parentId);
  }
  return path;
}
