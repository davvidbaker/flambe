import type { Meta, StoryObj } from '@storybook/react-vite';

import Toast from './Toast';

const meta = {
  title: 'App/Toast',
  component: Toast,
  parameters: {
    layout: 'padded',
    controls: { disable: true },
  },
  args: {
    ind: 0,
    popToast: () => undefined,
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    message: 'Activity started',
    type: 'success',
  },
};

export const Error: Story = {
  args: {
    message: 'Could not delete that trace',
    type: 'error',
  },
};
