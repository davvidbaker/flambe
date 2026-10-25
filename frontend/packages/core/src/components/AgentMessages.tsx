import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { AGENT_CONTACT_POLL_MS } from '../constants/agentContact';
import type { EntityId } from '../types/ids';

/** A message David sent an agent from the UI (ADR-020). */
export interface AgentMessage {
  id: number;
  trace_id: EntityId | null;
  body: string;
  sent_at: string;
  delivered_at: string | null;
}

const Wrapper = styled.div`
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
`;

const Item = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
`;

const State = styled.span`
  color: #666;
  white-space: nowrap;
`;

const Input = styled.textarea`
  font: inherit;
  width: 100%;
  min-height: 2.5em;
  resize: vertical;
`;

const ErrorText = styled.div`
  color: #b91c1c;
`;

const messagesPath = (agentId: string) => `${SERVER}/api/agents/${encodeURIComponent(agentId)}/messages`;

export function messageState(message: AgentMessage): string {
  return message.delivered_at ? 'delivered ✓' : 'pending';
}

export default function AgentMessages({ agentId, agentName, traceId }: {
  agentId: string;
  agentName: string;
  traceId?: EntityId | null;
}) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(messagesPath(agentId), { credentials: 'include', cache: 'no-store' });
    if (!response.ok) return;
    const { data } = await response.json();
    if (Array.isArray(data)) setMessages(data);
  }, [agentId]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const pending = messages.some(message => !message.delivered_at);
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load().catch(() => {});
    }, AGENT_CONTACT_POLL_MS);
    return () => clearInterval(timer);
  }, [pending, load]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch(messagesPath(agentId), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ body, ...(traceId != null ? { trace_id: traceId } : {}) }),
      });
      if (!response.ok) throw new Error(`Could not send (${response.status})`);
      const { data } = await response.json();
      setMessages(current => [data, ...current]);
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send');
    } finally {
      setSending(false);
    }
  };

  return (
    <Wrapper>
      {messages.slice(0, 5).map(message => (
        <Item key={message.id} data-message-state={message.delivered_at ? 'delivered' : 'pending'}>
          <span>{message.body}</span>
          <State title={message.delivered_at ?? `sent ${message.sent_at}`}>{messageState(message)}</State>
        </Item>
      ))}
      <Input
        aria-label={`Message ${agentName}`}
        placeholder={`Message ${agentName}… (⌘↵ to send)`}
        value={draft}
        disabled={sending}
        onChange={event => setDraft(event.target.value)}
        onKeyDown={event => {
          event.stopPropagation();
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            send();
          }
        }}
      />
      {error && <ErrorText>{error}</ErrorText>}
    </Wrapper>
  );
}
