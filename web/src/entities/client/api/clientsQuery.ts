import { queryOptions } from '@tanstack/react-query';
import { getJson, retryTransient } from '@/shared/api';
import { apiUrl } from '@/shared/config';
import type { ClientsData } from '../model/types';
import { clientsResponseSchema } from './schema';
import { toClientsData } from './toClientsData';

export const clientsQueryOptions = () =>
  queryOptions({
    queryKey: ['clients'] as const,
    queryFn: async ({ signal }): Promise<ClientsData> =>
      toClientsData(await getJson(apiUrl('/api/clients'), clientsResponseSchema, signal)),
    retry: retryTransient,
  });
