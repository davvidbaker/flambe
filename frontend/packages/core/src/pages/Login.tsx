import React, { useState, type FormEvent } from 'react';
import styled from 'styled-components';

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
const Login = () => {
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${SERVER}/auth/identity/callback`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: form.get('email'),
        password: form.get('password'),
      }),
    });

    if (!response.ok) {
      setError('That email and password do not match.');
      return;
    }

    const { data } = await response.json() as {
      data: { trace_id?: number | string; username: string; [key: string]: unknown };
    };
    const existing = JSON.parse(localStorage.getItem('state') || '{}') as { user?: Record<string, unknown> };
    localStorage.setItem('state', JSON.stringify({ ...existing, user: { ...existing.user, ...data }, loggedIn: true }));
    window.location.assign(data.trace_id ? `/${data.username}/traces/${data.trace_id}` : `/${data.username}`);
  };

  return (
  <CenterFlex>
    <div className="inner">
      <Padded>
        <Logo isAnimated size={90} />
      </Padded>
      <h1>Log in!</h1>
      <Form
        onSubmit={submit}
      >
        <div>
          <label htmlFor="login-email">Email</label>
          <input type="email" name="email" id="login-email" required />
          <label htmlFor="login-password">Password</label>
          <input type="password" required name="password" id="login-password" />
        </div>
        <button type="submit">Log In</button>
      </Form>
      {error && <p>{error}</p>}
      <p><a href="/register">Create an account</a></p>
    </div>
  </CenterFlex>
  );
};
export default Login;
