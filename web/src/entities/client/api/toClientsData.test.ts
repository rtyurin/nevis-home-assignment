import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/api';
import { clientsResponse } from '@/test/fixtures';
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

  it('keeps an advisor photo where the API sends one', () => {
    const [branch] = clientsResponse.company.branches!;
    const [anna, ...others] = branch!.employees!;
    const withPhoto = {
      ...clientsResponse,
      company: {
        ...clientsResponse.company,
        branches: [{ ...branch!, employees: [{ ...anna!, avatarUrl: '/avatars/anna.png' }, ...others] }],
      },
    };

    const [annaNode, jamesNode] = toClientsData(withPhoto).root.children[0]!.children;
    expect(annaNode!.avatarUrl).toBe('/avatars/anna.png');
    expect(jamesNode).not.toHaveProperty('avatarUrl');
  });

  it('rejects series that do not cover every month', () => {
    const broken = { ...clientsResponse, months: clientsResponse.months.slice(0, 11) };
    expect(() => toClientsData(broken)).toThrow(ApiError);
  });
});
