import React, { Component } from 'react';
import styled from 'styled-components';
import tinycolor from 'tinycolor2';
// import mdx from 'mdx';

import { colors } from '../styles';

function getColor({ type }) {
  return type === 'error' ? colors.red : 'green';
}
props => (props.type === 'error' ? colors.red : 'green');

const Wrapper = styled.div`
  background: ${getColor};
  font-size: 0.8em;
  border: 1px solid
    ${props =>
    tinycolor(getColor(props))
      .darken(25)
      .toString()};
  border-radius: 2px;
  color: white;
  opacity: 0.9;
  margin: 0.5em;

  div:first-child {
    padding: 0.5em;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 5px;
  position: relative;
  background: pink;

  /* &::after {
    content: ''; */
  /* position: absolute; */
  left: 0;
  bottom: 0;
  animation: slide 10s linear;
  background: linear-gradient(to left, #40e0d0, #ff8c00, #ff0080, transparent);

  animation-play-state: ${props => (props.playing ? 'running' : 'paused')};
  animation-fill-mode: forwards;
  /* height: 100%; */
  width: 100%;
  clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);

  @keyframes slide {
    to {
      clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    }
  }
  /* } */
`;

class Toast extends Component {
  state = {
    playing: true
  };
  componentDidMount() {}

  onMouseEnter = () => {
    this.setState({ playing: false });
  };

  onMouseLeave = () => {
    this.setState({ playing: true });
  };

  pop = () => {
    this.props.popToast(this.props.ind);
  };

  render() {
    return (
      <Wrapper
        type={this.props.type}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
        onClick={this.pop}
      >
        {/* <div>{mdx.sync(this.props.message)}</div> */}
        <div>{this.props.message}</div>
        <ProgressBar playing={this.state.playing} onAnimationEnd={this.pop} />
      </Wrapper>
    );
  }
}
export default Toast;
