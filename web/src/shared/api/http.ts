import { z } from 'zod';

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

/** The API's error envelope: `{ error: { code, message } }`. */
const errorBody = z.object({ error: z.object({ code: z.string(), message: z.string() }) });

/**
 * GET a JSON resource and validate it against `schema`.
 * Every failure (network, HTTP status, shape) surfaces as an `ApiError`.
 */
export async function getJson<T>(url: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError('Could not reach the server.', { code: 'NETWORK' });
  }

  const body: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    const parsed = errorBody.safeParse(body);
    throw new ApiError(parsed.success ? parsed.data.error.message : `Request failed (${response.status}).`, {
      status: response.status,
      code: parsed.success ? parsed.data.error.code : 'HTTP_ERROR',
    });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError('The server sent data in an unexpected format.', {
      status: response.status,
      code: 'INVALID_PAYLOAD',
    });
  }
  return parsed.data;
}

/** React Query `retry` policy: retry transient failures a couple of times. */
export function retryTransient(failureCount: number, error: unknown): boolean {
  return error instanceof ApiError && error.retryable && failureCount < 2;
}
