import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from 'react-apollo';
import { AppContainer } from 'react-hot-loader';

import App from 'containers/App';

import store, { client } from 'store';

const render = (Component) => {
  ReactDOM.render(
    <AppContainer>
      <ApolloProvider client={client} store={store}>
        <Component />
      </ApolloProvider>
    </AppContainer>,
    document.getElementById('root')
  );
};

render(App);
// Hot Module Replacement API
if (module.hot) {
  module.hot.accept(() => {
    render(App);
  });
}