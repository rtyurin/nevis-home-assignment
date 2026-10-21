import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { mockElementSize } from '@/test/layout';
import { StackedBarChart, type StackedBarChartProps } from './StackedBarChart';

const categories = [
  { id: 'jan', label: 'Jan 2024' },
  { id: 'feb', label: 'Feb 2024' },
];
const series = [
  { id: 'a', name: 'Alpha', values: [10, 0], color: 'red' },
  { id: 'b', name: 'Beta', values: [5, 20], color: 'blue' },
];

const chart = (props: Partial<StackedBarChartProps> = {}) => (
  <>
    <h2 id="title">Test chart</h2>
    <StackedBarChart aria-labelledby="title" categories={categories} series={series} {...props} />
  </>
);

const renderChart = (props?: Partial<StackedBarChartProps>) => render(chart(props));

const segments = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('path[data-series]')).map((path) => ({
    series: path.getAttribute('data-series'),
    category: path.getAttribute('data-category'),
    top: path.hasAttribute('data-top'),
  }));

describe('StackedBarChart', () => {
  beforeEach(() => mockElementSize());

  it('draws a segment per non-zero value, capping the top of each stack', () => {
    const { container } = renderChart();
    expect(screen.getByRole('figure', { name: 'Test chart' })).toBeInTheDocument();
    expect(segments(container)).toEqual(
      expect.arrayContaining([
        { series: 'a', category: 'jan', top: false },
        { series: 'b', category: 'jan', top: true },
        { series: 'b', category: 'feb', top: true },
      ]),
    );
    // Alpha is 0 in February: no empty segment.
    expect(segments(container)).toHaveLength(3);
  });

  it('remounts the bars when animationKey changes, even with the same series', () => {
    const { container, rerender } = renderChart({ animationKey: 'one' });
    const segment = () => container.querySelector('path[data-series="a"][data-category="jan"]');
    const first = segment();

    rerender(chart({ animationKey: 'one' }));
    expect(segment()).toBe(first);

    rerender(chart({ animationKey: 'two' }));
    expect(segment()).not.toBe(first);
    expect(segment()).toBeInTheDocument();
  });

  it('rounds the bottom of each stack as well as the top', () => {
    const { container } = renderChart();
    const bottoms = Array.from(container.querySelectorAll('path[data-bottom]'), (path) => [
      path.getAttribute('data-series'),
      path.getAttribute('data-category'),
    ]);
    expect(bottoms).toEqual(
      expect.arrayContaining([
        ['a', 'jan'],
        ['b', 'feb'],
      ]),
    );
    expect(bottoms).toHaveLength(2);
  });

  it('draws a stub for a real 0 and a placeholder for a category without data', () => {
    const { container } = renderChart({
      series: [
        { id: 'a', name: 'Alpha', values: [0, null], color: 'red' },
        { id: 'b', name: 'Beta', values: [null, null], color: 'blue' },
      ],
    });
    const markers = Array.from(container.querySelectorAll('rect[data-baseline]'), (rect) => ({
      kind: rect.getAttribute('data-baseline'),
      category: rect.getAttribute('data-category'),
      fill: (rect as SVGRectElement).style.fill,
    }));
    expect(markers).toEqual([
      { kind: 'zero', category: 'jan', fill: 'red' },
      { kind: 'missing', category: 'feb', fill: expect.stringMatching(/^url\(/) },
    ]);
    expect(segments(container)).toEqual([]);
  });

  it('shows a legend for two or more series only', () => {
    const { unmount } = renderChart();
    expect(screen.getByRole('list', { name: 'Legend' })).toHaveTextContent('AlphaBeta');
    unmount();

    renderChart({ series: [series[0]!] });
    expect(screen.queryByRole('list', { name: 'Legend' })).toBeNull();
  });
});
