import React, { useState, type FormEvent } from 'react';

import AuthShell, { AuthForm, AuthLogoWrap } from '../components/AuthShell';
import Logo from '../components/Logo/src';

const Register = () => {
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${SERVER}/api/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        invite_code: form.get('invite_code'),
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
    <AuthShell>
      <AuthLogoWrap>
        <Logo size={90} />
      </AuthLogoWrap>
      <h1>Create your account</h1>
      <AuthForm onSubmit={submit}>
        <label htmlFor="register-name">Name</label>
        <input id="register-name" name="name" required />
        <label htmlFor="register-username">Username</label>
        <input id="register-username" name="username" required maxLength={20} />
        <label htmlFor="register-email">Email</label>
        <input id="register-email" name="email" type="email" required />
        <label htmlFor="register-password">Password</label>
        <input id="register-password" name="password" type="password" required minLength={6} />
        <label htmlFor="register-invite">Invite code</label>
        <input id="register-invite" name="invite_code" autoComplete="off" />
        <button type="submit">Create account</button>
      </AuthForm>
      {error && <p>{error}</p>}
      <p><a href="/login">Back to login</a></p>
    </AuthShell>
  );
};
export default Register;
