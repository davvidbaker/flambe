import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  // Phoenix 1.8 is the normal development backend. Set VITE_API_URL to the
  // legacy server explicitly when comparing behavior during the cutover.
  const apiTarget = env.VITE_API_URL || 'http://127.0.0.1:4001';
  const socketTarget = env.VITE_SOCKET_URL || apiTarget;
  const useDevProxy = mode === 'development';
  const phoenixStaticDir = env.VITE_PHOENIX_TARGET === 'legacy'
    ? '../backend/priv/static/assets'
    : '../backend_next/priv/static/assets';

  return {
    plugins: [
      splitVendorChunkPlugin(),
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
          plugins: ['babel-plugin-styled-components'],
        },
      }),
    ],
    resolve: {
      alias: {
        components: path.resolve(configDirectory, 'packages/core/src/components'),
        containers: path.resolve(configDirectory, 'packages/core/src/containers'),
        types: path.resolve(configDirectory, 'packages/core/src/types'),
        utilities: path.resolve(configDirectory, 'packages/core/src/utilities'),
      },
    },
    define: {
      // Browser requests must stay same-origin in development. VITE_API_URL
      // selects Vite's proxy target (including backend_next on port 4001),
      // rather than leaking that separate origin into legacy API call sites.
      SERVER: JSON.stringify(useDevProxy ? '' : env.VITE_API_URL || ''),
      SOCKET_SERVER: JSON.stringify(useDevProxy ? '' : env.VITE_SOCKET_URL || ''),
      NODE_ENV: JSON.stringify(mode),
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
        'prop-types',
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
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        '/auth': { target: apiTarget, changeOrigin: true },
        '/socket': { target: socketTarget, changeOrigin: true, ws: true },
      },
    },
    build: {
      outDir: path.resolve(configDirectory, phoenixStaticDir),
      assetsDir: '.',
      emptyOutDir: true,
      manifest: true,
    },
  };
});
