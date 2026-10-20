import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { clientsResponse, jsonResponse } from '../../../test/fixtures';
import { renderWithQueryClient } from '../../../test/render';
import { ClientsDashboard } from './ClientsDashboard';

const row = (name: string) => screen.getByRole('rowheader', { name }).closest('tr')!;
const legend = () =>
  within(screen.getByRole('list', { name: 'Legend' }))
    .getAllByRole('listitem')
    .map((item) => item.textContent);
const chartScope = () => screen.getByRole('navigation', { name: 'Chart scope' });

async function renderLoaded() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(clientsResponse)));
  const user = userEvent.setup();
  renderWithQueryClient(<ClientsDashboard />);
  await screen.findByRole('treegrid');
  return user;
}

describe('ClientsDashboard', () => {
  it('shows a loading state, then the company expanded to its branches', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(clientsResponse)));
    renderWithQueryClient(<ClientsDashboard />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading client data');
    expect(await screen.findByRole('treegrid')).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();

    expect(row('Company')).toHaveAttribute('aria-expanded', 'true');
    expect(row('Branch 1')).toHaveAttribute('aria-expanded', 'false');
    // Branches 2 and 3 have no employees, so they are not expandable.
    expect(row('Branch 2')).not.toHaveAttribute('aria-expanded');
    expect(screen.queryByRole('rowheader', { name: /Anna Blackwood/ })).toBeNull();
    expect(within(row('Company')).getAllByRole('gridcell').map((c) => c.textContent)).toEqual(
      clientsResponse.company.values.map(String),
    );
  });

  it('charts the company split by branch by default', async () => {
    await renderLoaded();

    expect(within(chartScope()).getByText('Company')).toHaveAttribute('aria-current', 'location');
    expect(legend()).toEqual(['Branch 1', 'Branch 2', 'Branch 3', 'Not broken down']);
    expect(screen.getByRole('img', { name: /^May 2024:/ })).toHaveAccessibleName(
      'May 2024: Branch 1 156, Branch 2 87, Branch 3 36, Not broken down 22, Total 301',
    );
    expect(screen.getByRole('note')).toHaveTextContent('reported total in May 2024 (279 vs 301 reported)');
  });

  it('drills the table and the chart down together', async () => {
    const user = await renderLoaded();

    await user.click(row('Branch 1'));
    expect(row('Branch 1')).toHaveAttribute('aria-expanded', 'true');
    expect(within(chartScope()).getByText('Branch 1')).toHaveAttribute('aria-current', 'location');
    expect(legend()).toEqual(['Anna Blackwood', 'James Walker', 'Maria Gutierrez', 'Robert Chen', 'Sarah Smith']);

    // Keyboard: down to Anna, expand, step into her first channel.
    await user.keyboard('{ArrowDown}{ArrowRight}');
    expect(row('Anna Blackwood')).toHaveAttribute('aria-expanded', 'true');
    expect(legend()).toEqual(['Existing clients', 'New organic', 'New paid', 'Not broken down']);

    await user.keyboard('{ArrowRight}');
    expect(row('Existing clients')).toHaveFocus();
    expect(screen.queryByRole('list', { name: 'Legend' })).toBeNull();

    // The breadcrumb goes back up without collapsing anything.
    await user.click(within(chartScope()).getByRole('button', { name: 'Company' }));
    expect(legend()).toEqual(['Branch 1', 'Branch 2', 'Branch 3', 'Not broken down']);
    expect(row('Existing clients')).toBeInTheDocument();
  });

  it('shows an error with a working retry', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: { code: 'BAD', message: 'Bad request' } }, 400))
      .mockResolvedValueOnce(jsonResponse(clientsResponse));
    vi.stubGlobal('fetch', fetch);
    const user = userEvent.setup();
    renderWithQueryClient(<ClientsDashboard />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Client data couldn’t be loaded');
    expect(alert).toHaveTextContent('Bad request');

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('treegrid')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('retries server errors before giving up', async () => {
    const fetch = vi.fn(async () => jsonResponse({ error: { code: 'X', message: 'Down' } }, 500));
    vi.stubGlobal('fetch', fetch);
    renderWithQueryClient(<ClientsDashboard />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Down');
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
