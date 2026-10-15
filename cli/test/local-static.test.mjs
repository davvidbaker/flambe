import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { listenLocal } from '../src/local/serve.mjs';

for (const layout of ['root', 'assets']) {
  test(`local server serves ${layout} SPA, assets, and authenticated deep links`, async () => {
    const directory = mkdtempSync(join(tmpdir(), 'flambe-static-'));
    const staticDir = join(directory, 'static');
    const indexDir = layout === 'root' ? staticDir : join(staticDir, 'assets');
    mkdirSync(indexDir, { recursive: true });
    const html = '<!doctype html><title>Single Burner fixture</title>';
    writeFileSync(join(indexDir, 'index.html'), html);
    writeFileSync(join(indexDir, 'app.js'), 'window.fixture = true;');
    const { server, store, port } = await listenLocal({ port: 0, dbPath: join(directory, 'test.sqlite'), staticDir });
    const origin = `http://127.0.0.1:${port}`;
    try {
      for (const path of ['/', '/login', '/local/traces/1']) {
        assert.equal(await (await fetch(origin + path)).text(), html);
      }
      const script = await fetch(`${origin}/${layout === 'root' ? '' : 'assets/'}app.js`);
      assert.match(script.headers.get('content-type'), /javascript/);
      assert.equal(await script.text(), 'window.fixture = true;');
      const login = await fetch(`${origin}/auth/identity/callback`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
      });
      assert.equal(login.status, 200);
      const cookie = login.headers.get('set-cookie').split(';')[0];
      const { data } = await login.json();
      assert.ok(data.trace_id);
      const trace = await fetch(`${origin}/api/traces/${data.trace_id}`, { headers: { cookie } });
      assert.equal(trace.status, 200);
    } finally {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
      store.close();
      rmSync(directory, { recursive: true, force: true });
    }
  });
}
