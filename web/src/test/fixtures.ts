import { toClientsData, type ClientsResponse } from '@/entities/client';
import company from '../../../server/src/data/clients.json';

/** Same payload the API serves. */
export const clientsResponse: ClientsResponse = {
  months: [
    '2024-02',
    '2024-03',
    '2024-04',
    '2024-05',
    '2024-06',
    '2024-07',
    '2024-08',
    '2024-09',
    '2024-10',
    '2024-11',
    '2024-12',
    '2025-01',
  ],
  company,
};

export const clientsData = toClientsData(clientsResponse);

export function nodeByName(name: string) {
  for (const { node } of clientsData.index.values()) if (node.name === name) return node;
  throw new Error(`No node named ${name}`);
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
