import { z } from 'zod';
import type { ClientNode, ClientsData } from './model';
import { indexTree } from './model';

const values = z.array(z.number().finite().nonnegative());
const channel = z.object({ id: z.string(), name: z.string(), values });
const employee = channel.extend({ channels: z.array(channel).optional() });
const branch = channel.extend({ employees: z.array(employee).optional() });
const company = channel.extend({ branches: z.array(branch).optional() });

export const clientsResponseSchema = z.object({
  months: z.array(z.string().regex(/^\d{4}-\d{2}$/)).min(1),
  company,
});

export type ClientsResponse = z.infer<typeof clientsResponseSchema>;

export class ApiError extends Error {
  readonly status: number | undefined;
  readonly code: string;

  constructor(message: string, { status, code }: { status?: number; code: string }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  /** Server errors and network failures are worth retrying; bad payloads and 4xx are not. */
  get retryable(): boolean {
    return this.code === 'NETWORK' || (this.status !== undefined && this.status >= 500);
  }
}

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * Query parameters the dev API understands for exercising loading and error
 * states (`?delay=2000`, `?fail=1`). Forwarded from the page URL.
 */
const SIMULATION_PARAMS = ['delay', 'fail'] as const;

function clientsUrl(): string {
  const url = new URL(`${API_BASE}/api/clients`, window.location.origin);
  const page = new URLSearchParams(window.location.search);
  for (const param of SIMULATION_PARAMS) {
    const value = page.get(param);
    if (value !== null) url.searchParams.set(param, value);
  }
  return url.toString();
}

export async function fetchClients(signal?: AbortSignal): Promise<ClientsData> {
  let response: Response;
  try {
    response = await fetch(clientsUrl(), { signal, headers: { Accept: 'application/json' } });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError('Could not reach the server.', { code: 'NETWORK' });
  }

  const body: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message = z
      .object({ error: z.object({ message: z.string(), code: z.string() }) })
      .safeParse(body);
    throw new ApiError(message.success ? message.data.error.message : `Request failed (${response.status}).`, {
      status: response.status,
      code: message.success ? message.data.error.code : 'HTTP_ERROR',
    });
  }

  const parsed = clientsResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError('The server sent data in an unexpected format.', { status: response.status, code: 'INVALID_PAYLOAD' });
  }
  return toClientsData(parsed.data);
}

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
