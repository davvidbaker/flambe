import React, { Component } from 'react';
import Commander from 'react-commander';

import { processTrace } from '../utilities';

import COMMANDS, { ACTIVITY_COMMANDS } from '../constants/commands';

class Editor extends Component {
  state = {
    commanderVisible: false,
    additionalCommands: [],
    trace: [
      {
        timestamp: 1520470546536,
        phase: 'B',
        message: null,
        id: 1,
        activity: {
          thread: {
            id: 0
          },
          name:
            'just deleted all my data earlier today, but I think I was fixing overlapping activities',
          id: 1,
          categories: []
        }
      }
    ],
    threads: [
      {
        id: 1,
        rank: 0,
        name: 'Main',
        collapsed: false
      }
    ]
  };

  showCommander = () => {
    this.setState({ commanderVisible: true });
  };

  hideCommander = () => {
    this.setState({ commanderVisible: false });
  };

  submitCommand = command => {
    this.hideCommander();
    this.props.runCommand(this.props.operand, command);
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
    const a = processTrace(this.state.trace, this.state.threads);

    console.log(`a`, a);
    return (
      <div>
        Creator
        <Commander
          withBuildup
          isOpen={this.state.commanderVisible}
          commands={this.getCommands(this.props.operand)}
          onSubmit={this.submitCommand}
          hideCommander={this.hideCommander}
          getItems={this.getItems}
          ref={c => (this.commander = c)}
        />
        <Timeline />
      </div>
    );
  }
}

export default Editor;
