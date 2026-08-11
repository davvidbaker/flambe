import React from 'react';
import { connect } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components';

import Toaster from '../containers/Toaster';
import { getUser } from '../reducers/user';
import { colors } from '../styles';
import type { RootState } from '../store';

import Login from './Login';
import Register from './Register';
import Trace from './Trace';
import UserProfile from './UserProfile';

const GlobalStyle = createGlobalStyle`
  html {
    box-sizing: border-box;
    font-family: sans-serif;
    overflow: hidden;

  }

  *::before, *::after {
    box-sizing: border-box;
  }

  * {
    box-sizing: inherit;
  }

  body {
    position: relative;
    height: 100vh;
    font-size: 12px;
  }

  :root {
    --secondary-panel-background: #F3F3F3;
    --secondary-panel-background-hover: #ddd;
    --secondary-panel-color: #5A5A5A;
  }

  #app-root { 
    transition: transform 0.15s;
    background: ${colors.background};
    height: 100%;
    max-height:100vh;
  }

   .Resizer {
        background: #000;
        opacity: .2;
        z-index: 1;
        box-sizing: border-box;
        background-clip: padding-box;
    }

     .Resizer:hover {
        transition: all 2s ease;
    }

     .Resizer.horizontal {
        height: 11px;
        margin: -5px 0;
        border-top: 5px solid rgba(255, 255, 255, 0);
        border-bottom: 5px solid rgba(255, 255, 255, 0);
        cursor: row-resize;
        width: 100%;
    }

    .Resizer.horizontal:hover {
        border-top: 5px solid rgba(0, 0, 0, 0.5);
        border-bottom: 5px solid rgba(0, 0, 0, 0.5);
    }

    .Resizer.vertical {
        width: 11px;
        margin: 0 -5px;
        border-left: 5px solid rgba(255, 255, 255, 0);
        border-right: 5px solid rgba(255, 255, 255, 0);
        cursor: col-resize;
    }

    .Resizer.vertical:hover {
        border-left: 5px solid rgba(0, 0, 0, 0.5);
        border-right: 5px solid rgba(0, 0, 0, 0.5);
    }
    .Resizer.disabled {
      cursor: not-allowed;
    }
    .Resizer.disabled:hover {
      border-color: transparent;
    }

  .ReactModalPortal > div {
    z-index: 1000;
  }

`;

interface Props { loggedIn: boolean; username?: string }

const AppRoutes = ({ loggedIn, username = 'david' }: Props) => (
    <>
      <GlobalStyle />
      <Routes>
        <Route
          path="/"
          element={<Navigate replace to={loggedIn ? `/${username}/traces/1` : '/login'} />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/:username" element={<UserProfile />} />
        <Route path="/:username/traces/:trace_id/*" element={<Trace />} />
        <Route path="/traces/:trace_id/*" element={<Trace />} />
      </Routes>
      <Toaster />
    </>
);

export default connect((state: RootState) => ({
  /* ⚠️ need to make this a thing */
  loggedIn: state.loggedIn,
  username: getUser(state).username,
}))(AppRoutes);
