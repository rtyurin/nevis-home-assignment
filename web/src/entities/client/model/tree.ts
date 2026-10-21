import type { ClientIndex, ClientIndexEntry, ClientNode } from './types';

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
    path.push(entry.node);
    entry = entry.parentId === null ? undefined : index.get(entry.parentId);
  }
  return path.reverse();
}
