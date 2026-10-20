import { readFileSync } from 'node:fs';
import type { ClientsResponse, CompanyDto } from '../types.js';

const company = JSON.parse(readFileSync(new URL('./clients.json', import.meta.url), 'utf8')) as CompanyDto;

/** First month of the series; the design labels the 12 values Feb 2024 – Jan 2025. */
const START_MONTH = '2024-02';

export function monthRange(start: string, count: number): string[] {
  const [year, month] = start.split('-').map(Number) as [number, number];
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(year, month - 1 + i, 1));
    return date.toISOString().slice(0, 7);
  });
}

export function getClients(): ClientsResponse {
  return { months: monthRange(START_MONTH, company.values.length), company };
}
