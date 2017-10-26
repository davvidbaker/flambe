import React from 'react';

import { colors } from 'styles';

// not using styled components because received this warning
// | 🔴 Consider using style property for frequently changed styles.
const HoverActivity = ({ visible, x, y, width, height }) =>
  (visible
    ? <div
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        background: colors['hover-activity-bg'],
      }}
    />
    : null);

export default HoverActivity;
