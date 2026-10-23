import http from 'node:http';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { handleLocalRequest } from './http.mjs';
import { LocalStore } from './store.mjs';
import { createLocalMcpHandler } from './mcp.mjs';
import { createLocalCommandRunner } from './reducer.mjs';

/** Kept in sync with the copy in cli.mjs, which must not import this module eagerly. */
export function defaultDbPath() {
  return join(homedir(), '.flambe', 'local.sqlite');
}

export function defaultStaticDir() {
  return resolve(fileURLToPath(new URL('../../../backend/priv/static', import.meta.url)));
}

export function createLocalServer({ dbPath = defaultDbPath(), staticDir, reducer } = {}) {
  const store = new LocalStore(dbPath);
  let runCommand;
  try { runCommand = createLocalCommandRunner(store, reducer); }
  catch (error) { store.close(); throw error; }
  const resolvedStatic = staticDir === undefined ? defaultStaticDir() : staticDir;
  const mcp = createLocalMcpHandler(store, runCommand);
  const server = http.createServer((req, res) => {
    handleLocalRequest(store, req, res, { staticDir: resolvedStatic, mcp, runCommand }).catch(error => {
      if (!res.headersSent) {
        res.writeHead(500, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'INTERNAL' }));
      }
      console.error(error);
    });
  });
  server.store = store;
  server.reducerInfo = runCommand.info;
  server.on('close', () => { void mcp.close(); });
  return server;
}

export function listenLocal({
  host = '127.0.0.1',
  port = 4001,
  dbPath,
  staticDir,
  reducer,
} = {}) {
  if (host !== '127.0.0.1' && host !== 'localhost') {
    throw new Error('Local mode binds loopback only (127.0.0.1). Refusing --host ' + host);
  }

  const server = createLocalServer({ dbPath, staticDir, reducer });
  return new Promise((resolveListen, reject) => {
    server.listen(port, host, () => {
      const address = server.address();
      resolveListen({ server, store: server.store, host, port: address.port, reducerInfo: server.reducerInfo });
    });
    server.on('error', reject);
  });
}

export function printServeBanner({ host, port, store, reducerInfo }, stdout = process.stdout) {
  const { rawToken, traceId } = store.credentials();
  const origin = `http://${host}:${port}`;
  stdout.write(`Flambe local on ${origin} (SQLite, loopback only)\n`);
  stdout.write(`AI reducer: ${reducerInfo?.mode ?? 'off'}${reducerInfo?.model ? ` (${reducerInfo.model})` : ''}\n`);
  stdout.write(`FLAMBE_URL=${origin}\n`);
  stdout.write('FLAMBE_RUNTIME_MODE=local_self_contained\n');
  stdout.write(`FLAMBE_API_TOKEN=${rawToken}\n`);
  stdout.write(`FLAMBE_TRACE_ID=${traceId}\n`);
}
