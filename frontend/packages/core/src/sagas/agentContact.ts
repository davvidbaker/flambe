import { eventChannel } from 'redux-saga';
import type { SagaIterator } from 'redux-saga';
import { call, delay, put, race, take, takeLatest } from 'redux-saga/effects';
import { USER_FETCH } from '../actions';
import { AGENT_CONTACTS_RECEIVED, AGENT_CONTACT_POLL_MS, AGENT_CONTACT_REQUEST_TIMEOUT_MS } from '../constants/agentContact';
import type { Agent } from '../types/Agent';

async function fetchAgentContacts(signal: AbortSignal): Promise<Agent[]> {
  const response = await fetch(`${SERVER}/api/agents`, { credentials: 'include', cache: 'no-store', signal });
  if (!response.ok) throw response;
  const { data } = await response.json();
  if (!Array.isArray(data)) throw new Error('Invalid agent contact response');
  return data;
}

export function* pollAgentContacts(): SagaIterator {
  const visibility = eventChannel<boolean>(emit => {
    const changed = () => emit(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', changed);
    return () => document.removeEventListener('visibilitychange', changed);
  });
  let request: AbortController | undefined;
  try {
    while (true) {
      if (document.visibilityState !== 'hidden') {
        request = new AbortController();
        try {
          const result: { agents?: Agent[]; timedOut?: true; visibility?: boolean } = yield race({
            agents: call(fetchAgentContacts, request.signal),
            timedOut: delay(AGENT_CONTACT_REQUEST_TIMEOUT_MS),
            visibility: take(visibility),
          });
          if (result.agents) yield put({ type: AGENT_CONTACTS_RECEIVED, agents: result.agents });
          else request.abort();
          // Process visibility immediately: hiding cancels the pending request,
          // and returning to the page should not wait for the polling interval.
          if ('visibility' in result) continue;
        } catch {
          // Presence is supplementary. Preserve timestamps and let them expire
          // naturally; a failed refresh should neither claim contact nor toast.
        }
      }
      yield race({ elapsed: delay(AGENT_CONTACT_POLL_MS), visibility: take(visibility) });
    }
  } finally {
    request?.abort();
    visibility.close();
  }
}

export default function* agentContactSaga(): SagaIterator {
  yield takeLatest(`${USER_FETCH}_SUCCEEDED`, pollAgentContacts);
}
