import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const packageDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  define: {
    SERVER: JSON.stringify(''),
    SOCKET_SERVER: JSON.stringify(''),
  },
  resolve: {
    dedupe: [
      'dayjs',
      'downshift',
      'emoji-regex',
      'fuzzaldrin-plus',
      'humanize-duration',
      'lodash',
      'polished',
      'phoenix',
      'react-modal',
      'react-redux',
      'react-router-dom',
      'redux',
      'redux-saga',
      'tinycolor2',
      'xstate',
    ],
    alias: {
      '@davvidbaker/flame-chart': path.resolve(packageDirectory, 'src/index.ts'),
    },
  },
  build: {
    emptyOutDir: true,
    lib: {
      entry: {
        index: path.resolve(packageDirectory, 'src/index.ts'),
        flambe: path.resolve(packageDirectory, 'src/flambe.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'styled-components',
      ],
    },
  },
});
