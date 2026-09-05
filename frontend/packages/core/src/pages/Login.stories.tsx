import type { Meta, StoryObj } from '@storybook/react-vite';

import Login from './Login';

const meta = {
  title: 'App/Login',
  component: Login,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
  },
} satisfies Meta<typeof Login>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
