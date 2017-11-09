// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
// flow-ignore
import { ConnectedRouter } from 'react-router-redux';
import { Route } from 'react-router';
import { DragDropContext, DragDropManager } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { injectGlobal } from 'styled-components';
// flow-ignore
import { compose, gql, graphql } from 'react-apollo';
import Timeline from 'containers/Timeline';
import Todos from 'containers/Todos';
import Header from 'components/Header';
import Grid from 'components/Grid';
import { history } from 'store';
import {
  keyDown,
  keyUp,
  deleteTrace,
  fetchTrace,
  selectTrace,
  deleteCurrentTrace,
  fetchUser,
} from 'actions';
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
class App extends Component<{
  keyDown: () => mixed,
  keyUp: () => mixed,
  selectTrace: (trace: Trace) => mixed,
  trace: ?Trace,
  user: { id: string, name: string },
  userTraces: (?Trace)[],
  userTodos: (?Todo)[],
}> {
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

  renderTimeline = route => {
    const trace_id = route.match.params.trace_id
      ? route.match.params.trace_id
      : this.props.trace && this.props.trace.id;

    return trace_id ? (
      <Timeline trace_id={trace_id} user={this.props.user} key="timeline" />
    ) : null;
  };

  render() {
    return (
      <ConnectedRouter history={history}>
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
        </div>
      </ConnectedRouter>
    );
  }
}

export const AllTraces = gql`
  query AllTraces($user: ID) {
    User(id: $user) {
      id
      traces {
        id
        name
      }
    }
  }
`;

export const AllCategories = gql`
  query AllCategories($user: ID) {
    User(id: $user) {
      categories {
        id
        name
        color
      }
    }
  }
`;

export const AllTodos = gql`
  query AllTodos($user: ID) {
    User(id: $user) {
      id
      todos {
        id
        name
        description
        categories {
          id
          name
          color
        }
        event {
          id
        }
      }
    }
  }
`;

export default compose(
  DragDropContext(HTML5Backend),
  // flow-ignore
  connect(
    state => ({
      user: getUser(state),
      userTraces: getUser(state).traces,
      trace: getTimeline(state).trace,
    }),
    dispatch => ({
      keyDown: key => dispatch(keyDown(key)),
      keyUp: key => dispatch(keyUp(key)),
      deleteCurrentTrace: () => dispatch(deleteCurrentTrace()),
      fetchTrace: (trace: Trace) => dispatch(fetchTrace(trace)),
      selectTrace: (trace: Trace) => dispatch(selectTrace(trace)),
      deleteTrace: (id: number) => dispatch(deleteTrace(id)),
      fetchUser: user_id => dispatch(fetchUser(user_id)),
    }),
  ),
  // graphql(AllTraces, {
  //   options: props => ({
  //     variables: {
  //       user: 'cj75obgc8kecq0120mb7l3bej', // props.user.id,
  //     },
  //     fetchPolicy: 'network-only', // probably not great idea, but I was having trouble with the apollo cache not getting new events, was still too nooby to figure out why.
  //   }),
  //   props: ({ data }) => ({
  //     // User,
  //     // user: data.User.id,
  //     userTraces: data.User && data.User.traces,
  //     // traces: User && User.traces,
  //   }),
  // }),
  // graphql(AllCategories, {
  //   options: props => ({
  //     variables: {
  //       user: 'cj75obgc8kecq0120mb7l3bej', // props.user.id,
  //     },
  //     fetchPolicy: 'network-only', // probably not great idea, but I was having trouble with the apollo cache not getting new events, was still too nooby to figure out why.
  //   }),
  //   props: ({ data }) => ({
  //     // User,
  //     // user: data.User.id,
  //     userCategories: data.User && data.User.categories,
  //     // traces: User && User.traces,
  //   }),
  // }),
  // graphql(AllTodos, {
  //   options: props => ({
  //     variables: {
  //       user: 'cj75obgc8kecq0120mb7l3bej', // props.user.id,
  //     },
  //     fetchPolicy: 'network-only', // probably not great idea, but I was having trouble with the apollo cache not getting new events, was still too nooby to figure out why.
  //   }),
  //   props: ({ data }) => ({
  //     // User,
  //     // user: data.User.id,
  //     userTodos: data.User && data.User.todos,
  //     // traces: User && User.traces,
  //   }),
  // })
)(App);
