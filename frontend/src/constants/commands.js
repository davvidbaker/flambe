import { ACTIVITY_CREATE } from 'actions';

const COMMANDS = [
  {
    action: ACTIVITY_CREATE,
    copy: 'start a new task/activity',
    parameters: [
      {
        key: 'name',
        placeholder: 'gist description of the activity',
        isOnlyPrompt: true,
      },
      {
        key: 'thread_id',
        placeholder: 'thread',
        selector: props => props.threads,
        itemStringKey: 'name',
        itemReturnKey: 'id',
      },
    ],
  },
];

export default COMMANDS;
