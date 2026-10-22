export interface Agent {
  agent_id: string;
  name: string;
  platform?: string | null;
  last_seen_at?: string | null;
}
