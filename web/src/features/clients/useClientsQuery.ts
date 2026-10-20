import { useQuery } from '@tanstack/react-query';
import { ApiError, fetchClients } from './api';

export const clientsQueryKey = ['clients'] as const;

const MAX_RETRIES = 2;

export function useClientsQuery() {
  return useQuery({
    queryKey: clientsQueryKey,
    queryFn: ({ signal }) => fetchClients(signal),
    retry: (failureCount, error) =>
      error instanceof ApiError && error.retryable && failureCount < MAX_RETRIES,
  });
}
