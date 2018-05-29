import React, { Component } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { popToast } from '../actions';
import Toast from '../components/Toast';

const Wrapper = styled.div`
  position: fixed;
  bottom: 0;
  right: 0;
`;

const Toaster = ({ toaster, popToast }) => (
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
  </Wrapper>
);

export default connect(
  state => ({ toaster: state.toaster }),
  dispatch => ({ popToast: () => dispatch(popToast()) })
)(Toaster);
