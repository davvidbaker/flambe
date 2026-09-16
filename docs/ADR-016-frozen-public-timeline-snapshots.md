# ADR-016: Frozen public timeline snapshots

## Status
Accepted

## Context

David wanted to export the current timeline view (time window, included threads, and each thread’s expanded/collapsed state) as something easily shareable. Live links into the private Fly instance were considered. A new Vercel deploy per share was considered. Zip download was left as a later option using the same bytes.

Flambe already renders the production chart offline from `AppChartFixture` via ChartHarness (ADR-003, ADR-006). The hosted product is a private Fly instance (ADR-007).

## Decision

Shares are **frozen snapshots**, not live cameras into a Fly trace.

The snapshot is versioned JSON: viewport (`leftBoundaryTime` / `rightBoundaryTime`) plus an `AppChartFixture` whose threads are already filtered and tagged with initial `collapsed`.

A **single** public Vercel static viewer loads that JSON from Vercel Blob (`/s/:id`). The private Phoenix app authenticates the author, uploads the JSON, and returns the viewer URL. Public shares do not live on the Fly origin.

## Rationale

David chose snapshot over live, and a separate Vercel viewer plus blob storage over unlisted URLs on Fly.

## Alternatives considered

- Live share into `/traces/:id` on Fly. Not selected; the page would change as work continued and would sit on the private instance.
- A new Vercel project/deploy per export. Not selected; one viewer plus uploaded JSON is enough for a stable URL.
- Zip-only v1. Not selected for the first public URL; the same snapshot can back a zip later.

## Consequences

Anyone with the unlisted URL can see the sliced activities and event messages. Recipients can pan/zoom the frozen data; they cannot mutate Flambe. Sharing requires `FLAMBE_SHARE_VIEWER_URL` and `VERCEL_BLOB_READ_WRITE_TOKEN`. Vertical scroll, settings, and observations are omitted from v1.

## Follow-ups

- Offline zip of the viewer plus `snapshot.json`
- Revoke / list shares
- Optional observations and settings in the snapshot
