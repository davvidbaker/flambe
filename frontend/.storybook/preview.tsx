import Modal from 'react-modal';
import type { Preview } from '@storybook/react-vite';

import './preview.css';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'app',
      values: [{ name: 'app', value: '#ffffff' }],
    },
  },
  decorators: [
    Story => {
      const root = document.getElementById('storybook-root') ?? document.body;
      Modal.setAppElement(root);
      return <Story />;
    },
  ],
};

export default preview;
