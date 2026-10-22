import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Kept as an entity even with one page: the client tree and its maths aren't page-specific.
    files: ['./src/entities/**'],
    rules: { 'fsd/insignificant-slice': 'off' },
  },
  {
    // The chart and table are built to be placed on more than one page; only one exists so far.
    files: ['./src/widgets/**'],
    rules: { 'fsd/insignificant-slice': 'off' },
  },
  // Test harness (setup, fixtures, render helpers) sits outside the layers on purpose.
  { ignores: ['**/test/**'] },
]);
