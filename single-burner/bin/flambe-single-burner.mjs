#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { logsUsage, parseLogsArgs, viewLogs } from './logs.mjs';
import { printStartup } from './startup.mjs';

const version = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

const usage = `Flambé Single Burner v${version}

Usage:
  flambe-single-burner [--port <n>] [--db <path>] [--log <path>]
  flambe-single-burner logs [--log <path>] [--db <path>] [--lines <n>] [--no-follow] [--json] [--verbose]

Runs a self-contained local Flambé on loopback with SQLite and the bundled UI.
Use logs to view readable diagnostics without starting another server.

Options:
  --port <n>   Port to listen on (default: 4123)
  --db <path>  SQLite database path (default: ~/.flambe/local.sqlite)
  --log <path> Diagnostic JSONL log (default: <db path>.log; rotates at 5 MiB)
  --version    Show Single Burner and engine versions
  --help       Show this help (logs --help for viewer options)
`;

function takeOption(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return { value: undefined, rest: args };
  const value = args[index + 1];
  if (value === undefined || value.startsWith('--')) throw new Error(`${name} requires a value`);
  return {
    value,
    rest: [...args.slice(0, index), ...args.slice(index + 2)],
  };
}

function parseArgs(args) {
  if (args.includes('--help') || args.includes('-h')) return { help: true };
  let rest = args;
  let port;
  let dbPath;
  let logPath;
  ({ value: logPath, rest } = takeOption(rest, '--log'));
  ({ value: port, rest } = takeOption(rest, '--port'));
  ({ value: dbPath, rest } = takeOption(rest, '--db'));
  if (rest.length > 0) throw new Error(`Unknown option: ${rest[0]}`);

  const parsedPort = port === undefined ? 4123 : Number(port);
  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error('--port must be an integer from 1 to 65535');
  }
  return { help: false, port: parsedPort,
    dbPath: dbPath ?? join(homedir(), '.flambe', 'local.sqlite'), logPath };
}

async function main(args) {
  if (args[0] === 'logs') {
    const options = parseLogsArgs(args.slice(1));
    if (options.help) process.stdout.write(logsUsage);
    else viewLogs(options);
    return;
  }
  if (args.length === 1 && args[0] === '--version') {
    const { engineVersion } = await import('@davvidbaker/flambe-cli/src/local/serve.mjs');
    process.stdout.write(`Single Burner ${version} (engine ${engineVersion})\n`);
    return;
  }
  const options = parseArgs(args);
  if (options.help) { process.stdout.write(usage); return; }

  // Viewing logs/help never loads SQLite or opens a database.
  const { engineVersion, listenLocal } = await import('@davvidbaker/flambe-cli/src/local/serve.mjs');
  const result = await listenLocal({
    port: options.port,
    dbPath: options.dbPath,
    staticDir: fileURLToPath(new URL('../static', import.meta.url)),
    logPath: options.logPath ?? `${options.dbPath}.log`,
    appVersion: version,
  });
  printStartup({ ...result, version, engineVersion });
}

try { await main(process.argv.slice(2)); }
catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
