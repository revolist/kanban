import { createServer } from 'vite';
import { readFileSync } from 'node:fs';
const root = readFileSync(new URL('../../.consumer-path', import.meta.url), 'utf8').trim();
const server = await createServer({
  root,
  configFile: false,
  server: { host: '127.0.0.1', port: 5188, strictPort: true },
});
await server.listen();
console.log('Public package consumer on http://127.0.0.1:5188');
