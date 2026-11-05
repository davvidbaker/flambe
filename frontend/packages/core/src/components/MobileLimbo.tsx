import * as React from 'react';
import styled from 'styled-components';
import type LimboPane from './LimboPane';
import { limboItems } from '../utilities/limbo';

type Props = React.ComponentProps<typeof LimboPane>;
const Page = styled.div`
  font: 15px sans-serif; color: #302d26; padding: 4px 0 16px;
  button, input { box-sizing: border-box; min-height: 44px; font: inherit; border: 1px solid #d9d6d0;
    border-radius: 7px; padding: 8px 10px; background: white; color: inherit; }
  button { cursor: pointer; }
  button:focus-visible, input:focus-visible { outline: 2px solid #aa741f; }
  form { display: flex; gap: 8px; margin-bottom: 16px; }
  form input { flex: 1; min-width: 0; }
  ul { list-style: none; padding: 0; margin: 0; }
  li { border: 1px solid #ddd9d0; border-radius: 10px; margin: 10px 0; padding: 12px; background: #faf9f6; }
  .activity { border: none; background: transparent; padding: 0; text-align: left; width: 100%; overflow-wrap: anywhere; }
  small { display: block; color: #716c61; font-size: 12px; margin: 8px 0; overflow-wrap: anywhere; }
  .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
`;

/** A phone-sized inbox rather than a desktop hex field compressed into a sheet. */
export default function MobileLimbo({ activities, threads = {}, beginActivity, deleteActivity, focusActivity, planInLimbo }: Props) {
  const [name, setName] = React.useState('');
  const items = limboItems(activities);
  return <Page data-native-scroll="true">
    {planInLimbo && <form onSubmit={event => {
      event.preventDefault();
      if (!name.trim()) return;
      planInLimbo(name.trim()); setName('');
    }}>
      <input aria-label="New Limbo activity" placeholder="Something for later…" value={name} data-1p-ignore
        autoComplete="off" onChange={event => setName(event.target.value)} />
      <button type="submit" disabled={!name.trim()}>Add</button>
    </form>}
    {items.length === 0 ? <p>Limbo is empty. Park an idea here when you’re ready.</p> :
      <ul aria-label="Limbo activities">{items.map(({ activity }) => <li key={activity.id}>
        <button type="button" className="activity" onClick={() => focusActivity(activity.id)}>{activity.name}</button>
        <small>{threads[String(activity.thread_id)]?.name ?? activity.thread?.name ?? 'Thread'}
          {' · '}{activity.status === 'suspended' ? 'Suspended' : 'Not started'}
          {activity.weight != null && activity.weight > 0 ? ` · Weight ${activity.weight}` : ''}</small>
        <div className="actions">
          <button type="button" onClick={() => focusActivity(activity.id)}>Details</button>
          {activity.status === 'unstarted' && activity.thread_id != null && <>
            <button type="button" onClick={() => beginActivity(activity.id)}>Begin</button>
            <button type="button" onClick={() => deleteActivity(activity.id, activity.thread_id!)}>Give up</button>
          </>}
        </div>
      </li>)}</ul>}
  </Page>;
}
