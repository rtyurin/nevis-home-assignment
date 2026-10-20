import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/api';
import { clientsResponse, jsonResponse } from '@/test/fixtures';
import { fetchClients } from './clientsQuery';
import { toClientsData } from './toClientsData';

describe('toClientsData', () => {
  it('normalises every level into `children` with its kind', () => {
    const { root, index } = toClientsData(clientsResponse);

    expect(root.kind).toBe('company');
    expect(root.children.map((c) => [c.name, c.kind, c.children.length])).toEqual([
      ['Branch 1', 'branch', 5],
      ['Branch 2', 'branch', 0],
      ['Branch 3', 'branch', 0],
    ]);
    const anna = root.children[0]!.children[0]!;
    expect(anna.children.map((c) => c.kind)).toEqual(['channel', 'channel', 'channel']);
    expect(root.children[0]!.children[1]!.children).toEqual([]);
    expect(index.size).toBe(1 + 3 + 5 + 3);
  });

  it('rejects series that do not cover every month', () => {
    const broken = { ...clientsResponse, months: clientsResponse.months.slice(0, 11) };
    expect(() => toClientsData(broken)).toThrow(ApiError);
  });
});

describe('fetchClients', () => {
  it('returns normalised data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(clientsResponse)),
    );
    const data = await fetchClients();
    expect(data.months).toHaveLength(12);
    expect(data.root.name).toBe('Company');
  });

  it('surfaces the server error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: { code: 'BOOM', message: 'Database is down' } }, 503)),
    );
    await expect(fetchClients()).rejects.toMatchObject({ message: 'Database is down', status: 503, retryable: true });
  });

  it('rejects a malformed payload without retrying', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ company: { name: 'No id' } })),
    );
    await expect(fetchClients()).rejects.toMatchObject({ code: 'INVALID_PAYLOAD', retryable: false });
  });

  it('treats network failures as retryable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchClients()).rejects.toMatchObject({ code: 'NETWORK', retryable: true });
  });
});
