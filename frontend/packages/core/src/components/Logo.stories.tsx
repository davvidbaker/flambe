import type { Meta, StoryObj } from '@storybook/react-vite';

import Logo from './Logo/src';

const meta = {
  title: 'App/Logo',
  component: Logo,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: 90,
  },
};

export const Animated: Story = {
  args: {
    size: 90,
    isAnimated: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ padding: 32 }}>
      {[40, 80, 120].map(size => (
        <Logo key={size} size={size} />
      ))}
    </div>
  ),
};
