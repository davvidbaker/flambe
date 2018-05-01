import React from 'react';

import Button from './Button';

const Login = () => (
  // fetch(`${SERVER}/auth/github`);
  <div>
    <h1>Login please</h1>
    <a
      onClick={() =>
        window.open(
          `${SERVER}/auth/github`,
          'foo',
          'width=200, height=300, top=0'
        )
      }
      href={'#'}
    >
      Log in with Github
    </a>
  </div>
);
export default Login;
