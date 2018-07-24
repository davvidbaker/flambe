// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import SplitPane from 'react-split-pane';
import last from 'lodash/fp/last';

// flow-ignore
import { DragDropContext, DragDropManager } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { injectGlobal } from 'styled-components';
import Commander from 'react-commander';
import Modal from 'react-modal';

import Dashboard from '../containers/Dashboard';
import ConnectedTimeline from '../containers/ConnectedTimeline';
import SingleThreadView from '../containers/SingleThreadView';
import Editor from '../containers/Editor';
// import Todos from './Todos';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import { colors } from '../styles';
import WithEventListeners from '../components/WithEventListeners';
import CategoryManager from '../components/CategoryManager';
import Settings from '../components/Settings';
import {
  collapseAllThreads,
  deleteCurrentTrace,
  deleteTrace,
  expandAllThreads,
  fetchTrace,
  fetchUser,
  focusBlock,
  keyDown,
  keyUp,
  runCommand,
  selectTrace,
  showActivityDetails,
  showSettings,
  createMantra,
  createToast
} from '../actions';
import COMMANDS, {
  ACTIVITY_COMMANDS,
  activityCommandsByStatus
} from '../constants/commands';
import { getTimeline } from '../reducers/timeline';
import { getUser } from '../reducers/user';
import isEndable from '../utilities/isEndable';
import type { Trace } from '../types/Trace';
import type { Todo } from '../types/Todo';

Modal.setAppElement('#app-root');

/* ⚠️ this should all be moved */
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
    position: relative;
    height: 100vh;

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
  }

  .body-with-background-gradient {
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
    height: 100%;
    max-height:100vh;
  }

   .Resizer {
        background: #000;
        opacity: .2;
        z-index: 1;
        -moz-box-sizing: border-box;
        -webkit-box-sizing: border-box;
        box-sizing: border-box;
        -moz-background-clip: padding;
        -webkit-background-clip: padding;
        background-clip: padding-box;
    }

     .Resizer:hover {
        -webkit-transition: all 2s ease;
        transition: all 2s ease;
    }

     .Resizer.horizontal {
        height: 11px;
        margin: -5px 0;
        border-top: 5px solid rgba(255, 255, 255, 0);
        border-bottom: 5px solid rgba(255, 255, 255, 0);
        cursor: row-resize;
        width: 100%;
    }

    .Resizer.horizontal:hover {
        border-top: 5px solid rgba(0, 0, 0, 0.5);
        border-bottom: 5px solid rgba(0, 0, 0, 0.5);
    }

    .Resizer.vertical {
        width: 11px;
        margin: 0 -5px;
        border-left: 5px solid rgba(255, 255, 255, 0);
        border-right: 5px solid rgba(255, 255, 255, 0);
        cursor: col-resize;
    }

    .Resizer.vertical:hover {
        border-left: 5px solid rgba(0, 0, 0, 0.5);
        border-right: 5px solid rgba(0, 0, 0, 0.5);
    }
    .Resizer.disabled {
      cursor: not-allowed;
    }
    .Resizer.disabled:hover {
      border-color: transparent;
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
    searchPanelVisible: false,
    commanderVisible: false,
    additionalCommands: []
  };

  constructor(props) {
    super(props);

    document.body.className = 'body-with-background-gradient';

    /** ⚠️ come back */
    this.props.fetchUser(this.props.user.id);
    if (!this.props.user) {
    } else if (this.props.trace) {
      this.props.fetchTrace(this.props.trace);
    }
  }

  componentWillUnMount() {
    document.body.className = '';
  }

  componentDidCatch(e, info) {
    console.log('component did catch', e);
    createToast(`${(e, info)}. Top level error.`, 'error');
  }

  componentWillMount() {}

  componentDidMount() {
    console.log(`🔥this.props.match`, this.props.match);

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
    console.log(`🔥submitCommand`, command);
    this.hideCommander();
    this.props.runCommand(this.props.operand, command);
  };

  showCommander = () => {
    this.setState({ commanderVisible: true });
  };

  showSearchPanel = () => {
    this.setState({ searchPanelVisible: true });
    this.searchRef.focus();
  };

  hideSearchPanel = () => {
    this.setState({ searchPanelVisible: false });
  };

  hideCommander = () => {
    this.setState({ commanderVisible: false });
  };

  enterCommand = cmd => {
    console.log(`🔥cmd in trace`, cmd);

    console.log(`🔥this.commander`, this.commander);
    this.commander.enterCommand(cmd);
  };

  renderTimeline = route => {
    const trace_id = this.props.match.params.trace_id; // route.match.params.trace_id
    // ? route.match.params.trace_id
    // : this.props.trace && this.props.trace.id;

    return trace_id ? (
      <ConnectedTimeline
        trace_id={trace_id}
        user={this.props.user}
        key="timeline"
        /* ⚠️ I don't like this api too much. Should mabye use context? */
        addCommand={this.addCommand}
        submitCommand={this.submitCommand}
      />
    ) : null;
  };

  getCommands = operand => {
    const baseCommands = [...COMMANDS, ...this.state.additionalCommands];

    if (operand) {
      switch (operand.type) {
        case 'activity':
          return [
            ...activityCommandsByStatus(operand.activityStatus),
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
            this.showSearchPanel();
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
                        this.enterCommand(this.getCommands(this.props.operand).find(cmd => cmd.shortcut === e.key.toUpperCase()));
                      }
                      break;
                    case 's':
                      /* ⚠️ not great code ahead */
                      if (
                        this.props.activities[this.props.operand.activity_id]
                          .status === 'active'
                      ) {
                        this.showCommander();
                        this.enterCommand(ACTIVITY_COMMANDS.find(({ shortcut }) => shortcut === 'S'));
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
      <WithEventListeners eventListeners={eventListeners} node={document}>
        {() => (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
            >
              <Header
                traces={this.props.user.traces}
                currentTrace={this.props.trace}
                selectTrace={this.props.selectTrace}
                deleteTrace={this.props.deleteTrace}
                deleteCurrentTrace={this.props.deleteCurrentTrace}
                currentMantra={
                  this.props.user &&
                  last(this.props.user.mantras) &&
                  last(this.props.user.mantras).name
                }
                createMantra={name => this.props.createMantra(name)}
              />
              <main style={{ position: 'relative', height: '100%' }}>
                <SplitPane
                  split="vertical"
                  minSize={0}
                  defaultSize={parseInt(localStorage.getItem('splitPos'), 10)}
                  onChange={size => localStorage.setItem('splitPos', size)}
                >
                  {true && <div>Advanced Search</div>}
                  <div>
                    {do {
                      if (this.props.view === 'multithread') {
                        this.renderTimeline();
                      } else if (this.props.view === 'singlethread') {
                        <SingleThreadView
                          thread={this.props.threads[this.props.viewThread]}
                        />;
                      }
                    }}
                  </div>
                </SplitPane>
                <div
                  style={{
                    bottom: 0,
                    width: '100%',
                    position: 'absolute',
                    zIndex: 1,
                    visibility: this.state.searchPanelVisible
                      ? 'visible'
                      : 'hidden'
                  }}
                >
                  <SearchBar
                    activities={this.props.activities}
                    blocks={this.props.blocks}
                    focusBlock={this.props.focusBlock}
                    hideSearchBar={this.hideSearchPanel}
                    inputRef={r => {this.searchRef = r}}
                  />
                </div>
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
                ref={c => {
                  this.commander = c;
                }}
              />
            </div>
          </>
        )}
      </WithEventListeners>
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
        dispatch(createToast(message, notificationType)),
      focusBlock: ({ index, activity_id, thread_id }) =>
        dispatch(focusBlock({ index, activity_id, thread_id }))
    })
  )
)(App);
