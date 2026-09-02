import type { Preview } from '@storybook/react-vite';

const preview: Preview = {
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0b1020' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
};

export default preview;
