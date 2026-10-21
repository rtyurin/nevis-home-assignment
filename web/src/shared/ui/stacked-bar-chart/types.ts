export interface ChartCategory {
  id: string;
  label: string;
  /** Used instead of `label` when the bars get too narrow for it. */
  shortLabel?: string;
}

export interface ChartSeries {
  id: string;
  name: string;
  /** One value per category. `null`: no data for that category. */
  values: readonly (number | null)[];
  /** Any CSS color. */
  color: string;
  /** Hatched fill, for series that should read as "not a real category". */
  pattern?: 'hatch';
}
