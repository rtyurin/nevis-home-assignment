import { useId } from 'react';

/** `useId` output is not a valid CSS/SVG id token (it contains colons); strip them. */
export function useStableId(prefix: string): string {
  return `${prefix}-${useId().replace(/:/g, '')}`;
}
