import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Single Burner needs a self-contained build rooted at its own HTTP origin.
// Use a dedicated Vite mode so the normal Phoenix production asset layout is
// left untouched while local packaging can emit a root-relative SPA.
const result = spawnSync(process.execPath, [
  fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)),
  'build', '--mode', 'single-burner', '--config', 'vite.config.mjs',
], {
  cwd: fileURLToPath(new URL('..', import.meta.url)),
  env: { ...process.env, VITE_API_URL: '', VITE_SOCKET_URL: '' },
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
