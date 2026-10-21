import { describe, expect, it } from 'vitest';
import { nodeByName } from '@/test/fixtures';
import { getBreakdown, UNATTRIBUTED_NAME } from './breakdown';
import type { ClientNode } from './types';

const sumAt = (series: { values: readonly (number | null)[] }[], i: number) =>
  series.reduce((total, s) => total + (s.values[i] ?? 0), 0);

describe('getBreakdown', () => {
  it('splits the company by branch', () => {
    const breakdown = getBreakdown(nodeByName('Company'));

    expect(breakdown.dimension).toBe('branch');
    expect(breakdown.totals).toEqual(nodeByName('Company').values);
    expect(breakdown.series.slice(0, 3).map(({ name, kind, values }) => ({ name, kind, feb: values[0] }))).toEqual([
      { name: 'Branch 1', kind: 'child', feb: 147 },
      { name: 'Branch 2', kind: 'child', feb: 76 },
      { name: 'Branch 3', kind: 'child', feb: 27 },
    ]);
  });

  it('adds the shortfall as "Not broken down" so the stack reaches the reported total', () => {
    // May 2024: branches add up to 279, the company reports 301.
    const breakdown = getBreakdown(nodeByName('Company'));
    const unattributed = breakdown.series.at(-1)!;

    expect(unattributed).toMatchObject({ name: UNATTRIBUTED_NAME, kind: 'unattributed' });
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
        series: [{ id: node.id, name, values: node.values, kind: 'child' }],
        totals: node.values,
        mismatches: [],
      });
    }
  });

  it('keeps months without data apart from zeros', () => {
    const channel = (id: string, values: (number | null)[]): ClientNode => ({
      id,
      name: id,
      kind: 'channel',
      values,
      children: [],
    });
    const parent: ClientNode = {
      id: 'p',
      name: 'Parent',
      kind: 'employee',
      // Month 0: one channel has no data. Month 1: nothing reported. Month 2: a real 0.
      values: [10, null, 0],
      children: [channel('a', [6, null, 0]), channel('b', [null, null, 0])],
    };

    const { series, mismatches } = getBreakdown(parent);
    expect(series.map((s) => s.values)).toEqual([
      [6, null, 0],
      [null, null, 0],
      [4, null, 0],
    ]);
    expect(mismatches).toEqual([{ monthIndex: 0, reported: 10, breakdownSum: 6 }]);
  });

  it('folds children beyond `maxSeries` into "Other"', () => {
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

    const { series, mismatches } = getBreakdown(parent, { maxSeries: 5 });
    expect(series.map((s) => [s.name, s.kind, s.values[0]])).toEqual([
      ['Child 1', 'child', 1],
      ['Child 2', 'child', 2],
      ['Child 3', 'child', 3],
      ['Child 4', 'child', 4],
      ['Other (2)', 'other', 11],
    ]);
    expect(mismatches).toEqual([]);
  });
});
