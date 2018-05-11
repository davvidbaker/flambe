/* ⚠️ The way I am doing multiple packages in a repo right now is haphazard. Be aware.

/* ⚠️🤯 ACTUALLY, should probably just use Bolt for yarn workspaces instead.
 I am already running into the problem of using babelrc from project root, babel from node_modules, etc when trying to publish this package that exists down in here

 */
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  font-size: ${props => props.size}px;
  font-family: 'Yesteryear', cursive;
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
