import { ApiError } from '@/shared/api';
import { indexTree } from '../model/tree';
import type { ClientNode, ClientsData } from '../model/types';
import type { ClientsResponse } from './schema';

/** Normalises the wire format into a uniform tree and checks every series covers every month. */
export function toClientsData({ months, company }: ClientsResponse): ClientsData {
  const node = (
    dto: { id: string; name: string; values: number[] },
    kind: ClientNode['kind'],
    children: ClientNode[] = [],
  ): ClientNode => {
    if (dto.values.length !== months.length) {
      throw new ApiError(`"${dto.name}" has ${dto.values.length} values for ${months.length} months.`, {
        code: 'INVALID_PAYLOAD',
      });
    }
    return { id: dto.id, name: dto.name, kind, values: dto.values, children };
  };

  const root = node(
    company,
    'company',
    (company.branches ?? []).map((b) =>
      node(
        b,
        'branch',
        (b.employees ?? []).map((e) =>
          node(
            e,
            'employee',
            (e.channels ?? []).map((c) => node(c, 'channel')),
          ),
        ),
      ),
    ),
  );

  return { months, root, index: indexTree(root) };
}
