/** Base URL of the API; same origin by default (proxied by Vite in dev). */
export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? '';

/**
 * Query parameters the dev API understands for exercising loading and error
 * states (`?delay=2000`, `?fail=1`). Forwarded from the page URL.
 */
const SIMULATION_PARAMS = ['delay', 'fail'] as const;

/** Absolute URL for an API path, carrying any simulation params from the page URL. */
export function apiUrl(path: string): string {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  const page = new URLSearchParams(window.location.search);
  for (const param of SIMULATION_PARAMS) {
    const value = page.get(param);
    if (value !== null) url.searchParams.set(param, value);
  }
  return url.toString();
}
