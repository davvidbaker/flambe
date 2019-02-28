import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { routerReducer, routerMiddleware } from 'react-router-redux';
import createHistory from 'history/createBrowserHistory';
import { throttle } from 'lodash/fp';

import * as reducers from './reducers';
import { getTimeline } from './reducers/timeline';
import { getUser } from './reducers/user';
import { loadState, saveState } from './utilities';
import sagas from './sagas';

// eslint-disable-next-line no-underscore-dangle
const composeEnhancers =
  (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      actionsBlacklist: ['BLOCK_HOVER', 'KEY_DOWN', 'KEY_UP'],
      stateSanitizer: state => ({
        ...state,
        user: {
          ...state.user,
          tabs: '<<LOTS OF TABS>>',
          searchTerms: '<<LOTS OF SEARCH TERMS>>',
          attentionShifts: '<<LOTS OF ATTENTION SHIFTS>>',
        },
        timeline: {
          ...state.timeline,
          events: '<<LOTS OF EVENTS>>',
          blocks: '<<LOTS OF BLOCKS>>',
        },
      }),
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
  router: routerReducer,
});
const store = createStore(
  rootReducer,
  persistedState,
  composeEnhancers(
    applyMiddleware(sagaMiddleware),
    applyMiddleware(rMiddleware),
  ),
);

sagaMiddleware.run(sagas);

const stateSaver = () => {
  const state = store.getState();
  saveState({
    activityDetailModalVisible: state.activityDetailModalVisible,
    advancedSearchVisible: state.advancedSearchVisible,
    categoryManagerVisible: state.categoryManagerVisible,
    loggedIn: state.loggedIn,
    operand: state.operand,
    search: state.search,
    settings: state.settings,
    settingsVisible: state.settingsVisible,
    // This kind of state should not be saved to local storage. Should probably instead be a cached response?
    timeline: getTimeline(state),
    user: getUser(state),
    view: state.view,
    viewThread: state.viewThread,
  });
};

store.subscribe(throttle(1000, () => requestIdleCallback(stateSaver)));

export default store;
