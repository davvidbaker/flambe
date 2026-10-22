import { AGENT_CONTACT_FRESH_MS } from '../constants/agentContact';
import type { Agent } from '../types/Agent';
import type { Activity } from '../types/Activity';
import type { EntityId } from '../types/ids';
import type { TraceBlock } from './processTrace';

export interface AgentContact {
  kind: 'recent' | 'stale' | 'unknown';
  label: string;
  title: string;
  lastSeenTime: number | null;
}

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'always' });

export function agentContact(lastSeenAt: string | null | undefined, now = Date.now()): AgentContact {
  const lastSeenTime = lastSeenAt ? Date.parse(lastSeenAt) : NaN;
  if (!Number.isFinite(lastSeenTime) || lastSeenTime > now) {
    return {
      kind: 'unknown', lastSeenTime: null, label: 'No contact recorded',
      title: 'Flambe has no last-contact timestamp for this agent.',
    };
  }
  const age = now - lastSeenTime;
  const title = `Last heard from ${new Date(lastSeenTime).toLocaleString()}`;
  if (age <= AGENT_CONTACT_FRESH_MS) {
    return { kind: 'recent', lastSeenTime, label: 'Recent contact',
      title: `${title}. Contact with Flambe within the past minute.` };
  }
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['day', 86_400_000], ['hour', 3_600_000], ['minute', 60_000], ['second', 1000],
  ];
  const [unit, milliseconds] = units.find(([, duration]) => age >= duration)!;
  return { kind: 'stale', lastSeenTime,
    label: `Last heard from ${relativeTime.format(-Math.floor(age / milliseconds), unit)}`, title };
}

/** First moment a currently recent contact becomes stale, even without a new event. */
export function nextAgentContactExpiry(agents: Agent[], now = Date.now()): number | null {
  const expiries = agents.flatMap(agent => {
    const contact = agentContact(agent.last_seen_at, now);
    return contact.kind === 'recent' ? [contact.lastSeenTime! + AGENT_CONTACT_FRESH_MS + 1] : [];
  });
  return expiries.length ? Math.min(...expiries) : null;
}

export function agentsWithOpenWork(
  blocks: Pick<TraceBlock, 'activity_id' | 'endTime' | 'scheduled'>[],
  activities: Record<string, Pick<Activity, 'agent_id' | 'thread_id'>>,
  threadId?: EntityId,
): Set<string> {
  return new Set(blocks.flatMap(block => {
    const activity = activities[String(block.activity_id)];
    const id = activity?.agent_id;
    const ownsThread = threadId === undefined || String(activity?.thread_id) === String(threadId);
    return id && ownsThread && !block.scheduled && block.endTime == null ? [id] : [];
  }));
}
