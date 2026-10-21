import { describe, expect, it } from 'vitest';
import { toChartRows } from './toChartRows';

const categories = [
  { id: 'jan', label: 'Jan 2024', shortLabel: 'Jan 24' },
  { id: 'feb', label: 'Feb 2024' },
];
const series = [
  { id: 'a', name: 'Alpha', values: [10, 0], color: 'red' },
  { id: 'b', name: 'Beta', values: [5, 20], color: 'blue' },
  { id: 'c', name: 'Gamma', values: [0, 0], color: 'green' },
];

describe('toChartRows', () => {
  it('makes one row per category with every series value', () => {
    expect(toChartRows(categories, series)).toEqual([
      {
        id: 'jan',
        label: 'Jan 2024',
        shortLabel: 'Jan 24',
        values: { a: 10, b: 5, c: 0 },
        total: 15,
        stackSum: 15,
        topSeriesId: 'b',
        bottomSeriesId: 'a',
        marker: null,
      },
      {
        id: 'feb',
        label: 'Feb 2024',
        shortLabel: 'Feb 2024',
        values: { a: 0, b: 20, c: 0 },
        total: 20,
        stackSum: 20,
        topSeriesId: 'b',
        bottomSeriesId: 'b',
        marker: null,
      },
    ]);
  });

  it('marks a real 0 and a category without data on the baseline', () => {
    const rows = toChartRows(categories, [
      { id: 'x', name: 'X', values: [null, null], color: 'red' },
      { id: 'y', name: 'Y', values: [0, null], color: 'blue' },
    ]);
    expect(rows.map((r) => [r.values, r.total, r.marker])).toEqual([
      [{ x: null, y: 0 }, 0, { kind: 'zero', seriesId: 'y' }],
      [{ x: null, y: null }, null, { kind: 'missing', seriesId: 'x' }],
    ]);
    expect(rows.map((r) => [r.topSeriesId, r.bottomSeriesId])).toEqual([
      [null, null],
      [null, null],
    ]);
  });

  it('uses reported totals when given', () => {
    expect(toChartRows(categories, series, [16, 20]).map((r) => r.total)).toEqual([16, 20]);
  });
});
