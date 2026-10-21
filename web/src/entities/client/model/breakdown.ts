import type { ClientNode, ClientNodeKind } from './types';

export const UNATTRIBUTED_NAME = 'Not broken down';

export interface BreakdownSeries {
  id: string;
  name: string;
  /** `null`: no data for that month. */
  values: readonly (number | null)[];
  /** `unattributed`: the part of the total that no child accounts for. */
  kind: 'child' | 'other' | 'unattributed';
}

export interface Mismatch {
  monthIndex: number;
  reported: number;
  breakdownSum: number;
}

export interface Breakdown {
  /** What the stack is split by, e.g. "branch". `null` for a leaf node. */
  dimension: string | null;
  series: BreakdownSeries[];
  /** The node's own reported figures; the bar totals in the chart. */
  totals: readonly (number | null)[];
  /** Months where the children don't add up to the node's reported total. */
  mismatches: Mismatch[];
}

export interface BreakdownOptions {
  /** Children beyond this many are folded into one "Other (n)" series. */
  maxSeries?: number;
}

const DIMENSION_BY_CHILD_KIND: Record<ClientNodeKind, string> = {
  company: 'company',
  branch: 'branch',
  employee: 'advisor',
  channel: 'channel',
};

/** Sum of the figures there are for month `i`; `null` when none of `nodes` has one. */
function sumAt(nodes: readonly { values: readonly (number | null)[] }[], i: number): number | null {
  let total: number | null = null;
  for (const node of nodes) {
    const value = node.values[i];
    if (value != null) total = (total ?? 0) + value;
  }
  return total;
}

/**
 * Splits a node's monthly totals into one series per direct child (a leaf is its own series).
 * A shortfall against the reported total becomes an `unattributed` series; shortfalls and
 * excesses are both listed in `mismatches`. Months with no reported figure never mismatch.
 */
export function getBreakdown(node: ClientNode, { maxSeries = 5 }: BreakdownOptions = {}): Breakdown {
  const totals = node.values;

  if (node.children.length === 0) {
    return {
      dimension: null,
      series: [{ id: node.id, name: node.name, values: node.values, kind: 'child' }],
      totals,
      mismatches: [],
    };
  }

  const series = foldIntoOther(node, maxSeries);

  const mismatches: Mismatch[] = [];
  const shortfall = totals.map((reported, i) => {
    if (reported === null) return null;
    const breakdownSum = sumAt(node.children, i) ?? 0;
    if (breakdownSum !== reported) mismatches.push({ monthIndex: i, reported, breakdownSum });
    return Math.max(0, reported - breakdownSum);
  });

  if (shortfall.some((value) => (value ?? 0) > 0)) {
    series.push({ id: `${node.id}:unattributed`, name: UNATTRIBUTED_NAME, values: shortfall, kind: 'unattributed' });
  }

  const childKind = node.children[0]?.kind;
  return {
    dimension: childKind ? DIMENSION_BY_CHILD_KIND[childKind] : null,
    series,
    totals,
    mismatches,
  };
}

function foldIntoOther(node: ClientNode, maxSeries: number): BreakdownSeries[] {
  const children: BreakdownSeries[] = node.children.map(({ id, name, values }) => ({
    id,
    name,
    values,
    kind: 'child',
  }));
  if (children.length <= maxSeries) return children;

  const rest = children.slice(maxSeries - 1);
  return [
    ...children.slice(0, maxSeries - 1),
    {
      id: `${node.id}:other`,
      name: `Other (${rest.length})`,
      values: node.values.map((_, i) => sumAt(rest, i)),
      kind: 'other',
    },
  ];
}
