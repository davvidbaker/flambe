import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { listenLocal } from '../src/local/serve.mjs';

for (const layout of ['root', 'assets']) {
  test(`local server serves ${layout} SPA, favicon, assets, and authenticated deep links`, async () => {
    const directory = mkdtempSync(join(tmpdir(), 'flambe-static-'));
    const staticDir = join(directory, 'static');
    const indexDir = layout === 'root' ? staticDir : join(staticDir, 'assets');
    mkdirSync(indexDir, { recursive: true });
    const html = '<!doctype html><title>Single Burner fixture</title>';
    writeFileSync(join(indexDir, 'index.html'), html);
    writeFileSync(join(indexDir, 'app.js'), 'window.fixture = true;');
    const assetsDir = join(staticDir, 'assets');
    mkdirSync(assetsDir, { recursive: true });
    writeFileSync(join(staticDir, 'favicon.png'), 'production root icon');
    writeFileSync(join(assetsDir, 'favicon.png'), 'production assets icon');
    const localIcon = join(indexDir, 'favicon_single_burner.png');
    writeFileSync(localIcon, 'Single Burner icon');
    const { server, store, port } = await listenLocal({ port: 0, dbPath: join(directory, 'test.sqlite'), staticDir });
    const origin = `http://127.0.0.1:${port}`;
    try {
      for (const path of ['/', '/login', '/local/traces/1']) {
        assert.equal(await (await fetch(origin + path)).text(), html);
      }
      const script = await fetch(`${origin}/${layout === 'root' ? '' : 'assets/'}app.js`);
      assert.match(script.headers.get('content-type'), /javascript/);
      assert.equal(await script.text(), 'window.fixture = true;');
      for (const path of ['/favicon.png', '/assets/favicon.png', '/favicon_single_burner.png', '/assets/favicon_single_burner.png']) {
        const icon = await fetch(origin + path);
        assert.match(icon.headers.get('content-type'), /image\/png/);
        assert.equal(await icon.text(), 'Single Burner icon');
      }
      // Older static bundles without the variant retain their existing icons.
      rmSync(localIcon);
      assert.equal(await (await fetch(`${origin}/favicon.png`)).text(), 'production root icon');
      assert.equal(await (await fetch(`${origin}/assets/favicon.png`)).text(), 'production assets icon');
      assert.equal(await (await fetch(`${origin}/favicon_single_burner.png`)).text(), html);
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
