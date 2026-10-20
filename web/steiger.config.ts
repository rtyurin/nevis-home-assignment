import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // The domain layer is a deliberate boundary even with a single page today:
    // the client tree, its API and its maths don't belong to any one screen.
    files: ['./src/entities/**'],
    rules: { 'fsd/insignificant-slice': 'off' },
  },
  // Test harness (setup, fixtures, render helpers) sits outside the layers on purpose.
  { ignores: ['**/test/**'] },
]);
