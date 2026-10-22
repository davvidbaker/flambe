import { describe, expect, it } from 'vitest';
import { AGENT_CONTACT_FRESH_MS } from '../constants/agentContact';
import { agentContact, agentsWithOpenWork, nextAgentContactExpiry } from './agentContact';

const now = Date.parse('2026-10-22T05:00:00Z');
const seen = (age: number) => new Date(now - age).toISOString();

describe('agent contact evidence', () => {
  it('keeps the 60-second boundary recent and expires immediately afterward', () => {
    const timestamp = seen(AGENT_CONTACT_FRESH_MS);
    expect(agentContact(timestamp, now).kind).toBe('recent');
    expect(agentContact(timestamp, now + 1).kind).toBe('stale');
    expect(agentContact(timestamp, now + 1).label).toBe('Last heard from 1 minute ago');
  });

  it.each([undefined, null, '', 'invalid', new Date(now + 1000).toISOString()])(
    'treats absent or unusable contact %s as unknown', timestamp => {
      expect(agentContact(timestamp, now)).toMatchObject({ kind: 'unknown', lastSeenTime: null, label: 'No contact recorded' });
    },
  );

  it('reports elapsed time from the original contact rather than the latest fetch', () => {
    expect(agentContact(seen(12 * 60_000), now).label).toBe('Last heard from 12 minutes ago');
    expect(agentContact(seen(12 * 60_000), now + 60_000).label).toBe('Last heard from 13 minutes ago');
  });

  it('schedules only the next expiration and ignores unknown and stale timestamps', () => {
    const agents = [
      { agent_id: 'a', name: 'A', last_seen_at: seen(50_000) },
      { agent_id: 'b', name: 'B', last_seen_at: seen(30_000) },
      { agent_id: 'c', name: 'C', last_seen_at: seen(120_000) },
      { agent_id: 'd', name: 'D', last_seen_at: null },
    ];
    expect(nextAgentContactExpiry(agents, now)).toBe(now + 10_001);
    expect(nextAgentContactExpiry(agents, now + 10_001)).toBe(now + 30_001);
    expect(nextAgentContactExpiry(agents, now + 30_001)).toBeNull();
  });

  it('marks only agents owning open visible work, excluding completed, scheduled, and human work', () => {
    const activities = {
      1: { agent_id: 'recent' }, 2: { agent_id: 'ended' },
      3: { agent_id: 'planned' }, 4: { agent_id: null }, 5: { agent_id: 'hidden' },
    };
    expect(agentsWithOpenWork([
      { activity_id: 1 }, { activity_id: 2, endTime: now },
      { activity_id: 3, scheduled: true }, { activity_id: 4 },
    ], activities)).toEqual(new Set(['recent']));
  });
});
