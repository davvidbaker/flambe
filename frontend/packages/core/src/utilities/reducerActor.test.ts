import { describe, expect, it } from 'vitest';
import type { TraceEvent } from '../types/TraceEvent';
import {
  actorNameFromModel,
  latestReducerActor,
  modelFromDecisionMessage,
  reducerDecisionParts,
} from './reducerActor';

const activity = { id: 12, name: 'Implement reducer', categories: [] };

function event(
  id: number,
  phase: TraceEvent['phase'],
  message: string,
  timestamp: number,
  activityId = activity.id,
): TraceEvent {
  return {
    id,
    phase,
    message,
    timestamp,
    activity: { ...activity, id: activityId },
  };
}

describe('actorNameFromModel', () => {
  it('maps known reducer models to short names', () => {
    expect(actorNameFromModel('jev-test')).toBe('Jev');
    expect(actorNameFromModel('gpt-5.6-luna')).toBe('Luna');
    expect(actorNameFromModel('gpt-5.6-terra')).toBe('Terra');
    expect(actorNameFromModel('gpt-5.4')).toBe('gpt-5.4');
  });
});

describe('modelFromDecisionMessage', () => {
  it('reads the final model from a decision message', () => {
    expect(modelFromDecisionMessage('model=jev-test | assessment=on_track')).toBe('jev-test');
    expect(
      modelFromDecisionMessage(
        'model=gpt-5.6-luna->gpt-5.6-terra escalation=assessment=uncertain | assessment=uncertain',
      ),
    ).toBe('gpt-5.6-terra');
    expect(modelFromDecisionMessage('placed | model=gpt-5.6-luna | categories=Backend')).toBe(
      'gpt-5.6-luna',
    );
    expect(modelFromDecisionMessage('rule=new_root_while_open | applied=reparent')).toBeNull();
  });
});

describe('reducerDecisionParts', () => {
  it('splits keyed values for inline code', () => {
    expect(reducerDecisionParts(
      'model=gpt-5.6-luna | assessment=on_track | rationale=Stay on the Storybook work.',
    )).toEqual([
      { key: 'model', value: 'gpt-5.6-luna' },
      { key: 'assessment', value: 'on_track' },
      { key: 'rationale', value: 'Stay on the Storybook work.' },
    ]);
    expect(reducerDecisionParts('placed | model=gpt-5.6-luna | categories=Backend')).toEqual([
      { value: 'placed' },
      { key: 'model', value: 'gpt-5.6-luna' },
      { key: 'categories', value: 'Backend' },
    ]);
  });
});

describe('latestReducerActor', () => {
  it('returns the latest decision on that activity', () => {
    expect(latestReducerActor([
      event(1, 'B', 'Started', 1),
      event(2, 'reducer_decision', 'model=jev-test | assessment=on_track', 2),
      event(3, 'reducer_decision', 'model=gpt-5.6-luna | assessment=on_track', 3),
      event(4, 'reducer_decision', 'model=jev-latest | assessment=on_track', 4, 99),
    ], activity.id)).toEqual({ agent: 'Luna', model: 'gpt-5.6-luna' });
  });
});
