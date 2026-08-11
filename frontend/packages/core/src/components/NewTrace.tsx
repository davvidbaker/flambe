import React, { Component, type ReactNode } from 'react';
import { connect } from 'react-redux';
import { createTrace } from '../actions';
import { InputFromButton } from './Button';

interface Props { createTrace: (name: string) => unknown }

class NewTrace extends Component<Props> {
  submitNewTrace = (value: string): void => { this.props.createTrace(value); };
  render(): ReactNode {
    return <div><InputFromButton submit={this.submitNewTrace}>New Trace</InputFromButton></div>;
  }
}

export default connect(null, dispatch => ({
  createTrace: (name: string) => dispatch(createTrace(name)),
}))(NewTrace);
