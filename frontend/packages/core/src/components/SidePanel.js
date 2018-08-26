import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  background: var(--secondary-panel-background);
  height: 100%;
  overflow: hidden;

  h3 {
    margin-top: 0;
    margin-bottom: 5px;
    text-transform: uppercase;
    font-size: 0.8em;
    font-weight: normal;
    color: var(--secondary-panel-color);
  }
`;

const SidePanel = ({ children }) => {
  return <Wrapper>{children}</Wrapper>;
};

export default SidePanel;
