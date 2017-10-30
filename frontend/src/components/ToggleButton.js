import React, { Component } from 'react';
import styled from 'styled-components';
import Button from 'components/Button';

class ToggleButton extends Component {
  state = {
    toggledOn: false,
  };

  constructor() {
    super();
  }

  toggle = () => {
    this.setState({
      toggledOn: !this.state.toggledOn,
    });
  };

  render() {
    return [
      <Button onClick={this.toggle} key="btn">
        {this.props.children}
      </Button>,
      this.state.toggledOn === true ? this.props.toggles(this.toggle) : null,
    ];
  }
}

export default ToggleButton;
