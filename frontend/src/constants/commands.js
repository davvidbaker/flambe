import { ACTIVITY_CREATE, THREAD_CREATE } from 'actions';

const COMMANDS = [
  {
    action: ACTIVITY_CREATE,
    copy: 'start a new task/activity',
    parameters: [
      {
        key: 'name',
        placeholder: 'gist description of the activity',
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
  /** ⚠️ TODO make sure the thread name is unique */
  {
    action: THREAD_CREATE,
    copy: 'new thread',
    parameters: [
      {
        key: 'name',
        placeholder: 'thread name',
      },
    ],
  },
];

export default COMMANDS;
