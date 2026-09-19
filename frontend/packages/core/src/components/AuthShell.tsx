import React, { type ReactNode } from 'react';
import styled from 'styled-components';

/** Orange/yellow inset frame used on login and the public share playground. */
export const AuthFrame = styled.div<{ $overflowY?: 'auto' | 'hidden' }>`
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: ${props => props.$overflowY ?? 'hidden'};
  border: 5px solid #ff5826;
  /* Inset frame — outline + invalid outline-box sizing overflowed the
     phone viewport and clipped the right edge. */
  box-shadow: inset 0 0 0 5px #ffd12f;
`;

const Inner = styled.div`
  box-sizing: border-box;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px 20px;
  text-align: center;
`;

export const AuthForm = styled.form`
  width: min(100%, 320px);
  text-align: left;

  label {
    display: block;
    margin-top: 12px;
    font-size: 14px;
  }

  input {
    display: block;
    width: 100%;
    box-sizing: border-box;
    min-height: 44px;
    margin-top: 4px;
    padding: 8px 10px;
    font-size: 16px;
  }

  button[type='submit'] {
    margin-top: 16px;
    min-height: 44px;
    padding: 8px 16px;
    font-size: 16px;
  }
`;

export const AuthLogoWrap = styled.div`
  padding: 12px 0 8px;
`;

const AuthShell = ({ children }: { children: ReactNode }) => (
  <AuthFrame data-auth-shell="true" $overflowY="auto">
    <Inner>{children}</Inner>
  </AuthFrame>
);

export default AuthShell;
