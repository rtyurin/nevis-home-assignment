import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clientsResponse, jsonResponse } from '@/test/fixtures';
import { mockElementSize } from '@/test/layout';
import { renderWithQueryClient } from '@/test/render';
import { ClientsPage } from './ClientsPage';

const chart = vi.hoisted(() => ({ fails: true }));

vi.mock('../ClientsChart/ClientsChart', () => ({
  ClientsChart: () => {
    if (chart.fails) throw new Error('Chart crashed');
    return <p>Chart drawn</p>;
  },
}));

async function renderWithBrokenChart() {
  chart.fails = true;
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => jsonResponse(clientsResponse)),
  );
  vi.spyOn(console, 'error').mockImplementation(() => {}); // React logs errors caught by boundaries
  const user = userEvent.setup();
  renderWithQueryClient(<ClientsPage />);
  await screen.findByRole('treegrid');
  return user;
}

describe('ClientsPage when a panel fails to draw', () => {
  beforeEach(() => mockElementSize());

  it('keeps the table, and says it is the chart that failed', async () => {
    await renderWithBrokenChart();

    expect(screen.getByRole('alert')).toHaveTextContent('The chart couldn’t be drawn');
    expect(screen.queryByText(/couldn’t be loaded/)).toBeNull();
    expect(screen.getByRole('rowheader', { name: 'Company' })).toBeInTheDocument();
  });

  it('draws the chart again on retry', async () => {
    const user = await renderWithBrokenChart();

    chart.fails = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('Chart drawn')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('draws the chart again when another row is selected', async () => {
    const user = await renderWithBrokenChart();

    chart.fails = false;
    await user.click(screen.getByRole('rowheader', { name: 'Branch 2' }));
    expect(screen.getByText('Chart drawn')).toBeInTheDocument();
  });
});
