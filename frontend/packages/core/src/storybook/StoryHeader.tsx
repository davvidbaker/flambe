import { useDispatch, useSelector } from 'react-redux';

import Header from '../components/Header';
import { selectTrace } from '../actions';
import { getTimeline } from '../reducers/timeline';
import { getUser } from '../reducers/user';
import type { RootState } from '../rootReducer';
import type { Trace } from '../types/Trace';

const noop = () => undefined;

export function StoryHeader() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => getUser(state));
  const timelineTrace = useSelector((state: RootState) => getTimeline(state).trace);
  const currentTrace: Trace | null = timelineTrace?.id
    ? { id: timelineTrace.id, name: timelineTrace.name ?? '' }
    : null;

  return (
    <Header
      traces={user.traces}
      currentTrace={currentTrace}
      selectTrace={trace => dispatch(selectTrace(trace))}
      deleteTrace={noop}
      deleteCurrentTrace={noop}
      currentMantra={user.mantras[user.mantras.length - 1]?.name}
      createMantra={noop}
      logout={noop}
    />
  );
}
