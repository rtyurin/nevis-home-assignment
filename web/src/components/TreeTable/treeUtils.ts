export interface TreeItem<T> {
  id: string;
  children?: readonly T[];
}

export interface VisibleRow<T> {
  item: T;
  /** 1-based depth, as exposed through `aria-level`. */
  level: number;
  /** 1-based position among siblings, as exposed through `aria-posinset`. */
  posInSet: number;
  setSize: number;
  parentId: string | null;
  hasChildren: boolean;
  expanded: boolean;
}

/** Depth-first list of the rows that are currently visible (every ancestor expanded). */
export function flattenVisible<T extends TreeItem<T>>(
  items: readonly T[],
  expandedIds: ReadonlySet<string>,
): VisibleRow<T>[] {
  const rows: VisibleRow<T>[] = [];
  const visit = (siblings: readonly T[], level: number, parentId: string | null) => {
    siblings.forEach((item, index) => {
      const hasChildren = (item.children?.length ?? 0) > 0;
      const expanded = hasChildren && expandedIds.has(item.id);
      rows.push({
        item,
        level,
        posInSet: index + 1,
        setSize: siblings.length,
        parentId,
        hasChildren,
        expanded,
      });
      if (expanded) visit(item.children ?? [], level + 1, item.id);
    });
  };
  visit(items, 1, null);
  return rows;
}

export function buildParentMap<T extends TreeItem<T>>(items: readonly T[]): Map<string, string | null> {
  const parents = new Map<string, string | null>();
  const visit = (siblings: readonly T[], parentId: string | null) => {
    for (const item of siblings) {
      parents.set(item.id, parentId);
      visit(item.children ?? [], item.id);
    }
  };
  visit(items, null);
  return parents;
}
