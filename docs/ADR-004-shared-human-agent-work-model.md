# ADR-004: Use one work model for humans and agents

## Status

Accepted

## Context

Flambe is both a personal system for understanding work over time and a live view of coding-agent
work. Human and agent activity needs to coexist without turning projects, execution structure,
identity, and attention into competing meanings of the same field.

## Decision

Humans and agents use the same trace, thread, activity, and lifecycle-event model.

- A thread identifies the shared context or project where work belongs.
- Parent/child activities describe the work breakdown.
- Actor identity describes who performed an activity. Human-created activities may have no
  `agent_id`; agent-created activities carry agent identity.
- Attention describes the human's focus and remains separate from agent execution.
- Agent presence is a transient signal of recent communication, not activity state or attention.

Actor presentation follows the activity forest. An actor flame begins when an activity's actor
differs from its nearest parent actor. The flame is a visual projection: it does not change
thread ownership or persisted parentage.

**Display grammar (accepted):** Inside a project thread, each actor boundary opens a labeled
**actor sublane**. Same-actor descendants nest inside that lane. Concurrent actors under the same
parent become sibling lanes. When an actor is delegated under another actor (e.g. Nora under
Belinda), the child actor’s lane is **nested inside** the parent actor’s band — not promoted to a
peer of that parent. A **fork curve** runs from the parent activity into the child lane’s first
block so containment remains visible across lane boundaries. An agent activity with no parent is
shown as an independent actor lane without an invented connector.

## Rationale

David chose one shared work model because Flambe is intentionally both a personal work system and
an agent-work viewer. Keeping context, work structure, actor identity, attention, and presence as
separate concepts allows human and agent activity to appear together without changing what threads
or activity containment mean.

David selected nearest-parent actor changes as the branch anchor so the visualization follows
actual delegation and containment rather than creating actor-based thread ownership.

David selected nested actor sublanes with fork curves (design Variant 1) so each actor reads as a
coherent flame while parentage stays visible. Nested sublanes were preferred over peer lanes for
delegated actors so ownership of the delegation remains visual.

## Alternatives considered

- Split personal work and agent work into separate products or models.
- Represent each agent as a thread.
- Treat agent execution as human attention.
- Accent/fork overlay only (no layout lanes).
- Flat sibling lanes for every actor, with parentage only on forks.
- Silhouette envelopes or synthetic spanning actor bars.

## Consequences

Human and agent activities can share project threads and parent/child structure. Concurrent actors
use presentation-only display lanes that must not redefine thread ownership or activity
containment. Agent-specific features should normally add actor metadata or presentation rather than
new parallel work entities.

Human-only overlays such as attention, mantras, todos, and tab history are not part of the shared
activity model. Agent presence may expire or reset without changing persisted activity history.

Actor lanes and fork connectors are derived entirely in the frontend. They do not add a persisted
relationship. Bar fill stays category-based; actor color is reserved for lane chrome and forks.

## Follow-ups

- Evaluate new features against the five concept boundaries above.
- Keep actor-based display lanes distinct from project threads.
- Avoid extending the shared lifecycle vocabulary for concerns that belong only to a human or
  agent overlay.
- Implement nested actor sublanes + forks in the production chart / Storybook.
- Keep category color as bar fill; actor color only on lane chrome and fork curves.
