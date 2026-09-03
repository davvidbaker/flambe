import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const config: StorybookConfig = {
  stories: ['../packages/core/src/**/*.stories.@(ts|tsx)'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(storybookConfig) {
    return mergeConfig(storybookConfig, {
      define: {
        SERVER: JSON.stringify(''),
        SOCKET_SERVER: JSON.stringify(''),
        NODE_ENV: JSON.stringify('development'),
      },
      resolve: {
        dedupe: ['react', 'react-dom'],
        alias: {
          '@davvidbaker/flame-chart': path.resolve(frontendRoot, 'packages/flame-chart/src/index.ts'),
          components: path.resolve(frontendRoot, 'packages/core/src/components'),
          containers: path.resolve(frontendRoot, 'packages/core/src/containers'),
          types: path.resolve(frontendRoot, 'packages/core/src/types'),
          utilities: path.resolve(frontendRoot, 'packages/core/src/utilities'),
        },
      },
    });
  },
};

export default config;
