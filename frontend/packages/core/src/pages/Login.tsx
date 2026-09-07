import React, { useState, type FormEvent } from 'react';

import AuthShell, { AuthForm, AuthLogoWrap } from '../components/AuthShell';
import Logo from '../components/Logo/src';

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
    <AuthShell>
      <AuthLogoWrap>
        <Logo isAnimated size={90} />
      </AuthLogoWrap>
      <h1>Log in!</h1>
      <AuthForm onSubmit={submit}>
        <label htmlFor="login-email">Email</label>
        <input type="email" name="email" id="login-email" required />
        <label htmlFor="login-password">Password</label>
        <input type="password" required name="password" id="login-password" />
        <button type="submit">Log In</button>
      </AuthForm>
      {error && <p>{error}</p>}
      <p><a href="/register">Create an account</a></p>
    </AuthShell>
  );
};
export default Login;
