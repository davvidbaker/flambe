import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  font-size: ${props => props.size}px;
  font-family: 'Yesteryear';
  width: max-content;
  position: relative;
  /* font-weight: bold; */

  &::after {
    content: '🔥';
    position: absolute;
    right: 0;
    transform-origin: top right;
    transform: translate(30%, 23%) scale(0.5) rotate(30deg);
    z-index: -1;
  }
`;
const Logo = ({ size }) => <Wrapper size={size}>flambé</Wrapper>;

export default Logo;
