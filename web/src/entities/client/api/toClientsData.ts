import { ApiError } from '@/shared/api';
import { indexTree } from '../model/tree';
import type { ClientNode, ClientsData } from '../model/types';
import type { ClientsResponse } from './schema';

type Branch = NonNullable<ClientsResponse['company']['branches']>[number];
type Employee = NonNullable<Branch['employees']>[number];
type Channel = NonNullable<Employee['channels']>[number];

/** Normalises the wire format into a uniform tree and checks every series covers every month. */
export function toClientsData({ months, company }: ClientsResponse): ClientsData {
  const node = (
    dto: { id: string; name: string; values: (number | null)[]; avatarUrl?: string },
    kind: ClientNode['kind'],
    children: ClientNode[] = [],
  ): ClientNode => {
    if (dto.values.length !== months.length) {
      throw new ApiError(`"${dto.name}" has ${dto.values.length} values for ${months.length} months.`, {
        code: 'INVALID_PAYLOAD',
      });
    }
    return {
      id: dto.id,
      name: dto.name,
      kind,
      values: dto.values,
      children,
      ...(dto.avatarUrl ? { avatarUrl: dto.avatarUrl } : {}),
    };
  };

  const channel = (c: Channel) => node(c, 'channel');
  const employee = (e: Employee) => node(e, 'employee', (e.channels ?? []).map(channel));
  const branch = (b: Branch) => node(b, 'branch', (b.employees ?? []).map(employee));
  const root = node(company, 'company', (company.branches ?? []).map(branch));

  return { months, root, index: indexTree(root) };
}
