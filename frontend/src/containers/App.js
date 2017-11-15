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
  keyDown,
  keyUp,
  deleteTrace,
  fetchTrace,
  selectTrace,
  deleteCurrentTrace,
  fetchUser,
  runCommand,
} from 'actions';
import COMMANDS from 'constants/commands';
import { getTimeline } from 'reducers/timeline';
import { getUser } from 'reducers/user';

import type { Trace } from 'types/Trace';
import type { Todo } from 'types/Todo';

injectGlobal`
html {
  box-sizing: border-box;
  font-family: sans-serif;
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
  },
  { commanderVisible: boolean },
> {
  state = {
    commanderVisible: false,
  };

  componentWillMount() {
    console.log('main component will mount');
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

  getItems = selector => {
    return selector(this.props)
  }

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

  getCommands = operand => COMMANDS;

  render() {
    const eventListeners = [
      [
        'keydown',
        e => {
          if (e.shiftKey && (e.metaKey || e.ctrlKey) && e.key === 'p') {
            /** 💁 By default, if chrome devtools are open, this will pull up their command palette, even if focus is in the page, not dev tools. */
            e.preventDefault();
            this.showCommander();
          }
        },
      ],
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

              <Grid rows={'4fr 1fr'}>
                <Route path="/traces/:trace_id" render={this.renderTimeline} />
                <Route exact path="/" render={this.renderTimeline} />

                <Todos todos={this.props.user.todos} />
              </Grid>
              <Commander
                isOpen={this.state.commanderVisible}
                commands={this.getCommands(this.props.operand)}
                onSubmit={this.submitCommand}
                hideCommander={this.hideCommander}
                getItems={this.getItems}
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
      user: getUser(state),
      userTraces: getUser(state).traces,
      trace: getTimeline(state).trace,
      operand: state.operand,
      threads: getTimeline(state).threads
    }),
    dispatch => ({
      keyDown: key => dispatch(keyDown(key)),
      keyUp: key => dispatch(keyUp(key)),
      deleteCurrentTrace: () => dispatch(deleteCurrentTrace()),
      fetchTrace: (trace: Trace) => dispatch(fetchTrace(trace)),
      selectTrace: (trace: Trace) => dispatch(selectTrace(trace)),
      deleteTrace: (id: number) => dispatch(deleteTrace(id)),
      fetchUser: user_id => dispatch(fetchUser(user_id)),
      runCommand: (operand, command) => dispatch(runCommand(operand, command)),
    }),
  ),
)(App);
