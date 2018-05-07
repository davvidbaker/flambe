import React from 'react';
import styled from 'styled-components';

import ActivityBlockDetails from './ActivityBlockDetails';

import { colors } from '../styles';

const Div = styled.div`
  background: ${colors.background};
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.2),
    0 2px 6px rgba(0, 0, 0, 0.1);
  max-width: 80%;
  padding: 4px 8px;
  position: absolute;
  pointer-events: none;

  font-size: 11px;
`;

const Tooltip = ({
  tooltipRef,
  ending,
  name,
  left,
  top,
  startMessage,
  endMessage,
  otherMessages
}) => (
  <Div
    innerRef={tooltipRef}
    style={left && top && name ? { left, top } : { top: 0, opacity: 0 }}
  >
    <div>{name}</div>
    <ActivityBlockDetails
      key={startMessage || endMessage}
      startMessage={startMessage}
      endMessage={endMessage}
      ending={ending}
    />
  </Div>
);
export default Tooltip;
