/**
 * Wire format for GET /api/clients.
 *
 * The tree is served exactly as provided in the brief (heterogeneous child keys:
 * `branches` -> `employees` -> `channels`). The envelope adds the month each
 * index in `values` refers to, so clients never have to hard-code the period.
 */
export interface ChannelDto {
  id: string;
  name: string;
  /** One per month; `null` where there is no data for that month. */
  values: (number | null)[];
}

export interface EmployeeDto extends ChannelDto {
  channels?: ChannelDto[];
}

export interface BranchDto extends ChannelDto {
  employees?: EmployeeDto[];
}

export interface CompanyDto extends ChannelDto {
  branches?: BranchDto[];
}

export interface ClientsResponse {
  /** ISO year-month (`YYYY-MM`) for each index of every node's `values`. */
  months: string[];
  company: CompanyDto;
}

export interface ErrorResponse {
  error: { code: string; message: string };
}
