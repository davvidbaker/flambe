# ADR-005: Actor lane chrome vocabulary and grammar

## Status

Accepted

## Context

ADR-004 defined actor sublanes and forks as the display grammar for agents inside
project threads, but the chart implementation needed shared words for the painted
chrome (what sits behind or beside activity bars) and a few concrete labeling rules.
Without that vocabulary, Storybook and production iteration kept conflating bands,
gutters, labels, and model identity.

David walked through situation-specific chrome options and locked treatments for
single-row flames, nested delegation, same-agent owned work, label text, and
accent color.

## Decision

### Vocabulary

These terms are presentation-only. They do not change persisted activities, threads,
or parentage.

| Term | Meaning |
|------|---------|
| **Activity** (or activity **block**) | A lifecycle segment drawn as a category-colored bar. Fill stays category-based (ADR-004). |
| **Actor flame** | Presentation root that begins when an activity’s actor differs from its nearest parent actor (ADR-004). |
| **Rail** | Thin vertical accent at the left of a flame’s chrome. Color encodes **model provider**. |
| **Wash** | Translucent fill behind a flame’s rows. It is **sustained** so all of an agent’s owned work reads as one presence, but it is painted as rectangles **clipped to the (row × time) cells the agent actually occupies**. On a row, an agent’s idle gap is bridged into one rectangle only when no other actor’s block sits in that gap; a row the agent shares with a neighbour or human block at a different time is never washed over. Vertically it paints only occupied row runs — unused rows between a suspend and a later resume stay unwashed. It is not full chart width. |
| **Gutter** | Fixed screen-space strip immediately left of the flame’s first block, holding the rail and the agent label. |
| **Fork** | Curve from a parent activity into a child flame’s first block; join sits on the block edge past the gutter. |

### Label and color

- **Label text** is the agent **display name** (`agent_name` / resolved display name), not the model provider product name.
- **Rail and wash color** encode **model provider**, inferred for now from the `agent_id` prefix (`claude:`, `cursor:`, `codex:`, …). An explicit provider field may replace prefix inference later without changing this split.

### Situation rules (locked)

- **Single-row flame:** label stays rotated 90° CCW in the fixed gutter, drawn in tiny type so more of the name fits; wash still spans the full owned duration.
- **Multi-row flame:** label may be rotated 90° CCW in the gutter when height allows; otherwise shorten while staying vertical.
- **Nested delegation:** a delegated child owns its own rows outright — the parent’s wash does **not** extend over them, so washes never overlap. The child reads as nested through its inset (deeper) gutter/rail, label, and fork rather than by sitting under the parent’s fill.
- **All same-agent owned work:** every flame for the same agent on a thread — including independent `--root` workstreams and bursts with large idle gaps — shares **one sustained wash**, one rail, and one label. Nested delegated agents stay their own inset chrome.

## Rationale

David chose display name vs provider color so “who” and “what model” stay visually distinct when the same named agent runs on different providers.

David chose a time-bounded wash (not a full-width band) so chrome follows the work without covering the whole thread.

David chose a sustained wash across all of an agent’s owned activities so short `--root` flames and later bursts still read as one presence, instead of a constellation of labeled islands. Unused rows between a suspend and a later resume stay unwashed so a concurrent agent in the gap is not covered.

## Alternatives considered

- Full-width tinted lane bands.
- Left rail only with no wash.
- Label text = model provider; color = agent identity (inverted from the decision above).
- Horizontal labels in a widened gutter on single-row flames (S1b).
- Always-vertical labels with initials-only on single-row flames.
- Merging sequential flames with a fixed wall-clock gap (e.g. 2 or 5 minutes) or one grid tick.
- One label per flame, even when those flames share a sustained wash.
- Keeping independent `--root` flames as separate chrome even when they share an agent.

## Consequences

- Frontend chrome helpers and Storybook fixtures should use **rail / wash / gutter / activity block / fork** consistently in comments and names.
- `actorAccentColor` (or successor) should key off provider, not display name.
- Flame projection coalesces all same-agent roots on a thread into one wash before painting chrome.
- The wash is emitted as `washRects` clipped to each row's actual occupancy, so it never covers a neighbour or human block sharing a row at another time, and **no two washes overlap** — every row is washed by at most one agent (a delegated child's rows are the child's alone). When an agent's independent roots are interleaved onto rows shared with others, its single presence reads as several aligned rectangles under one rail/label rather than one solid block.
- Category bar fill remains independent of rail/wash color.

## Follow-ups

- Explicit provider field on activities (replace `agent_id` prefix inference).
- Chart warning when a parent ended while children were still active (historical traces).
