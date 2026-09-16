import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const packageDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(packageDirectory, '../..');

export default defineConfig(({ mode }) => ({
  root: packageDirectory,
  envDir: packageDirectory,
  plugins: [react()],
  define: {
    SERVER: JSON.stringify(''),
    SOCKET_SERVER: JSON.stringify(''),
    NODE_ENV: JSON.stringify(mode),
    FLAMBE_ASSET_SHA: JSON.stringify('share-viewer'),
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@davvidbaker/flame-chart': path.resolve(frontendRoot, 'packages/flame-chart/src/index.ts'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
  },
  preview: {
    port: 4174,
  },
  build: {
    outDir: path.resolve(packageDirectory, 'dist'),
    emptyOutDir: true,
  },
}));
