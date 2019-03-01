import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
/* ⚠️ 🤔 do i need connected router? or could i just use react-router-dom */
import { Router } from 'react-router-dom';

console.log(`🔥  ReactDOM`, ReactDOM);

import App from './pages';
import store, { history } from './store';

ReactDOM.render(
  <Provider store={store}>
    <Router history={history}>
      <App />
    </Router>
  </Provider>,
  document.getElementById('app-root')
);