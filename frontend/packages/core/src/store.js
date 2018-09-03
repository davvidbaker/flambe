import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import 'regenerator-runtime/runtime';
import createSagaMiddleware from 'redux-saga';
import { routerReducer, routerMiddleware } from 'react-router-redux';
import createHistory from 'history/createBrowserHistory';

import * as reducers from './reducers';
import { getTimeline } from './reducers/timeline';
import { getUser } from './reducers/user';
import { loadState, saveState } from './utilities';
import sagas from './sagas';

// eslint-disable-next-line no-underscore-dangle
const composeEnhancers =
  (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      actionsBlacklist: ['BLOCK_HOVER']
    })) ||
  compose;

// create the saga middleware
const sagaMiddleware = createSagaMiddleware();

// Create a history of your choosing (we're using a browser history in this case)
export const history = createHistory();

// Build the middleware for intercepting and dispatching navigation actions
const rMiddleware = routerMiddleware(history);

const persistedState = loadState();

const rootReducer = combineReducers({
  ...reducers,
  router: routerReducer
});
const store = createStore(
  rootReducer,
  persistedState,
  composeEnhancers(
    applyMiddleware(sagaMiddleware),
    applyMiddleware(rMiddleware)
  )
);

sagaMiddleware.run(sagas);

store.subscribe(() => {
  const state = store.getState();
  saveState({
    activityDetailModalVisible: state.activityDetailModalVisible,
    categoryManagerVisible: state.categoryManagerVisible,
    operand: state.operand,
    search: state.search,
    settings: state.settings,
    settingsVisible: state.settingsVisible,
    timeline: getTimeline(state),
    user: getUser(state),
    view: state.view,
    viewThread: state.viewThread
  });
});

export default store;
