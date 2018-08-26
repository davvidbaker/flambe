import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
/* ⚠️ 🤔 do i need connected router? or could i just use react-router-dom */
import { ConnectedRouter } from 'react-router-redux';

import 'regenerator-runtime/runtime';
// import { AppContainer } from 'react-hot-loader';


import App from './pages';
import store, { history } from './store';

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <App />
    </ConnectedRouter>
  </Provider>,
  document.getElementById('app-root')
);