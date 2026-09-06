import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  define: {
    SERVER: JSON.stringify(''),
    SOCKET_SERVER: JSON.stringify(''),
    FLAMBE_ASSET_SHA: JSON.stringify('test-asset-sha'),
  },
  resolve: {
    alias: {
      '@davvidbaker/flame-chart': path.resolve(configDirectory, 'packages/flame-chart/src/index.ts'),
    },
  },
  test: {
    globals: true,
    include: ['packages/core/src/**/*.test.ts'],
  },
});
