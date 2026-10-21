import { readFileSync } from 'node:fs';
import type { ClientsResponse, CompanyDto } from '../types.js';

/** Advisor photos by id, kept apart so `clients.json` stays exactly as the brief gave it. */
const AVATARS: Record<string, string> = {
  'e3c4637b-2f21-4b7e-883e-b13ae1a6df6a': '/avatars/anna-blackwood.png', // Anna Blackwood
};

function withAvatars(company: CompanyDto): CompanyDto {
  return {
    ...company,
    branches: company.branches?.map((branch) => ({
      ...branch,
      employees: branch.employees?.map((employee) => {
        const avatarUrl = AVATARS[employee.id];
        return avatarUrl ? { ...employee, avatarUrl } : employee;
      }),
    })),
  };
}

const company = withAvatars(JSON.parse(readFileSync(new URL('./clients.json', import.meta.url), 'utf8')) as CompanyDto);

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
