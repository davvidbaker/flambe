import React, { useState, type FormEvent } from 'react';
import styled from 'styled-components';

import Button from '../components/Button';
import Logo from '../components/Logo/src';

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
const Form = styled.form`
  text-align: left;
  label,
  input { display: block; width: 100%; }
`;

const Register = () => {
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${SERVER}/api/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        user: {
          name: form.get('name'),
          username: form.get('username'),
          credentials: [{ email: form.get('email'), password: form.get('password') }],
        },
      }),
    });

    if (!response.ok) {
      setError('Could not create that account. Try a different username or email.');
      return;
    }

    window.location.assign('/login');
  };

  return (
  <CenterFlex>
    <div className="inner">
      <Padded>
        <Logo size={90} />
      </Padded>
      <h1>Create your account</h1>
      <Form onSubmit={submit}>
        <label htmlFor="register-name">Name</label>
        <input id="register-name" name="name" required />
        <label htmlFor="register-username">Username</label>
        <input id="register-username" name="username" required maxLength={20} />
        <label htmlFor="register-email">Email</label>
        <input id="register-email" name="email" type="email" required />
        <label htmlFor="register-password">Password</label>
        <input id="register-password" name="password" type="password" required minLength={6} />
        <button type="submit">Create account</button>
      </Form>
      {error && <p>{error}</p>}
      <p><a href="/login">Back to login</a></p>
    </div>
  </CenterFlex>
  );
};
export default Register;
