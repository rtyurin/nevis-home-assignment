import { describe, expect, it } from 'vitest';
import { niceScale, stackCategory } from './layout';

describe('stackCategory', () => {
  const series = [
    { id: 'a', values: [10, 0] },
    { id: 'b', values: [5, 20] },
    { id: 'c', values: [0, 0] },
  ];

  it('stacks series bottom-to-top in order and marks the top segment', () => {
    expect(stackCategory(series, 0)).toEqual([
      { seriesId: 'a', value: 10, y0: 0, y1: 10, isTop: false },
      { seriesId: 'b', value: 5, y0: 10, y1: 15, isTop: true },
    ]);
  });

  it('skips zero values, so the cap lands on the highest non-empty segment', () => {
    expect(stackCategory(series, 1)).toEqual([{ seriesId: 'b', value: 20, y0: 0, y1: 20, isTop: true }]);
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
