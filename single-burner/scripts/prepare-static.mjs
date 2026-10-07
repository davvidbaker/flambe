import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../../backend/priv/static', import.meta.url));
const target = fileURLToPath(new URL('../static', import.meta.url));
const index = fileURLToPath(new URL('../../backend/priv/static/index.html', import.meta.url));

if (!existsSync(index)) {
  throw new Error('Missing backend/priv/static/index.html. Run the local frontend build first.');
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
console.log(`Bundled Flambé UI from ${source}`);
