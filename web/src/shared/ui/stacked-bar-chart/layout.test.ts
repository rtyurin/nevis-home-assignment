import { describe, expect, it } from 'vitest';
import { barWidth } from './layout';

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
