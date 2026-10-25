# ADR-020: David messages agents from the UI; delivery rides the agent's next command

## Status

Accepted.

## Context

David wants to message a live coding agent from the Flambe UI and have the message
interrupt its work. Agents already call Flambe at semantic boundaries (`start`, `end`,
`suspend`, `resume`, `message`, `status`), and every result already carries a binding
`direction` / `reply`. Flambe has no channel to push into an agent's session, so the
next agent command is the only reliable delivery point.

## Decision

1. **Messages target an agent, not an activity.** David picks the agent from its lane
   label or from an activity's agent name. The message reaches that `agent_id`
   whatever it is working on when it next checks in.
2. **Stored inbox.** An `agent_messages` row holds the sending user, agent id, body,
   the trace it was sent from (for display), and `delivered_at`. It is pending until
   delivered.
3. **Delivered on the next agent command, on any trace.** Agents are per user, not
   per trace, so every successful `AgentCommands.execute` result for that agent
   includes its pending messages as `inbox` and marks them delivered in the same
   request. A failed command delivers nothing.
4. **A message is a binding instruction, not a stop switch.** The agent follows it and
   keeps working, adjusted. There is no pause toggle; if David wants a stop, he writes
   it in the message. The skill tells agents to act on `inbox` before the next step.
5. **The UI shows pending vs delivered**, plus when the agent last checked in, so a
   message to an agent that has gone quiet is visibly waiting.

## Alternatives considered

- **Target an activity.** Rejected by David: the recipient is the agent.
- **Optional pause/stop toggle on the message.** Rejected by David; stopping is just
  another instruction.
- **Route through the model reducer** so it can rewrite the stack. Not chosen: adds a
  model between David and the agent.

## Consequences

- Latency equals the gap between the agent's Flambe commands; an agent mid-edit sees
  the message only at its next work-unit boundary.
- Messages to an agent whose session has ended stay pending indefinitely.
- Queued offline CLI operations receive no inbox until they reach the server.
