import { describe, expect, it } from 'vitest';
import { barPath, niceScale, toChartRows } from './toChartRows';

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
        bottomSeriesId: 'a',
        marker: null,
      },
      {
        id: 'feb',
        label: 'Feb 2024',
        shortLabel: 'Feb 2024',
        values: { a: 0, b: 20, c: 0 },
        total: 20,
        topSeriesId: 'b',
        bottomSeriesId: 'b',
        marker: null,
      },
    ]);
  });

  it('puts the cap on the highest non-empty segment', () => {
    const rows = toChartRows(categories, [series[1]!, series[0]!]);
    expect(rows.map((r) => r.topSeriesId)).toEqual(['a', 'b']);
    expect(toChartRows(categories, [series[2]!])[0]!.topSeriesId).toBeNull();
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

describe('barPath', () => {
  it('rounds the requested ends, each to at most half the height when both are rounded', () => {
    expect(barPath(0, 0, 10, 20, { top: 4 })).toBe('M0,20 V4 Q0,0 4,0 H6 Q10,0 10,4 V20 Q10,20 10,20 H0 Q0,20 0,20 Z');
    expect(barPath(0, 0, 10, 6, { top: 4, bottom: 4 })).toBe(
      'M0,3 V3 Q0,0 3,0 H7 Q10,0 10,3 V3 Q10,6 7,6 H3 Q0,6 0,3 Z',
    );
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
