#!/usr/bin/env node

import { run } from '../src/cli.mjs';
import { loadProjectEnv } from '../src/env.mjs';

loadProjectEnv();

try {
  await run(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
