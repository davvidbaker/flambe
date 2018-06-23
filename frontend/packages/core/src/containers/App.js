// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import last from 'lodash/fp/last';

// flow-ignore
import { ConnectedRouter } from 'react-router-redux';
import { Route } from 'react-router';
import { DragDropContext, DragDropManager } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { injectGlobal } from 'styled-components';
import Commander from 'react-commander';
import Modal from 'react-modal';
import Toaster from './Toaster';
import Dashboard from './Dashboard';
import ConnectedTimeline from './ConnectedTimeline';
import SingleThreadView from './SingleThreadView';
import Editor from './Editor';
// import Todos from './Todos';
import Login from '../components/Login';
import Register from '../components/Register';
import Header from '../components/Header';
import { colors } from '../styles';
import WithEventListeners from '../components/WithEventListeners';
import CategoryManager from '../components/CategoryManager';
import Settings from '../components/Settings';
import { history } from '../store';
import {
  collapseAllThreads,
  deleteCurrentTrace,
  deleteTrace,
  expandAllThreads,
  fetchTrace,
  fetchUser,
  keyDown,
  keyUp,
  runCommand,
  selectTrace,
  showActivityDetails,
  showSettings,
  createMantra,
  createToast,
  FIND
} from '../actions';
import COMMANDS, { ACTIVITY_COMMANDS } from '../constants/commands';
import { getTimeline } from '../reducers/timeline';
import { getUser } from '../reducers/user';
import isEndable from '../utilities/isEndable';

import type { Trace } from '../types/Trace';
import type { Todo } from '../types/Todo';

Modal.setAppElement('#app-root');

// eslint-disable-next-line babel/no-unused-expressions
injectGlobal`
  html {
    box-sizing: border-box;
    font-family: sans-serif;
    overflow: hidden;

  }

  *::before, *::after {
    box-sizing: border-box;
  }

  * {
    box-sizing: inherit;
  }

  body {
    /* background: linear-gradient(to top, #40e0d0, #ff8c00, transparent); */
    position: relative;

    &::before, &::after {
      z-index: -1;
      content: '';
      position: absolute;
      top: 0;
      width: 100vw;
      height: 100vh;
      opacity: var(--body-after-opacity, 1);
      transition: opacity 0.15s;
    }
    
    &::after {
      background: linear-gradient(to top, transparent, #ff8c00, #ff0080);
    }
    &::before {
      background: linear-gradient(to top, #40e0d0, #ff8c00, transparent);
    }
  }

  :root {
    --root-scale: 1;
    --body-after-opacity: 0.1;
  }

  #app-root { 
    transition: transform 0.15s;
    transform: scale(var(--root-scale, 1));
    background: ${colors.background};
    max-height:100vh;
  }
`;

class App extends React.Component<
  {
    keyDown: () => mixed,
    keyUp: () => mixed,
    selectTrace: (trace: Trace) => mixed,
    trace: ?Trace,
    user: { id: string, name: string },
    userTraces: (?Trace)[],
    userTodos: (?Todo)[],
    todosVisible: boolean
  },
  { commanderVisible: boolean }
> {
  state = {
    commanderVisible: false,
    additionalCommands: []
  };

  componentDidCatch(e, info) {
    console.log('component did catch', e);
    createToast(`${(e, info)}. Top level error.`, 'error');
  }

  componentWillMount() {
    /** ⚠️ come back */
    this.props.fetchUser(this.props.user.id);

    if (!this.props.user) {
      // this.props.fetchUser(this.props.user.id)
    } else if (this.props.trace) {
      this.props.fetchTrace(this.props.trace);
    }
  }

  componentDidMount() {
    // impure!
    const createKeyEvent = (DOMEvent: string, propFn: () => mixed) => {
      document.addEventListener(DOMEvent, e => {
        // flow-ignore
        switch (e.key) {
          case 'Shift':
            // flow-ignore
            propFn(e.key);
            break;

          default:
            break;
        }
      });
    };

    window.addEventListener('blur', e => {
      document.documentElement.style.setProperty('--root-scale', '0.975');
      document.documentElement.style.setProperty('--body-after-opacity', '1');
    });
    window.addEventListener('focus', e => {
      document.documentElement.style.setProperty('--root-scale', '1');
      document.documentElement.style.setProperty('--body-after-opacity', '0.1');
    });

    createKeyEvent('keydown', this.props.keyDown);
    createKeyEvent('keyup', this.props.keyUp);
  }

  getItems = selector => selector(this.props);

  addCommand = command => {
    this.setState(state => ({
      additionalCommands: [command, ...state.additionalCommands]
    }));
  };

  submitCommand = command => {
    this.hideCommander();
    this.props.runCommand(this.props.operand, command);
  };

  showCommander = () => {
    this.setState({ commanderVisible: true });
  };

  hideCommander = () => {
    this.setState({ commanderVisible: false });
  };

  renderTimeline = route => {
    const trace_id = route.match.params.trace_id
      ? route.match.params.trace_id
      : this.props.trace && this.props.trace.id;

    return trace_id ? (
      <ConnectedTimeline
        trace_id={trace_id}
        user={this.props.user}
        key="timeline"
        /* ⚠️ I don't like this api too much. Should mabye use context? */
        addCommand={this.addCommand}
      />
    ) : null;
  };

  getCommands = operand => {
    const baseCommands = [...COMMANDS, ...this.state.additionalCommands];

    if (operand) {
      switch (operand.type) {
        case 'activity':
          return [
            ...ACTIVITY_COMMANDS.filter(cmd => cmd.status.indexOf(operand.activityStatus) >= 0),
            ...baseCommands
          ];
        default:
          return baseCommands;
      }
    }
    return baseCommands;
  };

  render() {
    const eventListeners = [
      [
        'keydown',
        e => {
          if (e.repeat) return;

          if (e.shiftKey && (e.metaKey || e.ctrlKey) && e.key === 'p') {
            /** 💁 By default, if chrome devtools are open, this will pull up their command palette, even if focus is in the page, not dev tools. */
            e.preventDefault();
            this.showCommander();
          }

          if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
            e.preventDefault();
            this.showCommander();
            this.commander.enterCommand(COMMANDS.find(({ action }) => action === FIND));
          }

          if (e.key === ',' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            this.props.showSettings();
          }

          if (
            e.target.nodeName !== 'INPUT' &&
            e.target.nodeName !== 'TEXTAREA'
          ) {
            if (e.shiftKey && e.key === '}') {
              this.props.expandAllThreads();
            } else if (e.shiftKey && e.key === '{') {
              this.props.collapseAllThreads();
            }
          }
        }
      ],
      [
        'keyup',
        e => {
          if (
            this.props.operand &&
            e.target.nodeName !== 'INPUT' &&
            e.target.nodeName !== 'TEXTAREA'
          ) {
            switch (this.props.operand.type) {
              case 'activity':
                if (e.code === 'Space') {
                  this.props.showActivityDetails();
                } else {
                  switch (e.key) {
                    case 'e':
                    case 'v':
                    case 'j':
                      if (
                        isEndable(
                          this.props.activities[this.props.operand.activity_id],
                          this.props.blocks.filter(block =>
                            block.activity_id ===
                              this.props.operand.activity_id),
                          this.props.threadLevels
                        )
                      ) {
                        this.showCommander();
                        this.commander.enterCommand(this.getCommands(this.props.operand).find(cmd => cmd.shortcut === e.key.toUpperCase()));
                      }
                      break;
                    case 's':
                      /* ⚠️ not great code ahead */
                      if (
                        this.props.activities[this.props.operand.activity_id]
                          .status === 'active'
                      ) {
                        this.showCommander();
                        this.commander.enterCommand(ACTIVITY_COMMANDS.find(({ shortcut }) => shortcut === 'S'));
                      }
                    default:
                      break;
                  }
                }
                break;
              default:
                break;
            }
          }
        }
      ]
    ];
    return (
      <ConnectedRouter history={history}>
        <WithEventListeners eventListeners={eventListeners} node={document}>
          {() => (
            <div>
              <Route exact path="/login" render={() => <Login />} />
              <Route exact path="/register" render={() => <Register />} />
              <Route exact path="/dashboard" render={() => <Dashboard />} />
              <Route exact path="/editor" render={() => <Editor />} />
              {/* /* ⚠️ I might have fucked up the route logic */}
              <Route
                path="/"
                render={() => (
                  <>
                    <Header
                      traces={this.props.user.traces}
                      currentTrace={this.props.trace}
                      selectTrace={this.props.selectTrace}
                      deleteTrace={this.props.deleteTrace}
                      deleteCurrentTrace={this.props.deleteCurrentTrace}
                      currentMantra={
                        this.props.user && last(this.props.user.mantras).name
                      }
                      createMantra={name => this.props.createMantra(name)}
                    />
                    <main>
                      {do {
                        if (this.props.view === 'multithread') {
                          <>
                            <Route
                              exact
                              path="/traces/:trace_id"
                              render={this.renderTimeline}
                            />
                            <Route
                              exact
                              path="/"
                              render={this.renderTimeline}
                            />
                            {/* {this.props.todosVisible && (
                              <Todos todos={this.props.user.todos} />
                            )} */}'
                          </>;
                        } else if (this.props.view === 'singlethread') {
                          <>
                            <SingleThreadView
                              thread={this.props.threads[this.props.viewThread]}
                            />
                          </>;
                        }
                      }}
                    </main>
                    <CategoryManager categories={this.props.categories} />
                    <Settings />
                    <Commander
                      withBuildup
                      isOpen={this.state.commanderVisible}
                      commands={this.getCommands(this.props.operand)}
                      onSubmit={this.submitCommand}
                      hideCommander={this.hideCommander}
                      getItems={this.getItems}
                      ref={c => (this.commander = c)}
                    />
                    <Toaster />
                  </>
                )}
              />
            </div>
          )}
        </WithEventListeners>
      </ConnectedRouter>
    );
  }
}
export default compose(
  DragDropContext(HTML5Backend),
  // flow-ignore
  connect(
    state => ({
      activities: getTimeline(state).activities,
      blocks: getTimeline(state).blocks,
      categories: getUser(state).categories,
      threadLevels: getTimeline(state).threadLevels,
      threads: getTimeline(state).threads,
      operand: state.operand,
      settings: state.settings,
      todosVisible: state.todosVisible,
      trace: getTimeline(state).trace,
      user: getUser(state),
      userTraces: getUser(state).traces,
      view: state.view,
      viewThread: state.viewThread
    }),
    dispatch => ({
      collapseAllThreads: id => dispatch(collapseAllThreads(id)),
      deleteCurrentTrace: () => dispatch(deleteCurrentTrace()),
      deleteTrace: (id: number) => dispatch(deleteTrace(id)),
      expandAllThreads: id => dispatch(expandAllThreads(id)),
      fetchTrace: (trace: Trace) => dispatch(fetchTrace(trace)),
      fetchUser: user_id => dispatch(fetchUser(user_id)),
      keyDown: key => dispatch(keyDown(key)),
      keyUp: key => dispatch(keyUp(key)),
      runCommand: (operand, command) => dispatch(runCommand(operand, command)),
      selectTrace: (trace: Trace) => dispatch(selectTrace(trace)),
      showActivityDetails: () => dispatch(showActivityDetails()),
      showSettings: () => dispatch(showSettings()),
      createMantra: (id, note) => dispatch(createMantra(id, note)),
      createToast: (message, notificationType) =>
        dispatch(createToast(message, notificationType))
    })
  )
)(App);
