import React from 'react';
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

const CloseButton = ({ onClick }) => {
  return (
    <Unbutton title="close" onClick={onClick}>
      <X />
    </Unbutton>
  );
};

export default CloseButton;
