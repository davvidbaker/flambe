import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  position: relative;
  width: max-content;
  z-index: 1;
`;

const H1 = styled.h1`
  font-size: ${props => props.size}px;
  font-family: 'Yesteryear', cursive, sans-serif;
  position: relative;
  font-weight: normal;

  &::after {
    content: '🔥';
    position: absolute;
    right: 0;
    transform-origin: top right;
    transform: translate(31%, 23%) scale(0.5) rotate(30deg);
    z-index: -2;
  ${props =>
    (!props.isAnimated
      ? `
  }`
      : `
    filter: hue-rotate(0);
    animation: rotateHue 1s infinite alternate;
  }

  &:hover {
    &::after {
      animation: bluerRotate 0.5s infinite alternate linear;
    }
  }


  @keyframes rotateHue {
    to {
      filter: hue-rotate(-45deg);
    }
  }

  @keyframes bluerRotate {
    to {
      filter: hue-rotate(-180deg);
    }
  }
  `)}
`;

const Logo = ({ size, isAnimated }) => (
  <Wrapper>
    <H1 isAnimated={isAnimated} size={size || 40}>
      flambé
    </H1>
  </Wrapper>
);

export default Logo;
