import { describe, expect, it } from 'vitest';
import { niceScale, toChartRows } from './toChartRows';

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
        topSeriesId: 'b',
      },
      {
        id: 'feb',
        label: 'Feb 2024',
        shortLabel: 'Feb 2024',
        values: { a: 0, b: 20, c: 0 },
        total: 20,
        topSeriesId: 'b',
      },
    ]);
  });

  it('puts the cap on the highest non-empty segment', () => {
    const rows = toChartRows(categories, [series[1]!, series[0]!]);
    expect(rows.map((r) => r.topSeriesId)).toEqual(['a', 'b']);
    expect(toChartRows(categories, [series[2]!])[0]!.topSeriesId).toBeNull();
  });

  it('uses reported totals when given', () => {
    expect(toChartRows(categories, series, [16, 20]).map((r) => r.total)).toEqual([16, 20]);
  });
});

describe('niceScale', () => {
  it.each([
    [350, 400, [0, 100, 200, 300, 400]],
    [38, 40, [0, 10, 20, 30, 40]],
    [20, 20, [0, 5, 10, 15, 20]],
    [3, 3, [0, 1, 2, 3]],
    [0, 1, [0, 1]],
  ])('max %d -> %d', (max, expectedMax, expectedTicks) => {
    expect(niceScale(max)).toEqual({ max: expectedMax, ticks: expectedTicks });
  });
});
