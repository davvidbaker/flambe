import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';

export function loadProjectEnv({ cwd = process.cwd(), env = process.env } = {}) {
  const envPath = resolve(cwd, '.env');
  let values;

  try {
    values = parseEnv(readFileSync(envPath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }

  for (const [key, value] of Object.entries(values)) {
    if (env[key] === undefined) env[key] = value;
  }

  return envPath;
}
