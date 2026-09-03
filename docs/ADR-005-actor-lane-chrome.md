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
single-row flames, nested delegation, sequential same-agent bursts, label text, and
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
| **Wash** | Translucent fill behind a flame’s rows. Horizontally it spans the flame’s root time range (start of earliest same-actor block through end of latest, including open ends). It is not full chart width. |
| **Gutter** | Fixed screen-space strip immediately left of the flame’s first block, holding the rail and the agent label. |
| **Fork** | Curve from a parent activity into a child flame’s first block; join sits on the block edge past the gutter. |

### Label and color

- **Label text** is the agent **display name** (`agent_name` / resolved display name), not the model provider product name.
- **Rail and wash color** encode **model provider**, inferred for now from the `agent_id` prefix (`claude:`, `cursor:`, `codex:`, …). An explicit provider field may replace prefix inference later without changing this split.

### Situation rules (locked)

- **Single-row flame:** label stays rotated 90° CCW in the fixed gutter, drawn in tiny type so more of the name fits; wash still spans the full root activity duration.
- **Multi-row flame:** label may be rotated 90° CCW in the gutter when height allows; otherwise shorten while staying vertical.
- **Nested delegation:** child flame chrome is inset (deeper gutter/rail) inside the parent flame’s vertical band; fork remains.
- **Sequential same-agent bursts:** if the gap between one flame’s end and the next same-agent flame’s start is at most **one timeline grid tick** (the current axis step for the visible window), treat them as **one** flame for chrome (one wash, one label, one rail). Larger gaps stay separate flames.

## Rationale

David chose display name vs provider color so “who” and “what model” stay visually distinct when the same named agent runs on different providers.

David chose a time-bounded wash (not a full-width band) so chrome follows the work without covering the whole thread.

David chose “one grid tick” as the merge threshold so closeness tracks the same zoom-dependent scale the user already reads on the axis.

## Alternatives considered

- Full-width tinted lane bands.
- Left rail only with no wash.
- Label text = model provider; color = agent identity (inverted from the decision above).
- Horizontal labels in a widened gutter on single-row flames (S1b).
- Always-vertical labels with initials-only on single-row flames.
- Merging sequential flames with a fixed wall-clock gap (e.g. 2 or 5 minutes) instead of one grid tick.
- Deduping labels across all flames of the same agent in view regardless of time gap.

## Consequences

- Frontend chrome helpers and Storybook fixtures should use **rail / wash / gutter / activity block / fork** consistently in comments and names.
- `actorAccentColor` (or successor) should key off provider, not display name.
- Flame projection may coalesce temporally close same-agent roots before painting chrome.
- Category bar fill remains independent of rail/wash color.

## Follow-ups

- Explicit provider field on activities (replace `agent_id` prefix inference).
- Chart warning when a parent ended while children were still active (historical traces).
