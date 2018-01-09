// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
// flow-ignore
import { ConnectedRouter } from 'react-router-redux';
import { Route } from 'react-router';
import { DragDropContext, DragDropManager } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { injectGlobal } from 'styled-components';
import Commander from 'react-commander';

// flow-ignore
import { compose, gql, graphql } from 'react-apollo';
import Timeline from 'containers/Timeline';
import Todos from 'containers/Todos';
import Header from 'components/Header';
import Grid from 'components/Grid';
import WithEventListeners from 'components/WithEventListeners';
import { history } from 'store';
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
  showActivityDetails
} from 'actions';
import COMMANDS, { ACTIVITY_COMMANDS } from 'constants/commands';
import { getTimeline } from 'reducers/timeline';
import { getUser } from 'reducers/user';
import isEndable from 'utilities/isEndable';

import type { Trace } from 'types/Trace';
import type { Todo } from 'types/Todo';

injectGlobal`
html {
  box-sizing: border-box;
  font-family: sans-serif;
  overflow: hidden;
}

* {
  box-sizing: inherit;
}
`;

// @DragDropContext(HTML5Backend)
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
            ...ACTIVITY_COMMANDS.filter(
              cmd => cmd.status.indexOf(operand.activityStatus) >= 0
            ),
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
          console.log(e.key, e);
          if (e.shiftKey && (e.metaKey || e.ctrlKey) && e.key === 'p') {
            /** 💁 By default, if chrome devtools are open, this will pull up their command palette, even if focus is in the page, not dev tools. */
            e.preventDefault();
            this.showCommander();
          }
          if (e.target.nodeName !== 'INPUT') {
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
          if (this.props.operand && e.target.nodeName !== 'INPUT') {
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
                          this.props.blocks.filter(
                            block =>
                              block.activity_id ===
                              this.props.operand.activity_id
                          ),
                          this.props.threadLevels
                        )
                      ) {
                        this.showCommander();
                        this.commander.enterCommand(
                          this.getCommands(this.props.operand).find(
                            cmd => cmd.shortcut === e.key.toUpperCase()
                          )
                        );
                      }
                      break;
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
              <Header
                traces={this.props.user.traces}
                currentTrace={this.props.trace}
                selectTrace={this.props.selectTrace}
                deleteTrace={this.props.deleteTrace}
                deleteCurrentTrace={this.props.deleteCurrentTrace}
              />

              <main>
                <Route path="/traces/:trace_id" render={this.renderTimeline} />
                <Route exact path="/" render={this.renderTimeline} />

                {this.props.todosVisible && (
                  <Todos todos={this.props.user.todos} />
                )}
              </main>
              <Commander
                isOpen={this.state.commanderVisible}
                commands={this.getCommands(this.props.operand)}
                onSubmit={this.submitCommand}
                hideCommander={this.hideCommander}
                getItems={this.getItems}
                ref={c => (this.commander = c)}
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
      threadLevels: getTimeline(state).threadLevels,
      threads: getTimeline(state).threads,
      operand: state.operand,
      todosVisible: state.todosVisible,
      trace: getTimeline(state).trace,
      user: getUser(state),
      userTraces: getUser(state).traces
    }),
    dispatch => ({
      collapseThread: id => dispatch(collapseThread(id)),
      deleteCurrentTrace: () => dispatch(deleteCurrentTrace()),
      deleteTrace: (id: number) => dispatch(deleteTrace(id)),
      expandThread: id => dispatch(expandThread(id)),
      fetchTrace: (trace: Trace) => dispatch(fetchTrace(trace)),
      keyDown: key => dispatch(keyDown(key)),
      keyUp: key => dispatch(keyUp(key)),
      selectTrace: (trace: Trace) => dispatch(selectTrace(trace)),
      fetchUser: user_id => dispatch(fetchUser(user_id)),
      showActivityDetails: () => dispatch(showActivityDetails()),
      runCommand: (operand, command) => dispatch(runCommand(operand, command))
    })
  )
)(App);
