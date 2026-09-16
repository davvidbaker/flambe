import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// A saved .env.local may target production. A local build always uses its own origin.
const result = spawnSync(process.execPath, [
  fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)),
  'build', '--config', 'vite.config.mjs',
], {
  cwd: fileURLToPath(new URL('..', import.meta.url)),
  env: { ...process.env, VITE_API_URL: '', VITE_SOCKET_URL: '' },
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
