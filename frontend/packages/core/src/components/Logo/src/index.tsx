import React from 'react';
import styled from 'styled-components';
import mark from '../../../../../../branding/flambe.png';

const Wrapper = styled.div`
  position: relative;
  width: max-content;
  z-index: 1;
`;

const H1 = styled.h1<{ $isAnimated?: boolean; $size: number }>`
  font-size: ${props => props.$size}px;
  font-family: 'Yesteryear', cursive, sans-serif;
  position: relative;
  font-weight: normal;

  &::after {
    content: '';
    background: url(${mark}) center / contain no-repeat;
    width: 1em;
    height: 1em;
    position: absolute;
    right: 0;
    transform-origin: top right;
    transform: translate(29%, 37%) scale(0.5) rotate(30deg);
    z-index: -2;
    filter: hue-rotate(0);
    animation: ${props => props.$isAnimated ? 'rotateHue 1s infinite alternate' : 'none'};
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
`;

const Logo = ({ size, isAnimated }: { size?: number; isAnimated?: boolean }) => (
  <Wrapper>
    <H1 $isAnimated={isAnimated} $size={size || 40}>
      flambé
    </H1>
  </Wrapper>
);

export default Logo;
