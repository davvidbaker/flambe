import type { Meta, StoryObj } from '@storybook/react-vite';

import Register from './Register';

const meta = {
  title: 'App/Register',
  component: Register,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
  },
} satisfies Meta<typeof Register>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
