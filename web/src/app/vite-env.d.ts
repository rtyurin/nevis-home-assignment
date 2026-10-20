/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API; defaults to same origin (proxied in dev). */
  readonly VITE_API_URL?: string;
}
