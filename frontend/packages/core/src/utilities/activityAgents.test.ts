import { describe, expect, it } from 'vitest';

import { activityAgentChoices, HUMAN_AGENT_CHOICE } from './activityAgents';

describe('activityAgentChoices', () => {
  it('offers Human and other known agents when the block belongs to an agent', () => {
    expect(activityAgentChoices(
      { agent_id: 'cursor:steve', agent_name: 'Steve' },
      [
        { agent_id: 'cursor:steve', name: 'Steve' },
        { agent_id: 'cursor:nora', name: 'Nora' },
      ],
    )).toEqual([
      HUMAN_AGENT_CHOICE,
      { id: 'cursor:nora', name: 'Nora' },
    ]);
  });

  it('omits Human when the block is already human', () => {
    expect(activityAgentChoices(
      { agent_id: null },
      [{ agent_id: 'cursor:steve', name: 'Steve' }],
    )).toEqual([{ id: 'cursor:steve', name: 'Steve' }]);
  });

  it('includes agents that only appear on the current chart', () => {
    expect(activityAgentChoices(
      { agent_id: null },
      [],
      { 1: { agent_id: 'import:miles', agent_name: 'Miles' } },
    )).toEqual([{ id: 'import:miles', name: 'Miles' }]);
  });

  it('keeps one row per display name across agent ids', () => {
    expect(activityAgentChoices(
      { agent_id: null },
      [
        { agent_id: 'cursor:pulse-a', name: 'pulse' },
        { agent_id: 'cursor:pulse-b', name: 'pulse' },
        { agent_id: 'cursor:nora', name: 'Nora' },
      ],
      {
        1: { agent_id: 'cursor:pulse-c', agent_name: 'Pulse' },
        2: { agent_id: 'cursor:pulse-a', agent_name: 'pulse' },
      },
    )).toEqual([
      { id: 'cursor:pulse-a', name: 'pulse' },
      { id: 'cursor:nora', name: 'Nora' },
    ]);
  });

  it('does not offer another id that shares the current activity name', () => {
    expect(activityAgentChoices(
      { agent_id: 'cursor:pulse-a', agent_name: 'pulse' },
      [
        { agent_id: 'cursor:pulse-a', name: 'pulse' },
        { agent_id: 'cursor:pulse-b', name: 'pulse' },
        { agent_id: 'cursor:nora', name: 'Nora' },
      ],
    )).toEqual([
      HUMAN_AGENT_CHOICE,
      { id: 'cursor:nora', name: 'Nora' },
    ]);
  });
});
