import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

import { viteDevProxy } from './viteRemoteProxy.mjs';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  // Phoenix 1.8 is the application backend. VITE_API_URL defaults to local Mix
  // and can target Fly (or later staging) for frontend-only work.
  const apiTarget = env.VITE_API_URL || 'http://127.0.0.1:4001';
  const socketTarget = env.VITE_SOCKET_URL || apiTarget;
  const useDevProxy = mode === 'development';
  const phoenixStaticDir = '../backend/priv/static/assets';

  return {
    plugins: [
      {
        name: 'flambe-env-favicon',
        transformIndexHtml(html) {
          if (mode !== 'development') return html;
          return html.replace('href="/favicon.png"', 'href="/favicon_dev.png"');
        },
      },
      react({
        babel: {
          babelrc: false,
          configFile: false,
          presets: [
            ['@babel/preset-env', { modules: false }],
            ['@babel/preset-react', { runtime: 'automatic' }],
          ],
          overrides: [
            {
              test: /\.tsx?$/,
              presets: ['@babel/preset-typescript'],
            },
          ],
        },
      }),
    ],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@davvidbaker/flame-chart': path.resolve(configDirectory, 'packages/flame-chart/src/index.ts'),
        components: path.resolve(configDirectory, 'packages/core/src/components'),
        containers: path.resolve(configDirectory, 'packages/core/src/containers'),
        types: path.resolve(configDirectory, 'packages/core/src/types'),
        utilities: path.resolve(configDirectory, 'packages/core/src/utilities'),
      },
    },
    define: {
      // Browser requests must stay same-origin in development. VITE_API_URL
      // selects Vite's proxy target (including Phoenix on port 4001),
      // rather than leaking that separate origin into legacy API call sites.
      SERVER: JSON.stringify(useDevProxy ? '' : env.VITE_API_URL || ''),
      SOCKET_SERVER: JSON.stringify(useDevProxy ? '' : env.VITE_SOCKET_URL || ''),
      NODE_ENV: JSON.stringify(mode),
      FLAMBE_ASSET_SHA: JSON.stringify(
        process.env.VITE_GIT_SHA || process.env.GIT_SHA || env.VITE_GIT_SHA || 'unknown',
      ),
    },
    // Phoenix serves the Vite output directory at /assets. Keep generated
    // files directly in that directory so URLs and on-disk paths match.
    base: mode === 'production' ? '/assets/' : '/',
    // Keep dependency discovery deterministic for this restored workspace.
    optimizeDeps: {
      include: [
        'dayjs',
        'emoji-regex',
        'fuzzaldrin-plus',
        'humanize-duration',
        'phoenix',
        'polished',
        'react',
        'react-dom',
        'react-dom/client',
        'react-redux',
        // React Redux imports this CommonJS selector entry by subpath. Make
        // Vite pre-bundle it so the named export is available in dev mode.
        'use-sync-external-store/with-selector',
        'react-router',
        'react-router-dom',
        'react-select',
        'redux',
        'redux-saga',
        'redux-saga/effects',
        'styled-components',
        'tinycolor2',
        'xstate',
        'react-modal',
        'downshift',
        'hoist-non-react-statics',
        'invariant',
        'lodash',
        'lodash/fp',
        'lodash/fp/curry',
        'lodash/fp/entries',
        'lodash/fp/filter',
        'lodash/fp/findLast',
        'lodash/fp/first',
        'lodash/fp/groupBy',
        'lodash/fp/has',
        'lodash/fp/isUndefined',
        'lodash/fp/last',
        'lodash/fp/map',
        'lodash/fp/pipe',
        'lodash/fp/reduce',
        'lodash/fp/reverse',
        'lodash/fp/sortBy',
        'lodash/fp/tail',
        'lodash/isEqual',
        'lodash/last',
        'lodash/pullAt',
        'lodash/range',
        'lodash/sampleSize',
        'lodash/throttle',
        'lodash/uniq',
        'react-is',
      ],
      noDiscovery: true,
    },
    server: {
      host: 'localhost',
      port: 5173,
      strictPort: true,
      proxy: viteDevProxy(apiTarget, socketTarget),
    },
    build: {
      outDir: path.resolve(configDirectory, phoenixStaticDir),
      assetsDir: '.',
      emptyOutDir: true,
      manifest: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Vite/Rollup module IDs can contain native Windows separators.
            // Normalize them before applying dependency path matching so the
            // production chunk layout is identical on Windows, macOS, Linux.
            const normalizedId = id.replaceAll('\\', '/');

            if (!normalizedId.includes('/node_modules/')) return undefined;
            if (/\/(react|react-dom|react-router|react-redux|redux|redux-saga|scheduler|use-sync-external-store)\//.test(normalizedId)) {
              return 'framework';
            }
            if (/\/(downshift|react-modal|react-select|styled-components|polished|tinycolor2)\//.test(normalizedId)) {
              return 'ui';
            }
            if (/\/(phoenix|xstate)\//.test(normalizedId)) return 'services';
            return 'vendor';
          },
        },
      },
    },
  };
});
