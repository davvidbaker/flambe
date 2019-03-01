// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import SplitPane from 'react-split-pane';
import last from 'lodash/fp/last';
import { Switch, Route, Redirect, withRouter } from 'react-router';
// import Subdivide from 'subdivide';

// flow-ignore
import { DragDropContext, DragDropManager } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
/* ⚠️ I was struggling to import commander without getting errors about hooks being used outside function component
      so I copied the code in here because I was frustrated
*/
// import Commander from 'react-commander';
import Commander from '../components/Commander/this_is_a_hack';
import Modal from 'react-modal';

import Dashboard from '../containers/Dashboard';
import ConnectedTimeline from '../containers/ConnectedTimeline';
import SingleThreadView from '../containers/SingleThreadView';
import Editor from '../containers/Editor';
import AdvancedSearch from '../containers/AdvancedSearch';
// import Todos from './Todos';
import Header from '../components/Header';
import SidePanel from '../components/SidePanel';
import SearchBar from '../containers/SearchBar';
import WithEventListeners from '../components/WithEventListeners';
import CategoryManager from '../components/CategoryManager';
import Settings from '../components/Settings';
import LimboContainer from '../components/LimboContainer';
import PanePicker from '../components/PanePicker';
import {
  collapseAllThreads,
  createMantra,
  createToast,
  deleteCurrentTrace,
  deleteTrace,
  expandAllThreads,
  fetchTrace,
  fetchUser,
  hideAdvancedSearch,
  keyDown,
  keyUp,
  runCommand,
  selectTrace,
  showActivityDetails,
  showAdvancedSearch,
  showSettings,
  toggleSetting,
} from '../actions';
import COMMANDS, {
  ACTIVITY_COMMANDS,
  activityCommandsByStatus,
} from '../constants/commands';
import { getTimeline } from '../reducers/timeline';
import { getUser } from '../reducers/user';
import isEndable from '../utilities/isEndable';
import type { Trace } from '../types/Trace';
import type { Todo } from '../types/Todo';

Modal.setAppElement('#app-root');

import '../styles/reach-overrides.css';
console.log(`🔥  React.version`, React.version);

const MaybeSplitPane = ({ children, isSplit, hideSidePanel, threads }) =>
  isSplit ? (
    <SplitPane
      split="vertical"
      minSize={100}
      defaultSize={parseInt(localStorage.getItem('splitPos'), 10) || 100}
      onChange={size => localStorage.setItem('splitPos', size)}
      primary="second"
    >
      <SidePanel closePanel={hideSidePanel}>
        <AdvancedSearch threads={threads} />
      </SidePanel>
      {children}
    </SplitPane>
  ) : (
    <div>{children}</div>
  );

class App extends React.Component<
  {
    keyDown: () => mixed,
    keyUp: () => mixed,
    selectTrace: (trace: Trace) => mixed,
    trace: ?Trace,
    user: { id: string, name: string },
    userTraces: (?Trace)[],
    userTodos: (?Todo)[],
    todosVisible: boolean,
  },
  { commanderVisible: boolean },
> {
  state = {
    // modalIsOpen,
    searchBarVisible: false,
    commanderVisible: false,
    additionalCommands: [],
    // for commander
    field: undefined,
  };

  constructor(props) {
    super(props);

    const trace_id = props.match.params.trace_id;

    /** ⚠️ come back */
    this.props.fetchUser(props.user.id);
    if (!props.user) {
    } else if (trace_id) {
      props.fetchTrace(trace_id);
    }
  }
  componentDidCatch(e, info) {
    console.log('component did catch', e);
    createToast(`${(e, info)}. Top level error.`, 'error');
  }

  componentWillMount() {}

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

  addCommand = command => {
    this.setState(state => ({
      additionalCommands: [command, ...state.additionalCommands],
    }));
  };

  submitCommand = command => {
    this.hideCommander();
    console.log(`🔥  command`, command);
    this.props.runCommand(this.props.operand, command);
  };

  showCommander = () => {
    this.setState({ commanderVisible: true });
  };

  showSearchPanel = () => {
    this.setState({ searchBarVisible: true });

    this.searchRef.focus();
    this.searchRef.setSelectionRange(0, this.searchRef.value.length);
  };

  hideSearchPanel = () => {
    this.setState({ searchBarVisible: false });
  };

  hideCommander = () => {
    this.setState({ commanderVisible: false, field: undefined });
  };

  setCommanderCommand = command => {
    this.setState(
      {
        field: {
          command,
          parameters: {},
        },
      },
      state => {
        this.showCommander();
      },
    );
  };

  renderTimeline = route => {
    const { trace_id } = this.props.match.params;

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
            ...baseCommands,
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

          if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
              case 'f':
                if (!this.props.aModalIsOpen) {
                  e.preventDefault();
                  if (e.shiftKey) {
                    this.props.showAdvancedSearch();
                  } else {
                    this.showSearchPanel();
                  }
                }
                break;

              case 'm':
                e.preventDefault();
                this.props.toggleActivityMute();
                break;

              case 'p':
                if (e.shiftKey) {
                  /** 💁 By default, if chrome devtools are open, this will pull up their command palette, even if focus is in the page, not dev tools. */
                  e.preventDefault();
                  this.showCommander();
                }
                break;

              case ',':
                e.preventDefault();
                this.props.showSettings();
                break;

              default:
                break;
            }
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
        },
      ],
      [
        'keyup',
        e => {
          if (
            /* ⚠️ maybe don't want this.props.operand here */
            this.props.operand &&
            e.target.nodeName !== 'INPUT' &&
            e.target.nodeName !== 'TEXTAREA'
          ) {
            switch (this.props.operand.type) {
              case 'activity':
                if (e.code === 'Space') {
                  console.log(`🔥  space`, this.props);
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
                              this.props.operand.activity_id,
                          ),
                          this.props.threadLevels,
                        )
                      ) {
                        this.setCommanderCommand(
                          this.getCommands(this.props.operand).find(
                            cmd => cmd.shortcut === e.key.toUpperCase(),
                          ),
                        );
                      }
                      break;
                    case 's':
                      /* ⚠️ not great code ahead */
                      if (
                        this.props.activities[this.props.operand.activity_id]
                          .status === 'active'
                      ) {
                        this.setCommanderCommand(
                          ACTIVITY_COMMANDS.find(
                            ({ shortcut }) => shortcut === 'S',
                          ),
                        );
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
        },
      ],
    ];

    return (
      <WithEventListeners eventListeners={eventListeners} node={document}>
        {() => (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
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
                <MaybeSplitPane
                  isSplit={this.props.advancedSearchVisible}
                  hideSidePanel={this.props.hideAdvancedSearch}
                  threads={this.props.threads}
                >
                  <div style={{ height: '100%' }}>
                    <SplitPane
                      split="horizontal"
                      defaultSize={
                        parseInt(localStorage.getItem('splitPosHo'), 10) || 100
                      }
                      onChange={size =>
                        localStorage.setItem('splitPosHo', size)
                      }
                    >
                      <div style={{ width: '100%' }}>
                        {do {
                          if (this.props.view === 'multithread') {
                            this.renderTimeline();
                          } else if (this.props.view === 'singlethread') {
                            <Route
                              path={`${this.props.location.pathname}/threads/${
                                this.props.viewThread
                              }`}
                            >
                              <SingleThreadView
                                thread={
                                  this.props.threads[this.props.viewThread]
                                }
                              />
                            </Route>;
                          }
                        }}
                      </div>
                      <LimboContainer submitCommand={this.submitCommand} />
                    </SplitPane>
                  </div>
                </MaybeSplitPane>
                <div
                  style={{
                    bottom: 0,
                    width: '100%',
                    position: 'absolute',
                    zIndex: 1,
                    visibility: this.state.searchBarVisible
                      ? 'visible'
                      : 'hidden',
                  }}
                >
                  <SearchBar
                    hideSearchBar={this.hideSearchPanel}
                    inputRef={r => {
                      this.searchRef = r;
                    }}
                  />
                </div>
              </main>

              <CategoryManager categories={this.props.categories} />
              <Settings />
              <Commander
                field={this.state.field}
                isOpen={this.state.commanderVisible}
                commands={this.getCommands(this.props.operand)}
                onSubmit={this.submitCommand}
                hideCommander={this.hideCommander}
                getItems={this.getItems}
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
      aModalIsOpen:
        state.settingsVisible ||
        state.activityDetailModalVisible ||
        state.todosVisible ||
        state.settingsVisible,
      activities: getTimeline(state).activities,
      advancedSearchVisible: state.advancedSearchVisible,
      blocks: getTimeline(state).blocks,
      categories: getUser(state).categories,
      threadLevels: getTimeline(state).threadLevels,
      threads: getTimeline(state).threads,
      operand: state.operand,
      settings: state.settings,
      todosVisible: state.todosVisible,
      // trace: getTimeline(state).trace,
      user: getUser(state),
      userTraces: getUser(state).traces,
      view: state.view,
      viewThread: state.viewThread,
    }),
    dispatch => ({
      collapseAllThreads: id => dispatch(collapseAllThreads(id)),
      createMantra: (id, note) => dispatch(createMantra(id, note)),
      createToast: (message, notificationType) =>
        dispatch(createToast(message, notificationType)),
      deleteCurrentTrace: () => dispatch(deleteCurrentTrace()),
      deleteTrace: (id: number) => dispatch(deleteTrace(id)),
      expandAllThreads: id => dispatch(expandAllThreads(id)),
      fetchTrace: (trace: Trace) => dispatch(fetchTrace(trace)),
      fetchUser: user_id => dispatch(fetchUser(user_id)),
      hideAdvancedSearch: () => dispatch(hideAdvancedSearch()),
      keyDown: key => dispatch(keyDown(key)),
      keyUp: key => dispatch(keyUp(key)),
      runCommand: (operand, command) => dispatch(runCommand(operand, command)),
      selectTrace: (trace: Trace) => dispatch(selectTrace(trace)),
      showActivityDetails: () => dispatch(showActivityDetails()),
      showAdvancedSearch: () => dispatch(showAdvancedSearch()),
      showSettings: () => dispatch(showSettings()),
      toggleActivityMute: () => dispatch(toggleSetting('activityMute')),
    }),
  ),
)(App);
