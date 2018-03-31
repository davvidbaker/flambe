import React, { Fragment } from 'react';
import styled from 'styled-components';

import { colors } from 'styles';

const Div = styled.div`
  background: ${colors.background};
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.2),
    0 2px 6px rgba(0, 0, 0, 0.1);
  max-width: 80%;
  padding: 4px 8px;
  position: absolute;
  pointer-events: none;

  p,
  span,
  div {
    font-size: 11px;
    margin: 0;
  }

  .ending-container {
    display: grid;
    grid-template-columns: 5px 1fr;
    margin-top: 5px;
    border: 1px solid lightgray;
    width: 100%;
    min-height: 5px;

    > div {
      display: flex;
      height: 100%;
      align-items: center;
      justify-content: center;
    }
  }

  .endString {
    padding: 5px;
    color: white;
  }

  .endMessage {
    padding: 5px;
    background: white;
    opacity: 0.9;
  }

  .V {
    background: mediumseagreen;
  }

  .E {
    background: lightgrey;
  }

  .J {
    background: #d9646a;
  }

  .S {
    background: #6746a3;
  }
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
}) => {
  let endString;
  switch (ending) {
    case 'V':
      endString = '✓';
      break;
    case 'J':
      endString = 'X';
      break;
    case 'S':
      endString = '/ /'; // 👈 nbsp
      break;
    case 'E':
    default:
      break;
  }
  return (
    <Div
      innerRef={tooltipRef}
      style={left && top && name ? { left, top } : { top: 0, opacity: 0 }}
    >
      <p>{name}</p>
      {startMessage && <p>{startMessage}</p>}
      {ending && (
        <div className={`ending-container ${ending}`}>
          {ending && <div className={ending} />}
          {endMessage &&
            endMessage.length > 0 && <p className="endMessage">{endMessage}</p>}
        </div>
      )}
      {otherMessages &&
        otherMessages.map(({ startMessage, endMessage }) => (
          <Fragment key={startMessage || endMessage}>
            {startMessage && startMessage}
            {endMessage && endMessage}
          </Fragment>
        ))}
    </Div>
  );
};
export default Tooltip;
