import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { AGENT_CONTACT_POLL_MS } from '../constants/agentContact';
import { agentContact, nextAgentContactExpiry } from '../utilities/agentContact';

const Status = styled.span`
  color: #666;
  font-size: 12px;
`;

export default function AgentContactStatus({ lastSeenAt }: { lastSeenAt?: string | null }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (timer !== undefined) clearTimeout(timer);
      const time = Date.now();
      setNow(time);
      if (document.visibilityState === 'hidden') return;
      const expiry = nextAgentContactExpiry([{ agent_id: '', name: '', last_seen_at: lastSeenAt }], time);
      timer = setTimeout(refresh, Math.min(AGENT_CONTACT_POLL_MS, expiry === null ? Infinity : expiry - time));
    };
    refresh();
    document.addEventListener('visibilitychange', refresh);
    return () => {
      if (timer !== undefined) clearTimeout(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [lastSeenAt]);
  const contact = agentContact(lastSeenAt, now);
  return <Status data-contact={contact.kind} title={contact.title}>{contact.label}</Status>;
}
