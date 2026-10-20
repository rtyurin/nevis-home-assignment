import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
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

const segments = (container: HTMLElement, category: string) =>
  Array.from(container.querySelectorAll(`[data-category="${category}"] path`)).map((path) => ({
    series: path.getAttribute('data-series'),
    y0: Number(path.getAttribute('data-y0')),
    y1: Number(path.getAttribute('data-y1')),
    top: path.hasAttribute('data-top'),
  }));

describe('StackedBarChart', () => {
  it('draws one bar per category, stacking series in order', () => {
    const { container } = renderChart();

    expect(segments(container, 'jan')).toEqual([
      { series: 'a', y0: 0, y1: 10, top: false },
      { series: 'b', y0: 10, y1: 15, top: true },
    ]);
    // Alpha is 0 in February: no empty segment, and Beta takes the cap.
    expect(segments(container, 'feb')).toEqual([{ series: 'b', y0: 0, y1: 20, top: true }]);
  });

  it('labels each bar with its values for assistive technology', () => {
    renderChart();

    expect(screen.getByRole('group', { name: 'Test chart' })).toBeInTheDocument();
    expect(screen.getAllByRole('img').map((bar) => bar.getAttribute('aria-label'))).toEqual([
      'Jan 2024: Alpha 10, Beta 5, Total 15',
      'Feb 2024: Beta 20, Total 20',
    ]);
  });

  it('uses explicit totals when given', () => {
    renderChart({ totals: [16, 20] });
    expect(screen.getAllByRole('img')[0]).toHaveAccessibleName('Jan 2024: Alpha 10, Beta 5, Total 16');
  });

  it('scales the y axis to round ticks above the tallest bar', () => {
    const { container } = renderChart();
    const ticks = Array.from(container.querySelectorAll('text')).map((t) => t.textContent);
    expect(ticks).toEqual(['0', '5', '10', '15', '20', 'Jan 2024', 'Feb 2024']);
  });

  it('shows a legend for two or more series only', () => {
    const { unmount } = renderChart();
    const legend = screen.getByRole('list', { name: 'Legend' });
    expect(legend).toHaveTextContent('AlphaBeta');
    unmount();

    renderChart({ series: [series[0]!] });
    expect(screen.queryByRole('list', { name: 'Legend' })).toBeNull();
  });

  it('shows a tooltip on hover and keyboard focus', async () => {
    const user = userEvent.setup();
    renderChart({ renderTooltipFooter: (i) => (i === 1 ? 'Footnote' : null) });
    const [jan, feb] = screen.getAllByRole('img');

    await user.hover(jan!);
    expect(screen.getByText('Jan 2024', { selector: 'p' })).toBeInTheDocument();
    await user.unhover(jan!);

    await user.tab();
    expect(jan).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(feb).toHaveFocus();
    expect(screen.getByText('Feb 2024', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('Footnote')).toBeInTheDocument();
  });
});
