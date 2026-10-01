import React, { type MouseEventHandler } from 'react';
import Unbutton from './Unbutton';
import styled from 'styled-components';

const X = styled.div`
  background: black;
  width: 1.5em;
  height: 1.5em;
  background: none;
  position: relative;

  &:hover {
    background: lightgrey;
  }

  &:active {
    background: darkgrey;
  }

  &::before,
  &::after {
    content: '';
    background: grey;
    position: absolute;
    top: 0.7em;
    left: 0.25em;

    width: 1em;
    height: 0.2em;
  }

  &:active::before, &:active::after {
    background: white;
  }

  &::before {
    transform: rotate(45deg);
  }

  &::after {
    transform: rotate(-45deg);
  }
`;

const HitTarget = styled(Unbutton)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  margin: -12px -12px -12px 0;
`;

const CloseButton = ({ onClick }: { onClick: MouseEventHandler<HTMLButtonElement> }) => {
  return (
    <HitTarget title="close" onClick={onClick}>
      <X />
    </HitTarget>
  );
};

export default CloseButton;
