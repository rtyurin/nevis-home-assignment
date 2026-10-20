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

function renderChart(props: Partial<StackedBarChartProps> = {}) {
  return render(
    <>
      <h2 id="title">Test chart</h2>
      <StackedBarChart aria-labelledby="title" categories={categories} series={series} {...props} />
    </>,
  );
}

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

  it('labels the axes from the categories', () => {
    const { container } = renderChart();
    // Recharts wraps tick text in one <tspan> per word.
    const ticks = Array.from(container.querySelectorAll('.recharts-cartesian-axis-tick-value')).map((tick) =>
      Array.from(tick.querySelectorAll('tspan'), (word) => word.textContent).join(' '),
    );
    expect(ticks).toEqual(expect.arrayContaining(['Jan 2024', 'Feb 2024', '20']));
  });

  it('shows a legend for two or more series only', () => {
    const { unmount } = renderChart();
    expect(screen.getByRole('list', { name: 'Legend' })).toHaveTextContent('AlphaBeta');
    unmount();

    renderChart({ series: [series[0]!] });
    expect(screen.queryByRole('list', { name: 'Legend' })).toBeNull();
  });
});
