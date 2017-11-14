import { ACTIVITY_CREATE } from 'actions';

const COMMANDS = [
  {
    action: 'chain',
    copy: 'start a new task/activity',
    parameters: [
      {
        key: 'name',
        placeholder: 'gist description of the activity',
        isOnlyPrompt: true,
      },
    ],
  },
];

export default COMMANDS;
