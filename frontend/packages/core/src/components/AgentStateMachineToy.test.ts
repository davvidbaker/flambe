import { createActor } from 'xstate';
import { describe, expect, it } from 'vitest';
import { agentToyMachine } from './AgentStateMachineToy.machine';

describe('agentToyMachine', () => {
  it('bounces through exploring, executing, consulting_reducer, waiting_for_human, and suspended while emitting flamechart events', () => {
    const actor = createActor(agentToyMachine);
    actor.start();

    // Seed starts in exploring with 2 nested activities so the flamechart has bars immediately
    expect(actor.getSnapshot().value).toBe('exploring');
    expect(actor.getSnapshot().context.stack).toHaveLength(2);
    expect(actor.getSnapshot().context.traceEvents).toHaveLength(2);

    actor.send({ type: 'LOCK_IN_PLAN', name: 'Write state machine' });
    expect(actor.getSnapshot().value).toBe('executing');
    expect(actor.getSnapshot().context.stack).toHaveLength(3);

    actor.send({ type: 'ASK_REDUCER', note: 'Confirm scope' });
    expect(actor.getSnapshot().value).toBe('consulting_reducer');

    actor.send({ type: 'REDUCER_ESCALATE', question: 'Which states?' });
    expect(actor.getSnapshot().value).toBe('waiting_for_human');

    actor.send({ type: 'HUMAN_REPLIED', answer: 'Render a flamechart in a thread' });
    expect(actor.getSnapshot().value).toBe('executing');

    actor.send({ type: 'SUSPEND_WORK', reason: 'Pause for review' });
    expect(actor.getSnapshot().value).toBe('suspended');

    actor.send({ type: 'RESUME_WORK' });
    expect(actor.getSnapshot().value).toBe('exploring');

    actor.send({ type: 'FINISH_ALL', summary: 'Done' });
    expect(actor.getSnapshot().value).toBe('idle');
    expect(actor.getSnapshot().context.stack).toHaveLength(0);
    expect(actor.getSnapshot().context.traceEvents.some(e => e.phase === 'E')).toBe(true);

    actor.stop();
  });
});
