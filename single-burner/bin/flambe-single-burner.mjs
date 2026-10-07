#!/usr/bin/env node

import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  listenLocal,
  printServeBanner,
} from '@davvidbaker/flambe-cli/src/local/serve.mjs';

const usage = `Flambé Single Burner

Usage:
  flambe-single-burner [--port <n>] [--db <path>]

Runs a self-contained local Flambé on loopback with SQLite and the bundled UI.

Options:
  --port <n>   Port to listen on (default: 4001)
  --db <path>  SQLite database path (default: ~/.flambe/local.sqlite)
  --help       Show this help
`;

function takeOption(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return { value: undefined, rest: args };
  const value = args[index + 1];
  if (value === undefined) throw new Error(`${name} requires a value`);
  return {
    value,
    rest: [...args.slice(0, index), ...args.slice(index + 2)],
  };
}

function parseArgs(args) {
  if (args.includes('--help') || args.includes('-h')) {
    return { help: true };
  }

  let rest = args;
  let port;
  let dbPath;
  ({ value: port, rest } = takeOption(rest, '--port'));
  ({ value: dbPath, rest } = takeOption(rest, '--db'));
  if (rest.length > 0) throw new Error(`Unknown option: ${rest[0]}`);

  const parsedPort = port === undefined ? 4001 : Number(port);
  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error('--port must be an integer from 1 to 65535');
  }

  return {
    help: false,
    port: parsedPort,
    dbPath: dbPath ?? join(homedir(), '.flambe', 'local.sqlite'),
  };
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage);
    process.exit(0);
  }

  const staticDir = fileURLToPath(new URL('../static', import.meta.url));
  const result = await listenLocal({
    port: options.port,
    dbPath: options.dbPath,
    staticDir,
  });
  printServeBanner(result);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
