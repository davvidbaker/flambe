import React, { Component, type ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { popToast as popToastAction } from '../actions';
import Toast from '../components/Toast';
import type { Toast as ToastType } from '../reducers/toaster';

const Wrapper = styled.div`
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 10000;
`;

const toasterRoot = document.querySelector<HTMLElement>('#toaster-root');

interface Props {
  popToast: (index: number) => unknown;
  toaster: ToastType[];
}

class Toaster extends Component<Props> {
  el: HTMLDivElement;

  constructor(props: Props) {
    super(props);
    this.el = document.createElement('div');
  }

  componentDidMount() {
    toasterRoot?.appendChild(this.el);
  }

  /* ⚠️ But I don't think I'll ever be unmounting... */
  componentWillUnmount() {
    if (toasterRoot?.contains(this.el)) toasterRoot.removeChild(this.el);
  }

  render(): ReactNode {
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
  (state: { toaster: ToastType[] }) => ({ toaster: state.toaster }),
  dispatch => ({ popToast: (index: number) => dispatch(popToastAction(index)) })
)(Toaster);
