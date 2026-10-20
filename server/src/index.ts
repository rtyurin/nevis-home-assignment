import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

const port = Number(process.env.PORT) || 3001;
const isProduction = process.env.NODE_ENV === 'production';

const app = createApp({
  allowSimulation: !isProduction,
  staticDir: fileURLToPath(new URL('../../web/dist', import.meta.url)),
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
