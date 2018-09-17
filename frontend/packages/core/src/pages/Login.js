import React from 'react';
import styled from 'styled-components';

import Logo from '@flambe/logo';

import Button from '../components/Button';

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

const Form = styled.form`
  text-align: left;
  label,
  input {
    display: block;
    width: 100%;
  }
`;

const Padded = styled.div`
  /* 🤔  maybe bad/weird pattern here*/
  padding: 30px;
  /* background: ; */
`;
const Login = () => (
  <CenterFlex>
    <div className="inner">
      <Padded>
        <Logo isAnimated size={90} />
      </Padded>
      <h1>Log in!</h1>
      <Form
        onSubmit={e => {
          e.preventDefault();
          console.log(`🔥 e`, e) || console.log(`🔥 e.target`, e.target);

          // fetch(`${SERVER}/auth/get-csrf-token`)
          //   .then(res => console.log(`🔥 res`, res) || res.text())
          //   .then(token => {
          //     console.log(`🔥  token`, token);
          fetch(`${SERVER}/auth/identity/callback`, {
            /* ⚠️ PROBABLY NOT WHAT I WANT TO SEND */
            body: e.target.value,
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-csrf-token': token,
            },
          });
          //     });
        }}
      >
        <div>
          <label htmlFor="login-username">Username or Email</label>
          <input type="text" name="username" id="login-username" required />
          <label htmlFor="login-password">Password</label>
          <input type="password" required name="password" id="login-password" />
        </div>
        <button type="submit">Log In</button>
      </Form>
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
export default Login;
