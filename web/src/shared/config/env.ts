const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

/** Dev API params for simulating loading and error states (`?delay=2000`, `?fail=1`). */
const SIMULATION_PARAMS = ['delay', 'fail'] as const;

/** Absolute URL for an API path, forwarding any simulation params from the page URL. */
export function apiUrl(path: string): string {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  const page = new URLSearchParams(window.location.search);
  for (const param of SIMULATION_PARAMS) {
    const value = page.get(param);
    if (value !== null) url.searchParams.set(param, value);
  }
  return url.toString();
}
