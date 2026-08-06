const path = require('path');
const { defineConfig, loadEnv } = require('vite');
const react = require('@vitejs/plugin-react');

module.exports = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const apiTarget = env.VITE_API_URL || 'http://[::1]:4000';
  const socketTarget = env.VITE_SOCKET_URL || apiTarget;

  return {
    plugins: [
      react({
        jsxRuntime: 'classic',
        babel: {
          babelrc: false,
          configFile: false,
          presets: [
            ['@babel/preset-env', { modules: false }],
            '@babel/preset-react',
            '@babel/preset-flow',
          ],
          plugins: [
            '@babel/plugin-proposal-optional-chaining',
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-proposal-object-rest-spread',
            '@babel/plugin-proposal-do-expressions',
            ['@babel/plugin-proposal-pipeline-operator', { proposal: 'minimal' }],
            'babel-plugin-styled-components',
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        // The package advertises its uncompiled JSX source as `module`; the
        // legacy compiled entry is the compatible bridge during Phase 1.
        'react-commander': path.resolve(
          __dirname,
          'node_modules/react-commander/lib/index.js',
        ),
        components: path.resolve(__dirname, 'packages/core/src/components'),
        containers: path.resolve(__dirname, 'packages/core/src/containers'),
        types: path.resolve(__dirname, 'packages/core/src/types'),
        utilities: path.resolve(__dirname, 'packages/core/src/utilities'),
      },
    },
    define: {
      // Legacy modules read these as compile-time globals. An empty API value
      // deliberately uses Vite's same-origin proxy during development.
      SERVER: JSON.stringify(env.VITE_API_URL ? apiTarget : ''),
      SOCKET_SERVER: JSON.stringify(env.VITE_SOCKET_URL ? socketTarget : ''),
      NODE_ENV: JSON.stringify(mode),
    },
    // Phoenix serves the Vite output directory at /assets. Keep generated
    // files directly in that directory so URLs and on-disk paths match.
    base: mode === 'production' ? '/assets/' : '/',
    // Vite's dependency scanner runs esbuild before Babel and cannot parse
    // this codebase's Flow annotations and pipeline operators. Disable its
    // automatic discovery and explicitly pre-bundle the app's legacy imports.
    optimizeDeps: {
      include: [
        '@flambe/logo',
        'd3',
        'dayjs',
        'emoji-regex',
        'fuzzaldrin-plus',
        'history',
        'humanize-duration',
        'phoenix',
        'polished',
        'prop-types',
        'react',
        'react-color',
        'react-commander',
        'react-contexify',
        'react-dom',
        'react-draggable',
        'react-measure',
        'react-redux',
        'react-router',
        'react-router-dom',
        'react-router-redux',
        'react-select',
        'react-split-pane',
        'redux',
        'redux-saga',
        'redux-saga/effects',
        'redux-thunk',
        'regenerator-runtime',
        'styled-components',
        'subdivide',
        'swyzzle',
        'tinycolor2',
        'topojson',
        'xstate',
        'xstate/lib/interpreter',
        'react-modal',
        'react-dnd',
        'react-dnd-html5-backend',
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
        'recompose',
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
      outDir: path.resolve(__dirname, '../backend/priv/static/assets'),
      assetsDir: '.',
      emptyOutDir: true,
      manifest: true,
    },
  };
});
