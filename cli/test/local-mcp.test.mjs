import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import test from 'node:test';
import { listenLocal } from '../src/local/serve.mjs';
import { LocalStore } from '../src/local/store.mjs';

async function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'flambe-mcp-'));
  const dbPath = join(dir, 'local.sqlite');
  const { server, store, port } = await listenLocal({ port: 0, dbPath, staticDir: null });
  const { rawToken, traceId } = store.credentials();
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const url = `http://127.0.0.1:${port}`;
  let id = 0;
  async function rpc(method, params = {}, { modern = false, headers = {} } = {}) {
    const version = '2026-07-28';
    const response = await fetch(`${url}/mcp`, {
      method: 'POST', headers: {
        authorization: `Bearer ${rawToken}`,
        accept: 'application/json, text/event-stream', 'content-type': 'application/json',
        ...(modern ? { 'mcp-protocol-version': version, 'mcp-method': method,
          ...(params.name ? { 'mcp-name': params.name } : {}) } : {}), ...headers,
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params: {
        ...params, ...(modern ? { _meta: {
          'io.modelcontextprotocol/protocolVersion': version,
          'io.modelcontextprotocol/clientInfo': { name: 'flambe-test', version: '1' },
          'io.modelcontextprotocol/clientCapabilities': {},
        } } : {}),
      } }),
    });
    const text = await response.text();
    const body = response.headers.get('content-type')?.includes('text/event-stream')
      ? JSON.parse(text.split('\n').filter(line => line.startsWith('data:')).at(-1).slice(5))
      : JSON.parse(text);
    return { status: response.status, body };
  }
  async function call(name, args = {}, options) {
    const { status, body } = await rpc('tools/call', { name: `flambe_${name}`, arguments: args }, options);
    assert.equal(status, 200, JSON.stringify(body));
    assert.equal(body.error, undefined, JSON.stringify(body));
    return body.result;
  }
  return { store, traceId, rawToken, dbPath, url, rpc, call };
}

test('OAuth discovery probes return 404 without exposing the setup page or local token', async t => {
  const { url, rawToken } = await fixture(t);
  for (const path of ['/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/mcp', '/.well-known/oauth-authorization-server', '/.well-known/openid-configuration']) {
    const response = await fetch(url + path);
    assert.equal(response.status, 404);
    const body = await response.text();
    assert.equal(body.includes(rawToken), false);
    assert.deepEqual(JSON.parse(body), { error: 'NOT_FOUND' });
  }
});

for (const modern of [false, true]) {
  test(`${modern ? 'modern' : 'legacy'} MCP discovers Single Burner and shares lifecycle state with REST`, async t => {
    const { store, traceId, rawToken, dbPath, url, rpc, call } = await fixture(t);
    const opening = modern
      ? await rpc('server/discover', {}, { modern })
      : await rpc('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
    assert.equal(opening.status, 200, JSON.stringify(opening.body));
    const serverInfo = opening.body.result.serverInfo
      ?? opening.body.result._meta?.['io.modelcontextprotocol/serverInfo'];
    assert.match(serverInfo?.title ?? '', /Single Burner/, JSON.stringify(opening.body));
    const discovery = await call('traces', {}, { modern });
    const instance = discovery.structuredContent.instance;
    assert.deepEqual(instance, store.instance());
    assert.equal(instance.name, 'Single Burner');
    assert.equal(discovery.structuredContent.default_trace_id, traceId);
    assert.deepEqual(JSON.parse(discovery.content[0].text).instance, instance);
    assert.equal(JSON.stringify(discovery).includes(rawToken), false);
    assert.equal(JSON.stringify(discovery).includes(dbPath), false);
    const listed = await rpc('tools/list', {}, { modern });
    assert.equal(listed.body.result.tools.length, 8);
    assert.ok(listed.body.result.tools.every(tool => tool.description.includes('Single Burner')));
    const startTool = listed.body.result.tools.find(tool => tool.name === 'flambe_start');
    assert.ok(startTool.inputSchema.required.includes('expected_instance_id'));
    const args = { trace_id: traceId, expected_instance_id: instance.id, agent_id: 'chatgpt:test', platform: 'ChatGPT' };
    const root = await call('start', { ...args, name: 'MCP root', parent_id: null }, { modern });
    assert.equal(root.isError, false, JSON.stringify(root));
    const child = await call('start', { ...args, name: 'MCP child' }, { modern });
    assert.equal(child.structuredContent.state.activities.at(-1).parentId, root.structuredContent.activity_id);
    const closed = await call('end', { ...args, activity_id: child.structuredContent.activity_id, message: 'Verified' }, { modern });
    assert.equal(closed.isError, false);
    assert.deepEqual(closed.structuredContent.instance, instance);
    const response = await fetch(`${url}/api/agent-commands`, {
      method: 'POST', headers: { authorization: `Bearer ${rawToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ command: 'status', arguments: { trace_id: traceId } }),
    });
    const rest = (await response.json()).data.state;
    assert.equal(rest.activities.find(activity => activity.id === child.structuredContent.activity_id).status, 'ended');
  });
}

test('MCP rejects a missing or foreign instance before reading or writing overlapping trace ids', async t => {
  const first = await fixture(t);
  const second = await fixture(t);
  assert.equal(first.traceId, second.traceId);
  assert.notEqual(first.store.instance().id, second.store.instance().id);
  for (const expected of [undefined, first.store.instance().id, 'https://flambe.fly.dev']) {
    for (const command of ['start', 'plan', 'status', 'message', 'end', 'suspend', 'resume']) {
      const response = await second.call(command, {
        trace_id: second.traceId, expected_instance_id: expected, name: 'Wrong destination',
        activity_id: 1, message: 'Wrong destination',
      });
      assert.equal(response.isError, true);
      assert.equal(response.structuredContent.code, expected ? 'INSTANCE_MISMATCH' : 'INSTANCE_REQUIRED');
      assert.deepEqual(response.structuredContent.instance, second.store.instance());
    }
  }
  assert.equal(first.store.getTrace(1, first.traceId).events.length, 0);
  assert.equal(second.store.getTrace(1, second.traceId).events.length, 0);
  assert.deepEqual(second.store.listUnstarted(second.traceId), []);
});

test('MCP requires its bearer token; browser sessions, foreign hosts and origins cannot reach tools', async t => {
  const { rpc, url } = await fixture(t);
  for (const headers of [
    { authorization: '' },
    { authorization: 'Bearer invalid' },
    { authorization: '', cookie: 'flambe_user=1' },
  ]) {
    assert.equal((await rpc('tools/list', {}, { headers })).status, 401);
  }
  const badHostStatus = await new Promise((resolve, reject) => {
    const request = http.request(`${url}/mcp`, { method: 'POST', headers: { host: 'attacker.example' } }, response => {
      response.resume();
      resolve(response.statusCode);
    });
    request.on('error', reject);
    request.end();
  });
  assert.equal(badHostStatus, 403);
  assert.equal((await rpc('tools/list', {}, { headers: { origin: 'http://localhost:5173' } })).status, 403);
  assert.equal((await rpc('tools/list', {}, { headers: { origin: 'https://attacker.example' } })).status, 403);
});

test('MCP errors retain identity and unavailable local review never substitutes another server', async t => {
  const { call, store, traceId } = await fixture(t);
  const args = { trace_id: traceId, expected_instance_id: store.instance().id };
  const started = await call('start', { ...args, name: 'Local work' });
  assert.equal(started.isError, false);
  const before = store.getTrace(1, traceId).events.length;
  const reviewed = await call('message', { ...args, activity_id: started.structuredContent.activity_id, message: 'Check scope' });
  assert.equal(reviewed.isError, true);
  assert.equal(reviewed.structuredContent.code, 'REDUCER_NOT_CONFIGURED');
  assert.deepEqual(reviewed.structuredContent.instance, store.instance());
  assert.equal(store.getTrace(1, traceId).events.length, before);
  const invalid = await call('start', { ...args, name: '' });
  assert.equal(invalid.isError, true);
  assert.equal(invalid.structuredContent.code, 'INVALID_INPUT');
});

test('Single Burner identity survives reopening its database and does not follow exports to another database', t => {
  const dir = mkdtempSync(join(tmpdir(), 'flambe-instance-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'persistent.sqlite');
  const first = new LocalStore(path);
  const identity = first.instance();
  first.close();
  const reopened = new LocalStore(path);
  assert.deepEqual(reopened.instance(), identity);
  assert.equal(JSON.stringify(reopened.exportBundle()).includes(identity.id), false);
  reopened.close();
  const other = new LocalStore(join(dir, 'other.sqlite'));
  assert.notEqual(other.instance().id, identity.id);
  other.close();
});
