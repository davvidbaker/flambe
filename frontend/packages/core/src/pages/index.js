import React from 'react';
import { connect } from 'react-redux';
import { Switch, Route, Redirect, withRouter } from 'react-router';

import Toaster from '../containers/Toaster';
import { getUser } from '../reducers/user';

import Login from './Login';
import Register from './Register';
import Trace from './Trace';
import UserProfile from './UserProfile';
/* ⚠️  */
const Routes = ({ loggedIn, username = 'david' }) =>
  console.log(`🔥  loggedIn`, loggedIn) ||
  console.log(`🔥 username`, username) || (
    <>
      <Switch>
        <Route
          exact
          path="/"
          // /* ⚠️ fix traces/1 */
          render={() => (
            <Redirect to={loggedIn ? `/${username}/traces/1` : '/login'} />
          )}
        />
        <Route
          exact
          path="/login"
          render={() => <Login />} /* component={Login} */
        />
        <Route exact path="/register" render={() => <Register />} />
        <Route exact path="/:username" render={() => <UserProfile />} />
        <Route exact path={`/${username}/traces/:trace_id`} component={Trace} />
        {/* /* ⚠️ this might be wrong. Was done haphazardly
         */}
        <Route path={`/${username}/traces/:trace_id`} component={Trace} />
        {/* <Route exact path="/dashboard" render={() => <Dashboard />} />
      <Route exact path="/editor" render={() => <Editor />} /> */}
        {/* <Route
        exact
        path={`${username}/traces`}
        render={({ match }) => <Trace match={match} />}
      /> */}
      </Switch>
      <Toaster />
    </>
  );

// the reason we need withRouter has to do with context, see more:
// https://stackoverflow.com/questions/42875949/react-router-v4-redirect-not-working?rq=1
export default withRouter(
  connect(state => ({
    /* ⚠️ need to make this a thing */
    loggedIn: state.loggedIn,
    username: getUser(state).username,
  }))(Routes),
);
