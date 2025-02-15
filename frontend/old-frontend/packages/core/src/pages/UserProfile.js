import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { getUser } from '../reducers/user';

/* ⚠️ fix 'david' */
const UserProfile = ({ name, traces, username = 'david' }) => console.log(`🔥  username`, username) || (
  <div>
    <h1>{name}</h1>
    <div>
      <h2>Traces</h2>
      <ul>
        {traces.map(t => (
          <li key={t.id}>
            <Link to={`/${username}/traces/${t.id}`}>{t.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default connect(state => {
  const user = getUser(state);

  return {
    name: user.name,
    traces: user.traces,
    username: user.username,
  };
})(UserProfile);
