import type { Activity } from '../types/Activity';
import type { Agent } from '../types/Agent';
import { actorName } from './actorFlames';

export interface AgentChoice {
  [key: string]: unknown;
  id: string | null;
  name: string;
}

export const HUMAN_AGENT_CHOICE: AgentChoice = { id: null, name: 'Human' };

function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

export function activityAgentChoices(
  activity: Pick<Activity, 'agent_id' | 'agent_name'>,
  agents: Agent[],
  activities: Record<string, Pick<Activity, 'agent_id' | 'agent_name'>> = {},
): AgentChoice[] {
  const byName = new Map<string, AgentChoice>();

  const add = (id: string, name: string) => {
    const key = nameKey(name);
    if (!key || byName.has(key)) return;
    byName.set(key, { id, name });
  };

  // Agents.list is most-recently-seen first; the first name wins.
  for (const agent of agents) {
    add(agent.agent_id, agent.name);
  }
  for (const item of Object.values(activities)) {
    if (!item.agent_id) continue;
    add(item.agent_id, item.agent_name || item.agent_id);
  }

  const currentId = activity.agent_id ?? null;
  const currentName = currentId === null ? null : nameKey(actorName(activity));
  const choices: AgentChoice[] = [];
  if (currentId !== null) choices.push(HUMAN_AGENT_CHOICE);
  for (const choice of byName.values()) {
    if (choice.id === currentId) continue;
    if (currentName && nameKey(choice.name) === currentName) continue;
    choices.push(choice);
  }
  return choices;
}
