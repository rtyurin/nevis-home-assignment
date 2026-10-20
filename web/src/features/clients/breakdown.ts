import type { ClientNode, ClientNodeKind } from './model';

/** Categorical chart slots in fixed order (see --series-* in global.css). */
export const SERIES_COLORS = [
  'var(--series-1)',
  'var(--series-2)',
  'var(--series-3)',
  'var(--series-4)',
  'var(--series-5)',
] as const;
export const UNATTRIBUTED_COLOR = 'var(--series-unattributed)';
export const UNATTRIBUTED_NAME = 'Not broken down';

export interface BreakdownSeries {
  id: string;
  name: string;
  values: number[];
  color: string;
  pattern?: 'hatch';
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
  totals: readonly number[];
  /** Months where the children don't add up to the node's reported total. */
  mismatches: Mismatch[];
}

const DIMENSION_BY_CHILD_KIND: Record<ClientNodeKind, string> = {
  company: 'company',
  branch: 'branch',
  employee: 'advisor',
  channel: 'channel',
};

const sumAt = (nodes: readonly { values: readonly number[] }[], i: number) =>
  nodes.reduce((total, node) => total + (node.values[i] ?? 0), 0);

/**
 * Maps a node to the stacked series the chart draws for it: one series per
 * direct child, so the bar for each month splits the node's total by the level
 * beneath it. A leaf node is a single series of its own values.
 *
 * The children don't always add up to the node's reported total. Where they fall
 * short, the remainder is stacked as a hatched "Not broken down" series so the bar
 * still reaches the reported figure. Where they exceed it, the bar shows the
 * breakdown as-is. Both cases are returned in `mismatches`.
 */
export function getBreakdown(node: ClientNode): Breakdown {
  const totals = node.values;

  if (node.children.length === 0) {
    return {
      dimension: null,
      series: [{ id: node.id, name: node.name, values: [...node.values], color: SERIES_COLORS[0] }],
      totals,
      mismatches: [],
    };
  }

  const series: BreakdownSeries[] = foldIntoOther(node).map((child, i) => ({
    ...child,
    color: SERIES_COLORS[i] ?? SERIES_COLORS[0],
  }));

  const mismatches: Mismatch[] = [];
  const shortfall = totals.map((reported, i) => {
    const breakdownSum = sumAt(node.children, i);
    if (breakdownSum !== reported) mismatches.push({ monthIndex: i, reported, breakdownSum });
    return Math.max(0, reported - breakdownSum);
  });

  if (shortfall.some((value) => value > 0)) {
    series.push({
      id: `${node.id}:unattributed`,
      name: UNATTRIBUTED_NAME,
      values: shortfall,
      color: UNATTRIBUTED_COLOR,
      pattern: 'hatch',
    });
  }

  const childKind = node.children[0]?.kind;
  return {
    dimension: childKind ? DIMENSION_BY_CHILD_KIND[childKind] : null,
    series,
    totals,
    mismatches,
  };
}

/** Never generate a 6th hue: beyond the palette, the tail is folded into "Other". */
function foldIntoOther(node: ClientNode): { id: string; name: string; values: number[] }[] {
  const children = node.children.map(({ id, name, values }) => ({ id, name, values: [...values] }));
  if (children.length <= SERIES_COLORS.length) return children;

  const keep = children.slice(0, SERIES_COLORS.length - 1);
  const rest = children.slice(SERIES_COLORS.length - 1);
  return [
    ...keep,
    {
      id: `${node.id}:other`,
      name: `Other (${rest.length})`,
      values: node.values.map((_, i) => sumAt(rest, i)),
    },
  ];
}
