const monthLong = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const monthShort = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
const integer = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** `"2024-02"` -> Date at the first of that month, UTC. */
export function parseYearMonth(yearMonth: string): Date {
  const [year, month] = yearMonth.split('-').map(Number) as [number, number];
  return new Date(Date.UTC(year, month - 1, 1));
}

/** `"2024-02"` -> `"Feb 2024"` */
export function formatMonth(yearMonth: string): string {
  return monthLong.format(parseYearMonth(yearMonth));
}

/** `"2024-02"` -> `"Feb 24"` */
export function formatMonthShort(yearMonth: string): string {
  return monthShort.format(parseYearMonth(yearMonth));
}

export function formatNumber(value: number): string {
  return integer.format(value);
}
