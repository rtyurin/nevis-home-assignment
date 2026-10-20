import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterEach } from 'vitest';

// Animations are covered visually; in tests, rows should appear and leave immediately.
MotionGlobalConfig.skipAnimations = true;

// Tests run as if the user prefers reduced motion: Recharts bars render at full height at once.
window.matchMedia ??= ((query: string) => ({
  matches: query.includes('prefers-reduced-motion') && !query.includes('no-preference'),
  media: query,
  onchange: null,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

// jsdom has no layout engine. Recharts' ResponsiveContainer needs ResizeObserver to exist.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

afterEach(() => {
  cleanup();
});
