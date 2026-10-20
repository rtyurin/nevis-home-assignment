import { vi } from 'vitest';

/**
 * jsdom has no layout: every element measures 0×0. Give elements a size so
 * measuring components (Recharts' ResponsiveContainer) render their content.
 */
export function mockElementSize(width = 960, height = 400) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    DOMRect.fromRect({ x: 0, y: 0, width, height }),
  );
}
