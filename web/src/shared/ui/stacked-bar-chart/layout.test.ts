import { describe, expect, it } from 'vitest';
import { barPath, barWidth, niceScale } from './layout';

describe('barWidth', () => {
  it('keeps 12px either side of the bar, up to the 87.5px design width', () => {
    expect(barWidth(111.5)).toBe(87.5);
    expect(barWidth(100)).toBe(76);
    expect(barWidth(140)).toBe(87.5);
  });

  it('keeps a share of the band when the insets would squeeze the bar away', () => {
    expect(barWidth(30)).toBeCloseTo(16.8);
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
