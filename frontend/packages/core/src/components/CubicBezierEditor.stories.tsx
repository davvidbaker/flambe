import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import CubicBezierEditor from './CubicBezierEditor';
import {
  DEFAULT_PRESET_ZOOM_CURVE,
  type PresetZoomCurve,
} from '../utilities/presetZoomSettings';

const meta = {
  title: 'App/Cubic Bézier Editor',
  component: CubicBezierEditor,
  parameters: {
    layout: 'centered',
    controls: { disable: true },
  },
} satisfies Meta<typeof CubicBezierEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveEditor() {
  const [value, setValue] = useState<PresetZoomCurve>(DEFAULT_PRESET_ZOOM_CURVE);

  return (
    <div style={{ font: '12px sans-serif' }}>
      <CubicBezierEditor value={value} onChange={setValue} />
      <code style={{ display: 'block', marginTop: 10 }}>
        {value.length - 1} connected cubic segments
      </code>
    </div>
  );
}

export const Interactive: Story = {
  args: {
    value: DEFAULT_PRESET_ZOOM_CURVE,
    onChange: () => {},
  },
  render: () => <InteractiveEditor />,
};
