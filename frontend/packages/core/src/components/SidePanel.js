// @flow
import * as React from 'react';
import styled from 'styled-components';
import CloseButton from './CloseButton';

const Wrapper = styled.div`
  background: var(--secondary-panel-background);
  height: 100%;
  overflow: hidden;

  header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    align-items: start;
  }

  h3 {
    padding-top: 5px;
    margin-top: 0;
    margin-left: 5px;
    text-transform: uppercase;
    font-size: 0.8em;
    font-weight: normal;
    color: var(--secondary-panel-color);
  }
`;

type Props = {
  title: string,
  children: React.Element<*>,
  closePanel: () => void,
};

const SidePanel = ({ title, children, closePanel }: Props) => {
  return (
    <Wrapper>
      <header>
        <h3>{title}</h3>
        <CloseButton onClick={closePanel} />
      </header>
      {children}
    </Wrapper>
  );
};

export default SidePanel;
