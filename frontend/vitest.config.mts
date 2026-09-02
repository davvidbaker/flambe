import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
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
