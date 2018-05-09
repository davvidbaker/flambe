// @flow

import React, { Component  } from 'react';
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

// flow-ignore
import Timeline from './Timeline';
import SingleThreadView from './SingleThreadView';
import Todos from './Todos';
import Login from '../components/Login';
import Header from '../components/Header';
import WithEventListeners from '../components/WithEventListeners';
import CategoryManager from '../components/CategoryManager';
import Settings from '../components/Settings';
import { history } from '../store';
import {
  collapseThread,
  deleteCurrentTrace,
  deleteTrace,
  expandThread,
  fetchTrace,
  fetchUser,
  keyDown,
  keyUp,
  runCommand,
  selectTrace,
  showActivityDetails,
  showSettings,
  createMantra
} from '../actions';
import COMMANDS, { ACTIVITY_COMMANDS } from '../constants/commands';
import { getTimeline } from '../reducers/timeline';
import { getUser } from '../reducers/user';
import isEndable from '../utilities/isEndable';

import type { Trace } from '../types/Trace';
import type { Todo } from '../types/Todo';

// eslint-disable-next-line no-unused-expressions
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
`;

class App extends Component<
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
    commanderVisible: false
  };

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

    createKeyEvent('keydown', this.props.keyDown);
    createKeyEvent('keyup', this.props.keyUp);
  }

  getItems = selector => selector(this.props);

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
      <Timeline trace_id={trace_id} user={this.props.user} key="timeline" />
    ) : null;
  };

  getCommands = operand => {
    if (operand) {
      switch (operand.type) {
        case 'activity':
          return [
            ...ACTIVITY_COMMANDS.filter(cmd => cmd.status.indexOf(operand.activityStatus) >= 0),
            ...COMMANDS
          ];
        default:
          return COMMANDS;
      }
    }
    return COMMANDS;
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

          if (e.key === ',' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            this.props.showSettings();
          }

          if (
            e.target.nodeName !== 'INPUT' &&
            e.target.nodeName !== 'TEXTAREA'
          ) {
            if (e.shiftKey && e.key === '}') {
              this.props.threads.forEach(thread => {
                this.props.expandThread(thread.id);
              });
            } else if (e.shiftKey && e.key === '{') {
              this.props.threads.forEach(thread => {
                this.props.collapseThread(thread.id);
              });
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
                        this.props.activities[
                          this.props.operand.activity_id
                        ].status === 'active'
                      ) {
                        console.log('this.props.activities', this.props.activities[
                          this.props.operand.activity_id
                        ]);
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
              {/* /* ⚠️ I might have fucked up the route logic */}
              <Route
                exact
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
                              path="/traces/:trace_id"
                              render={this.renderTimeline}
                            />
                            <Route
                              exact
                              path="/"
                              render={this.renderTimeline}
                            />

                            {this.props.todosVisible && (
                              <Todos todos={this.props.user.todos} />
                            )}
                          </>;
                        } else if (this.props.view === 'singlethread') {
                          <>
                            <SingleThreadView
                              thread={this.props.threads.find(({ id }) => id === this.props.viewThread)}
                            />
                          </>;
                        }
                      }}
                    </main>
                    <CategoryManager categories={this.props.categories} />
                    <Settings />
                    <Commander
                      withBuildup
                      appElement={window.root}
                      isOpen={this.state.commanderVisible}
                      commands={this.getCommands(this.props.operand)}
                      onSubmit={this.submitCommand}
                      hideCommander={this.hideCommander}
                      getItems={this.getItems}
                      ref={c => (this.commander = c)}
                    />
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
      todosVisible: state.todosVisible,
      trace: getTimeline(state).trace,
      user: getUser(state),
      userTraces: getUser(state).traces,
      view: state.view,
      viewThread: state.viewThread
    }),
    dispatch => ({
      collapseThread: id => dispatch(collapseThread(id)),
      deleteCurrentTrace: () => dispatch(deleteCurrentTrace()),
      deleteTrace: (id: number) => dispatch(deleteTrace(id)),
      expandThread: id => dispatch(expandThread(id)),
      fetchTrace: (trace: Trace) => dispatch(fetchTrace(trace)),
      fetchUser: user_id => dispatch(fetchUser(user_id)),
      keyDown: key => dispatch(keyDown(key)),
      keyUp: key => dispatch(keyUp(key)),
      runCommand: (operand, command) => dispatch(runCommand(operand, command)),
      selectTrace: (trace: Trace) => dispatch(selectTrace(trace)),
      showActivityDetails: () => dispatch(showActivityDetails()),
      showSettings: () => dispatch(showSettings()),
      createMantra: (id, note) => dispatch(createMantra(id, note))
    })
  )
)(App);
