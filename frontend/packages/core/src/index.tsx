import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import App from './pages';
import store from './store';

const rootElement = document.getElementById('app-root');

if (!rootElement) {
  throw new Error('Unable to find #app-root');
}

createRoot(rootElement).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
);
