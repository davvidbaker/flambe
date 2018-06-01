import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { popToast as popToastAction } from '../actions';
import Toast from '../components/Toast';

const Wrapper = styled.div`
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 10000;
`;

const toasterRoot = document.querySelector('#toaster-root');
class Toaster extends Component {
  constructor(props) {
    super(props);
    this.el = document.createElement('div');
  }

  componentDidMount() {
    toasterRoot.appendChild(this.el);
  }

  /* ⚠️ But I don't think I'll ever be unmounting... */
  componentWillUnmount() {
    toasterRoot.removeChild(this.el);
  }

  render() {
    const { toaster, popToast } = this.props;
    return ReactDOM.createPortal(
      <Wrapper>
        {toaster.map(({ message, type }, ind) => (
          <Toast
            // /* ⚠️  */maybe bad
            key={`${message}_${ind}`}
            message={message}
            type={type}
            popToast={popToast}
            ind={ind}
          />
        ))}
      </Wrapper>,
      this.el
    );
  }
}

export default connect(
  state => ({ toaster: state.toaster }),
  dispatch => ({ popToast: () => dispatch(popToastAction()) })
)(Toaster);
