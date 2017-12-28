import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { createNetworkInterface, ApolloClient } from 'react-apollo';
import thunk from 'redux-thunk'; // ⚠️ do I still need thunks ever, now that I am using apollo client?
import 'regenerator-runtime/runtime';
import createSagaMiddleware from 'redux-saga';
import { routerReducer, routerMiddleware } from 'react-router-redux';
import createHistory from 'history/createBrowserHistory';

import {
  timeline,
  modifiers,
  user,
  operand,
  todosVisible,
  activityDetailsVisible
} from 'reducers';
import { getTimeline } from 'reducers/timeline';
import { loadState, saveState } from 'utilities';
import mainSaga from 'sagas';

// eslint-disable-next-line no-underscore-dangle
const composeEnhancers =
  (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      actionsBlacklist: ['BLOCK_HOVER']
    })) ||
  compose;

const networkInterface = createNetworkInterface({
  uri: 'https://api.graph.cool/simple/v1/cj74c95q70fab0177fwxnf7k3'
});

// create the saga middleware
const sagaMiddleware = createSagaMiddleware();

// Create a history of your choosing (we're using a browser history in this case)
export const history = createHistory();

// Build the middleware for intercepting and dispatching navigation actions
const rMiddleware = routerMiddleware(history);

export const client = new ApolloClient({ networkInterface });

const persistedState = loadState();

const rootReducer = combineReducers({
  timeline,
  modifiers,
  user,
  operand,
  todosVisible,
  activityDetailsVisible,
  router: routerReducer,
  apollo: client.reducer()
});
const store = createStore(
  rootReducer,
  persistedState,
  composeEnhancers(
    applyMiddleware(thunk),
    applyMiddleware(client.middleware()),
    applyMiddleware(rMiddleware),
    applyMiddleware(sagaMiddleware)
  )
);

sagaMiddleware.run(mainSaga);

store.subscribe(() => {
  saveState({
    timeline: getTimeline(store.getState()),
    apollo: store.getState().apollo
  });
});

export default store;
