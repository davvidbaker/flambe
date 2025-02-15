import React from 'react';
import styled from 'styled-components';

import Button from '../components/Button';
import Logo from '@flambe/logo';

const CenterFlex = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  outline: 5px solid #ffd12f;
  outline-offset: -10px;
  border: 5px solid #ff5826;

  box-sizing: outline-box;

  .inner {
    padding: 20px;
    text-align: center;
    /* border: 3px solid #FFD12F; */
  }
`;

const Padded = styled.div`
  /* 🤔  maybe bad/weird pattern here*/
  padding: 30px;
  /* background: ; */
`;
const Register = () => (
  <CenterFlex>
    <div className="inner">
      <Padded>
        <Logo size={90} className="padded" />
      </Padded>
      <h1>Log in please</h1>
      <a
        // onClick={() =>
        //   window.open(
        //     `${SERVER}/auth/github`,
        //     'foo',
        //     'width=200, height=300, top=0'
        //   )
        // }
        href={`${SERVER}/auth/github`}
      >
        Log in with Github
      </a>
    </div>
  </CenterFlex>
);
export default Register;
