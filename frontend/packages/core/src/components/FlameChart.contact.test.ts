import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlameChart } from './FlameChart';
import { AGENT_CONTACT_COLOR, AGENT_CONTACT_PULSE_MS } from '../constants/agentContact';

const now = Date.parse('2026-10-22T05:00:00Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.stubGlobal('document', Object.assign(new EventTarget(), { visibilityState: 'visible' }));
  vi.stubGlobal('window', { matchMedia: () => ({ matches: false }), removeEventListener: vi.fn() });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

function chart(lastSeenAt?: string | null, completed = false) {
  const block = { activity_id: 1, startTime: 20, endTime: completed ? 60 : undefined, level: 0, beginning: 'B', events: [] };
  const activities = { 1: { id: 1, agent_id: 'codex:test', thread_id: 1, categories: [] } };
  const agents = [{ agent_id: 'codex:test', name: 'Avery', last_seen_at: lastSeenAt }];
  const instance = new FlameChart({ threads: { 1: { id: 1 } }, blocks: [block], activities, agents } as never);
  instance.state = { canvasHeight: 200 };
  instance.actorLaneLayout = {} as never;
  instance.actorChromeBands = [{
    actorKey: 'agent:codex:test', actorName: 'Avery', threadId: 1, depth: 0,
    startTime: 20, endTime: completed ? 60 : null, rootActivityIds: [1],
    rowStart: 0, rowEnd: 0, washRects: [],
  }] as never;
  instance.offsets = { 1: 0 };
  instance.paintableBlocks = [block] as never;
  instance.renderActivities = activities as never;
  instance.timeToPixels = value => value;
  instance.threadCollapsed = () => false;
  instance.actorChromeOpacity = () => 1;
  instance.redrawChart = vi.fn();
  const fills: string[] = [];
  const context = {
    fillStyle: '', globalAlpha: 1, shadowBlur: 0, save: vi.fn(), restore: vi.fn(), fillRect: vi.fn(() => { fills.push(context.fillStyle); }),
    beginPath: vi.fn(), arc: vi.fn(), stroke: vi.fn(),
    measureText: () => ({ width: 10 }), translate: vi.fn(), rotate: vi.fn(), fillText: vi.fn(),
    fill: () => fills.push(context.fillStyle),
  };
  instance.ctx = context as unknown as CanvasRenderingContext2D;
  return { instance, fills, context };
}

describe('chart agent contact indicators', () => {
  it('draws the full recent-contact rail in neon without a separate circle', () => {
    const { instance, context, fills } = chart(new Date(now).toISOString());
    instance.drawActorLaneChrome('rail');
    expect(context.arc).not.toHaveBeenCalled();
    expect(context.fillRect).not.toHaveBeenCalled(); // No opaque rail beneath the pulse.
    instance.drawAgentContactPulse(instance.ctx);
    expect(fills[0]).toBe(AGENT_CONTACT_COLOR);
    expect(instance.actorContactRails[0].title).toContain('Recent contact');
    expect(instance.actorContactRails[0].height).toBeGreaterThan(10);
    expect(instance.actorContactRails[0].width).toBe(3);
    expect(context.fillRect).toHaveBeenCalledTimes(1);
  });

  it.each([new Date(now - 12 * 60_000).toISOString(), null])('keeps the normal rail for inactive contact %s', timestamp => {
    const { instance, context, fills } = chart(timestamp);
    instance.drawActorLaneChrome('rail');
    expect(context.arc).not.toHaveBeenCalled();
    expect(instance.actorContactRails).toEqual([]);
    expect(fills[0]).not.toBe(AGENT_CONTACT_COLOR);
    expect(context.fillRect).toHaveBeenCalled();
  });

  it('keeps completed work normal when the same agent has open work on another thread', () => {
    const { instance, context, fills } = chart(new Date(now).toISOString(), true);
    const completed = instance.paintableBlocks[0];
    const open = { ...completed, activity_id: 2, startTime: 40, endTime: undefined };
    const otherCompletedRoot = { ...completed, activity_id: 3, startTime: 30 };
    instance.paintableBlocks = [completed, open, otherCompletedRoot];
    instance.renderActivities = {
      ...instance.renderActivities,
      2: { ...instance.renderActivities['1'], id: 2, thread_id: 2 },
      3: { ...instance.renderActivities['1'], id: 3, thread_id: 2 },
    };
    instance.offsets = { 1: 0, 2: 50 };
    instance.actorChromeBands = [instance.actorChromeBands[0], {
      ...instance.actorChromeBands[0], threadId: 2, rootActivityIds: [2, 3], startTime: 30, endTime: null,
    }];
    instance.drawActorLaneChrome('rail');

    expect(context.fillRect).toHaveBeenCalledTimes(1); // Completed thread keeps its provider rail.
    expect(fills[0]).not.toBe(AGENT_CONTACT_COLOR);
    expect(instance.actorContactRails).toHaveLength(1); // Same-thread roots still share one recent rail.
    expect(instance.actorContactRails[0].y).toBeGreaterThan(50);
  });

  it('omits contact indicators from completed work', () => {
    const { instance, context, fills } = chart(new Date(now).toISOString(), true);
    instance.drawActorLaneChrome('rail');
    expect(context.arc).not.toHaveBeenCalled();
    expect(instance.actorContactRails).toEqual([]);
    expect(fills[0]).not.toBe(AGENT_CONTACT_COLOR);
  });

  it('expires the indicator without any new activity event or successful poll', () => {
    const { instance, context } = chart(new Date(now).toISOString());
    instance.scheduleContactExpiry();
    vi.advanceTimersByTime(60_000);
    expect(instance.redrawChart).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(instance.redrawChart).toHaveBeenCalledTimes(1);
    instance.drawActorLaneChrome('rail');
    expect(context.arc).not.toHaveBeenCalled();
    expect(instance.actorContactRails).toEqual([]);
    expect(instance.contactExpiryTimer).toBeNull();
  });

  it('pulses the overlay glow without repainting the timeline and stops at expiry', () => {
    const { instance, context } = chart(new Date(now).toISOString());
    instance.drawActorLaneChrome('rail');
    expect(instance.drawAgentContactPulse(instance.ctx)).toBe(true);
    const rail = instance.actorContactRails[0];
    expect(context.fillRect).toHaveBeenLastCalledWith(rail.x, rail.y, rail.width, rail.height);
    expect(context.arc).not.toHaveBeenCalled();
    const firstGlow = context.shadowBlur;
    vi.advanceTimersByTime(450);
    expect(instance.drawAgentContactPulse(instance.ctx)).toBe(true);
    expect(context.shadowBlur).not.toBe(firstGlow);
    expect(instance.redrawChart).not.toHaveBeenCalled();
    vi.setSystemTime(now + 60_001);
    expect(instance.drawAgentContactPulse(instance.ctx)).toBe(false);
  });

  it('fades from fully transparent to fully opaque', () => {
    const { instance, context } = chart(new Date(now).toISOString());
    instance.drawActorLaneChrome('rail');
    const cycleStart = now - now % AGENT_CONTACT_PULSE_MS;
    vi.setSystemTime(cycleStart);
    expect(instance.drawAgentContactPulse(instance.ctx)).toBe(true);
    expect(context.globalAlpha).toBe(0);
    vi.setSystemTime(cycleStart + AGENT_CONTACT_PULSE_MS / 2);
    expect(instance.drawAgentContactPulse(instance.ctx)).toBe(true);
    expect(context.globalAlpha).toBe(1);
  });

  it('keeps a fully visible neon rail for reduced motion and stops pulsing in a hidden page', () => {
    const { instance, context, fills } = chart(new Date(now).toISOString());
    instance.drawActorLaneChrome('rail');
    const drawn = context.arc.mock.calls.length;
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) });
    expect(instance.drawAgentContactPulse(instance.ctx)).toBe(false);
    expect(fills[0]).toBe(AGENT_CONTACT_COLOR);
    expect(context.globalAlpha).toBe(1);
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
    Object.assign(document, { visibilityState: 'hidden' });
    expect(instance.drawAgentContactPulse(instance.ctx)).toBe(false);
    expect(context.arc).toHaveBeenCalledTimes(drawn);
  });
});
