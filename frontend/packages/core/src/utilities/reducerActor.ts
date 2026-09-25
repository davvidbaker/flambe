import type { EntityId } from '../types/ids';
import type { TraceEvent } from '../types/TraceEvent';

export interface ReducerActor {
  agent: string;
  model: string;
}

export function actorNameFromModel(model: string): string {
  const downcased = model.toLowerCase();
  if (downcased.includes('jev')) return 'Jev';
  if (downcased.includes('luna')) return 'Luna';
  if (downcased.includes('terra')) return 'Terra';
  return model;
}

export function modelFromDecisionMessage(message?: string | null): string | null {
  if (!message) return null;
  const match = /(?:^|\s|\|)model=([^\s|]+)/.exec(message);
  if (!match) return null;
  const parts = match[1].split('->');
  return parts[parts.length - 1] || null;
}

export type ReducerDecisionPart = {
  key?: string;
  value: string;
};

export function reducerDecisionParts(message: string): ReducerDecisionPart[] {
  return message
    .split(/\s*\|\s*/)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const separator = part.indexOf('=');
      if (separator <= 0) return { value: part };
      return { key: part.slice(0, separator), value: part.slice(separator + 1) };
    });
}

export function latestReducerActor(
  events: TraceEvent[],
  activityId: EntityId,
): ReducerActor | null {
  const decisions = events
    .filter(event => (
      event.phase === 'reducer_decision'
      && event.activity
      && String(event.activity.id) === String(activityId)
    ))
    .sort((left, right) => (
      left.timestamp - right.timestamp || Number(left.id) - Number(right.id)
    ));

  const last = decisions[decisions.length - 1];
  const model = modelFromDecisionMessage(last?.message);
  if (!model) return null;
  return { agent: actorNameFromModel(model), model };
}
