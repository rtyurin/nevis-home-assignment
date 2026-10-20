import { describe, expect, it } from 'vitest';
import { nodeByName } from '../../test/fixtures';
import { getBreakdown, SERIES_COLORS, UNATTRIBUTED_NAME } from './breakdown';
import type { ClientNode } from './model';

const sumAt = (series: { values: readonly number[] }[], i: number) =>
  series.reduce((total, s) => total + (s.values[i] ?? 0), 0);

describe('getBreakdown', () => {
  it('splits the company by branch, colouring branches in fixed order', () => {
    const breakdown = getBreakdown(nodeByName('Company'));

    expect(breakdown.dimension).toBe('branch');
    expect(breakdown.totals).toEqual(nodeByName('Company').values);
    expect(breakdown.series.slice(0, 3).map(({ name, color, values }) => ({ name, color, feb: values[0] }))).toEqual([
      { name: 'Branch 1', color: SERIES_COLORS[0], feb: 147 },
      { name: 'Branch 2', color: SERIES_COLORS[1], feb: 76 },
      { name: 'Branch 3', color: SERIES_COLORS[2], feb: 27 },
    ]);
  });

  it('stacks a shortfall as "Not broken down" so bars reach the reported total', () => {
    // May 2024: branches add up to 279, the company reports 301.
    const breakdown = getBreakdown(nodeByName('Company'));
    const unattributed = breakdown.series.at(-1)!;

    expect(unattributed).toMatchObject({ name: UNATTRIBUTED_NAME, pattern: 'hatch' });
    expect(unattributed.values).toEqual([0, 0, 0, 22, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(breakdown.mismatches).toEqual([{ monthIndex: 3, reported: 301, breakdownSum: 279 }]);
    breakdown.totals.forEach((total, i) => expect(sumAt(breakdown.series, i)).toBe(total));
  });

  it('reports an overshoot without inventing a series', () => {
    // Aug 2024: advisors add up to 216, Branch 1 reports 214.
    const breakdown = getBreakdown(nodeByName('Branch 1'));

    expect(breakdown.dimension).toBe('advisor');
    expect(breakdown.series.map((s) => s.name)).toEqual([
      'Anna Blackwood',
      'James Walker',
      'Maria Gutierrez',
      'Robert Chen',
      'Sarah Smith',
    ]);
    expect(breakdown.mismatches).toEqual([{ monthIndex: 6, reported: 214, breakdownSum: 216 }]);
  });

  it('splits an advisor by acquisition channel', () => {
    const breakdown = getBreakdown(nodeByName('Anna Blackwood'));

    expect(breakdown.dimension).toBe('channel');
    expect(breakdown.series.map((s) => s.name)).toEqual([
      'Existing clients',
      'New organic',
      'New paid',
      UNATTRIBUTED_NAME,
    ]);
    expect(breakdown.mismatches.map((m) => m.monthIndex)).toEqual([3, 4, 5, 6, 7]);
  });

  it('draws a leaf as a single series of its own values', () => {
    for (const name of ['James Walker', 'Branch 2', 'New paid']) {
      const node = nodeByName(name);
      expect(getBreakdown(node)).toEqual({
        dimension: null,
        series: [{ id: node.id, name, values: node.values, color: SERIES_COLORS[0] }],
        totals: node.values,
        mismatches: [],
      });
    }
  });

  it('folds children beyond the palette into "Other"', () => {
    const child = (i: number): ClientNode => ({
      id: `c${i}`,
      name: `Child ${i}`,
      kind: 'employee',
      values: [i],
      children: [],
    });
    const parent: ClientNode = {
      id: 'p',
      name: 'Parent',
      kind: 'branch',
      values: [21],
      children: [1, 2, 3, 4, 5, 6].map(child),
    };

    const { series, mismatches } = getBreakdown(parent);
    expect(series.map((s) => [s.name, s.values[0]])).toEqual([
      ['Child 1', 1],
      ['Child 2', 2],
      ['Child 3', 3],
      ['Child 4', 4],
      ['Other (2)', 11],
    ]);
    expect(new Set(series.map((s) => s.color)).size).toBe(SERIES_COLORS.length);
    expect(mismatches).toEqual([]);
  });
});
