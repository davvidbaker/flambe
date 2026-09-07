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
    width: 100%;
    height: 100%;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }

  *::before, *::after {
    box-sizing: border-box;
  }

  * {
    box-sizing: inherit;
  }

  body {
    position: relative;
    width: 100%;
    height: 100vh;
    height: 100dvh;
    min-height: 100%;
    margin: 0;
    overflow: hidden;
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
    width: 100%;
    height: 100vh;
    height: 100dvh;
    max-height: 100dvh;
    min-width: 0;
    min-height: 0;
  }

  /* The trace page is a column: header + timeline. Let the timeline consume
     the remaining viewport instead of asking it to be 100% tall in addition
     to the header. min-height: 0 is required for nested measured flex panes. */
  main {
    flex: 1 1 auto !important;
    width: 100%;
    min-width: 0;
    min-height: 0;
    height: auto !important;
    overflow: hidden;
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

  /* iOS Safari zooms the page when a focused field is under 16px, which
     combined with overflow:hidden clips the SPA. */
  @media (max-width: 640px) {
    input,
    select,
    textarea {
      font-size: 16px;
    }
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