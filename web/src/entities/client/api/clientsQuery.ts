import { queryOptions } from '@tanstack/react-query';
import { getJson, retryTransient } from '@/shared/api';
import { apiUrl } from '@/shared/config';
import type { ClientsData } from '../model/types';
import { clientsResponseSchema } from './schema';
import { toClientsData } from './toClientsData';

export async function fetchClients(signal?: AbortSignal): Promise<ClientsData> {
  return toClientsData(await getJson(apiUrl('/api/clients'), clientsResponseSchema, signal));
}

export const clientsQueryOptions = () =>
  queryOptions({
    queryKey: ['clients'] as const,
    queryFn: ({ signal }) => fetchClients(signal),
    retry: retryTransient,
  });
