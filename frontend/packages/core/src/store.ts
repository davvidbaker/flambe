import { createStore, applyMiddleware, compose } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { throttle } from 'lodash/fp';

import { getUser } from './reducers/user';
import { rootReducer, type RootState } from './rootReducer';
import { loadState, saveState } from './utilities';
import { scheduleIdleCallback } from './utilities/requestIdleCallback';
import sagas from './sagas';
import { loadUndoHistory, loadRedoHistory, saveUndoHistory } from './utilities/undoStorage';

export type { RootState };

type DevtoolsCompose = (options: {
  actionsBlacklist: string[];
  stateSanitizer: (state: RootState) => unknown;
}) => typeof compose;

const devtoolsCompose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ as DevtoolsCompose | undefined;
const composeEnhancers = devtoolsCompose
  ? devtoolsCompose({
      actionsBlacklist: ['BLOCK_HOVER', 'KEY_DOWN', 'KEY_UP'],
      stateSanitizer: (state: RootState) => ({
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
    })
  : compose;

// create the saga middleware
const sagaMiddleware = createSagaMiddleware();

const storedState = loadState() as Partial<RootState> | undefined;
const initialState = rootReducer(undefined, { type: '@@flambe/INIT' });
const persistedState = storedState
  ? Object.fromEntries(
      Object.entries(initialState).map(([key, initialValue]) => {
        const storedValue = storedState[key as keyof RootState];
        if (storedValue === undefined) return [key, initialValue];
        if (
          initialValue !== null &&
          storedValue !== null &&
          typeof initialValue === 'object' &&
          typeof storedValue === 'object' &&
          !Array.isArray(initialValue) &&
          !Array.isArray(storedValue)
        ) {
          return [key, { ...initialValue, ...storedValue }];
        }
        return [key, storedValue];
      }),
    ) as RootState
  : undefined;
const store = createStore(
  rootReducer,
  { ...(persistedState ?? initialState), undo: loadUndoHistory(), redo: loadRedoHistory() },
  composeEnhancers(
    applyMiddleware(sagaMiddleware),
  ),
);

sagaMiddleware.run(sagas);

const stateSaver = () => {
  const state = store.getState();
  saveState({
    advancedSearchVisible: state.advancedSearchVisible,
    loggedIn: state.loggedIn,
    operand: state.operand,
    search: state.search,
    settings: state.settings,
    // This kind of state should not be saved to local storage. Should probably instead be a cached response?
    // timeline: getTimeline(state),
    user: getUser(state),
    view: state.view,
    viewThread: state.viewThread,
  });
};

store.subscribe(throttle(1000, () => scheduleIdleCallback(stateSaver)));

export default store;

// Persist undo immediately, so refreshing immediately after a move does not lose it.
let savedUndo = store.getState().undo;
let savedRedo = store.getState().redo;
store.subscribe(() => {
  const history = store.getState().undo;
  const redo = store.getState().redo;
  if (history !== savedUndo || redo !== savedRedo) {
    savedUndo = history; savedRedo = redo; saveUndoHistory(history, redo);
  }
});
