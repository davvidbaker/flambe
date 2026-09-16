import * as React from 'react';
import { connect } from 'react-redux';
import SplitPane from '../components/SplitPane';
import { useLocation, useParams } from 'react-router-dom';
/* ⚠️ I was struggling to import commander without getting errors about hooks being used outside function component
      so I copied the code in here because I was frustrated
*/
import Commander from '../components/Commander/this_is_a_hack';
import Modal from 'react-modal';

import ConnectedTimeline from '../containers/ConnectedTimeline';
import SingleThreadView from '../containers/SingleThreadView';
import AdvancedSearch from '../containers/AdvancedSearch';
// import Todos from './Todos';
import Header from '../components/Header';
import SidePanel from '../components/SidePanel';
import SearchBar from '../containers/SearchBar';
import WithEventListeners, { type EventListenerTuple } from '../components/WithEventListeners';
import CategoryManager from '../components/CategoryManager';
import Settings from '../components/Settings';
import KeyboardShortcuts from '../components/KeyboardShortcuts';
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
  toggleKeyboardShortcuts,
  toggleSetting,
  undoLastCommand,
} from '../actions';
import { isKeyboardShortcutsHotkey } from '../utilities/keyboardShortcuts';
import COMMANDS, {
  ACTIVITY_COMMANDS,
  activityCommandsByStatus,
} from '../constants/commands';
import { getTimeline } from '../reducers/timeline';
import { getUser } from '../reducers/user';
import isEndable from '../utilities/isEndable';
import type { Location } from 'react-router-dom';
import type { RootState } from '../store';
import type { Command, CommandParameter } from '../constants/commands';
import type { FieldInput } from '../components/Commander/this_is_a_hack/machines/field';
import type { FuzzyAutocompleteItem } from '../components/Commander/this_is_a_hack/components/FuzzyAutocomplete';
import type { EntityId } from '../types/ids';
import type { Trace } from '../types/Trace';
import type { UserState } from '../reducers/user';
import type { OperandState } from '../reducers/operand';
import type { SettingsState } from '../reducers/settings';
import type { ProcessedActivity, ThreadLevel, TraceBlock } from '../utilities/processTrace';
import type { Category } from '../types/Category';
import type { Thread } from '../types/Thread';
import type { TimelineState } from '../reducers/timeline';

Modal.setAppElement('#app-root');

const MaybeSplitPane = ({ children, isSplit, hideSidePanel, threads }: {
  children: React.ReactNode;
  hideSidePanel: () => unknown;
  isSplit: boolean;
  threads: Record<string, Thread>;
}) =>
  isSplit ? (
    <SplitPane
      split="vertical"
      minSize={100}
      defaultSize={Number.parseInt(localStorage.getItem('splitPos') ?? '', 10) || 100}
      onChange={size => localStorage.setItem('splitPos', String(size))}
      primary="second"
    >
      <SidePanel closePanel={hideSidePanel}>
        <AdvancedSearch threads={threads} />
      </SidePanel>
      {children}
    </SplitPane>
  ) : (
    <div style={{ height: '100%' }}>{children}</div>
  );

interface AppProps {
  aModalIsOpen: boolean;
  activities: Record<string, ProcessedActivity>;
  advancedSearchVisible: boolean;
  blocks: TraceBlock[];
  categories: Category[];
  collapseAllThreads: () => unknown;
  createMantra: (name: string) => unknown;
  createToast: (message: string, notificationType: string) => unknown;
  deleteCurrentTrace: () => unknown;
  deleteTrace: (id: EntityId) => unknown;
  expandAllThreads: () => unknown;
  fetchTrace: (trace: Trace | EntityId) => unknown;
  fetchUser: (id: EntityId) => unknown;
  hideAdvancedSearch: () => unknown;
  keyDown: (key: string) => unknown;
  keyUp: (key: string) => unknown;
  location: Location;
  operand: OperandState | null;
  routeParams: { trace_id?: string; username?: string };
  runCommand: (operand: OperandState | null, command: unknown) => unknown;
  selectTrace: (trace: Trace) => unknown;
  settings: SettingsState;
  showActivityDetails: () => unknown;
  showAdvancedSearch: () => unknown;
  showSettings: () => unknown;
  toggleKeyboardShortcuts: () => unknown;
  threadLevels: Record<string, ThreadLevel>;
  threads: Record<string, Thread>;
  toggleActivityMute: () => unknown;
  undoLastCommand: () => unknown;
  trace: Trace | null;
  user: UserState;
  view: string;
  viewThread: EntityId | null;
}

interface AppState {
  additionalCommands: Command[];
  commanderVisible: boolean;
  field?: FieldInput;
  searchBarVisible: boolean;
}

class App extends React.Component<AppProps, AppState> {
  state: AppState = {
    // modalIsOpen,
    searchBarVisible: false,
    commanderVisible: false,
    additionalCommands: [],
    // for commander
    field: undefined,
  };

  searchRef: HTMLInputElement | null = null;

  constructor(props: AppProps) {
    super(props);

    const trace_id = props.routeParams.trace_id;

    /** ⚠️ come back */
    this.props.fetchUser(props.user.id);
    if (!props.user) {
    } else if (trace_id) {
      props.fetchTrace(trace_id);
    }
  }
  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    this.props.createToast(`${error.message}. Top level error. ${info.componentStack ?? ''}`, 'error');
  }

  getItems = (selector: NonNullable<CommandParameter['selector']>): FuzzyAutocompleteItem[] =>
    selector(this.props as never) as FuzzyAutocompleteItem[];

  logout = async () => {
    await fetch(`${SERVER}/auth/logout`, {
      method: 'DELETE',
      credentials: 'include',
    });

    localStorage.removeItem('state');
    window.location.assign('/login');
  };

  addCommand = (command: Command): void => {
    this.setState(state => ({
      additionalCommands: [command, ...state.additionalCommands],
    }));
  };

  submitCommand = (command: { action: Command['action'] } & Record<string, unknown>): void => {
    this.hideCommander();
    this.props.runCommand(this.props.operand, command);
  };

  showCommander = (): void => {
    this.setState({ commanderVisible: true });
  };

  showSearchPanel = (): void => {
    this.setState({ searchBarVisible: true });

    this.searchRef?.focus();
    this.searchRef?.setSelectionRange(0, this.searchRef.value.length);
  };

  hideSearchPanel = (): void => {
    this.setState({ searchBarVisible: false });
  };

  hideCommander = (): void => {
    this.setState({ commanderVisible: false, field: undefined });
  };

  setCommanderCommand = (command?: Command): void => {
    this.setState(
      {
        field: {
          command,
          parameters: {},
        },
      },
      () => {
        this.showCommander();
      },
    );
  };

  renderTimeline = (): React.ReactNode => {
    const { trace_id } = this.props.routeParams;

    return trace_id ? (
      <ConnectedTimeline
        trace_id={trace_id}
        key="timeline"
        /* ⚠️ I don't like this api too much. Should mabye use context? */
        addCommand={this.addCommand}
        submitCommand={this.submitCommand}
      />
    ) : null;
  };

  getCommands = (operand: OperandState | null): Command[] => {
    const baseCommands = [...COMMANDS, ...this.state.additionalCommands];

    if (operand) {
      switch (operand.type) {
        case 'activity':
          return [
            ...(operand.activityStatus === 'active' ||
            operand.activityStatus === 'suspended' ||
            operand.activityStatus === 'complete'
              ? activityCommandsByStatus(operand.activityStatus)
              : []),
            ...baseCommands,
          ];
        default:
          return baseCommands;
      }
    }
    return baseCommands;
  };

  render() {
    const eventListeners: EventListenerTuple[] = [
      [
        'keydown',
        event => {
          const e = event as KeyboardEvent;
          if (e.repeat) return;
          if (e.key === 'Shift') this.props.keyDown(e.key);

          if (e.ctrlKey || e.metaKey) {
            if (isKeyboardShortcutsHotkey(e)) {
              e.preventDefault();
              this.props.toggleKeyboardShortcuts();
              return;
            }
            switch (e.key) {
              case 'z':
                if (
                  !e.shiftKey &&
                  !this.props.aModalIsOpen &&
                  !(e.target instanceof HTMLInputElement) &&
                  !(e.target instanceof HTMLTextAreaElement)
                ) {
                  e.preventDefault();
                  this.props.undoLastCommand();
                }
                break;

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
            !(e.target instanceof HTMLInputElement) &&
            !(e.target instanceof HTMLTextAreaElement)
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
        event => {
          const e = event as KeyboardEvent;
          if (e.key === 'Shift') this.props.keyUp(e.key);
          if (
            /* ⚠️ maybe don't want this.props.operand here */
            this.props.operand &&
            !(e.target instanceof HTMLInputElement) &&
            !(e.target instanceof HTMLTextAreaElement)
          ) {
            switch (this.props.operand.type) {
              case 'activity':
                if (e.code === 'Space') {
                  this.props.showActivityDetails();
                } else {
                  switch (e.key) {
                    case 'e':
                    case 'v':
                    case 'j': {
                      const activityId = this.props.operand.activity_id;
                      const activity = activityId === undefined
                        ? undefined
                        : this.props.activities[String(activityId)];
                      if (activity &&
                        isEndable(
                          activity,
                          this.props.blocks.filter(
                            block => String(block.activity_id) === String(activityId),
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
                    }
                    case 's': {
                      /* ⚠️ not great code ahead */
                      const activityId = this.props.operand.activity_id;
                      if (activityId !== undefined &&
                        this.props.activities[String(activityId)]?.status === 'active') {
                        this.setCommanderCommand(
                          ACTIVITY_COMMANDS.find(
                            ({ shortcut }) => shortcut === 'S',
                          ),
                        );
                      }
                      break;
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
                  this.props.user.mantras[this.props.user.mantras.length - 1]?.name
                }
                createMantra={name => this.props.createMantra(name)}
                logout={this.logout}
              />
              <main style={{ position: 'relative', height: '100%' }}>
                <MaybeSplitPane
                  isSplit={this.props.advancedSearchVisible}
                  hideSidePanel={this.props.hideAdvancedSearch}
                  threads={this.props.threads}
                >
                  <div style={{ height: '100%', width: '100%' }}>
                    {this.props.view === 'multithread'
                      ? this.renderTimeline()
                      : this.props.view === 'singlethread' &&
                          this.props.location.pathname.endsWith(
                            `/threads/${this.props.viewThread}`,
                          )
                        ? (
                          <SingleThreadView thread={this.props.viewThread === null
                            ? undefined
                            : this.props.threads[String(this.props.viewThread)]} />
                        )
                        : null}
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

              {this.props.settings.activityMute && (
                <div
                  style={{
                    position: 'fixed',
                    bottom: 8,
                    right: 8,
                    zIndex: 20,
                    background: '#111',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  Activities muted — ⌘M / Ctrl+M to unmute
                </div>
              )}
              <CategoryManager />
              <Settings />
              <KeyboardShortcuts />
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

const ConnectedTrace = connect(
    (state: RootState) => {
      const timeline = getTimeline(state) as TimelineState;
      const trace = timeline.trace?.id !== null && timeline.trace?.name
        ? { id: timeline.trace.id, name: timeline.trace.name }
        : null;
      return {
      aModalIsOpen:
        state.settingsVisible ||
        state.keyboardShortcutsVisible ||
        state.activityDetailModalVisible ||
        state.todosVisible,
      activities: timeline.activities,
      advancedSearchVisible: state.advancedSearchVisible,
      blocks: timeline.blocks,
      categories: getUser(state).categories,
      threadLevels: timeline.threadLevels,
      threads: timeline.threads,
      operand: state.operand,
      settings: state.settings,
      trace,
      user: getUser(state),
      view: state.view,
      viewThread: state.viewThread,
      };
    },
    dispatch => ({
      collapseAllThreads: () => dispatch(collapseAllThreads()),
      createMantra: (name: string) => dispatch(createMantra(name)),
      createToast: (message: string, notificationType: string) =>
        dispatch(createToast(message, notificationType)),
      deleteCurrentTrace: () => dispatch(deleteCurrentTrace()),
      deleteTrace: (id: EntityId) => dispatch(deleteTrace(id)),
      expandAllThreads: () => dispatch(expandAllThreads()),
      fetchTrace: (trace: Trace | EntityId) => dispatch(fetchTrace(trace)),
      fetchUser: (user_id: EntityId) => dispatch(fetchUser(user_id)),
      hideAdvancedSearch: () => dispatch(hideAdvancedSearch()),
      keyDown: (key: string) => dispatch(keyDown(key)),
      keyUp: (key: string) => dispatch(keyUp(key)),
      runCommand: (operand: OperandState | null, command: unknown) => dispatch(runCommand(operand, command)),
      selectTrace: (trace: Trace) => dispatch(selectTrace(trace)),
      showActivityDetails: () => dispatch(showActivityDetails()),
      showAdvancedSearch: () => dispatch(showAdvancedSearch()),
      showSettings: () => dispatch(showSettings()),
      toggleKeyboardShortcuts: () => dispatch(toggleKeyboardShortcuts()),
      toggleActivityMute: () => dispatch(toggleSetting('activityMute')),
      undoLastCommand: () => dispatch(undoLastCommand()),
    }),
)(App);

export default function TraceRoute() {
  const routeParams = useParams();
  const location = useLocation();

  return <ConnectedTrace routeParams={routeParams} location={location} />;
}
