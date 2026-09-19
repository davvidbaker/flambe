import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import AppModal from './AppModal';
import { hideShareTimeline as hideShareTimelineAction } from '../actions';
import type { RootState } from '../rootReducer';
import { getTimeline } from '../reducers/timeline';
import { getUser } from '../reducers/user';
import type { SettingsState } from '../reducers/settings';
import type { Thread } from '../types/Thread';
import type { EntityId } from '../types/ids';
import { rankThreadsByAttention, sortThreadsByRank } from '../utilities/timelineGeometry';
import {
  buildTimelineSnapshot,
  downloadTimelineSnapshot,
  type TimelineSnapshot,
} from '../utilities/timelineSnapshot';
import {
  fromDatetimeLocalValue,
  readSavedTimelineViewport,
  toDatetimeLocalValue,
} from '../utilities/timelineViewport';

type ThreadDraft = {
  collapsed: boolean;
  id: EntityId;
  included: boolean;
  name: string;
};

const Wrapper = styled.form`
  min-width: min(90vw, 420px);
  h1 {
    margin-top: 0;
    font-size: 1.2em;
  }
  p {
    color: #555;
    line-height: 1.4;
  }
  label {
    display: block;
    margin: 0.6em 0 0.2em;
    font-weight: 600;
  }
  input[type='datetime-local'] {
    width: 100%;
  }
  button {
    margin-right: 0.5em;
  }
`;

const ThreadRow = styled.li`
  display: flex;
  gap: 0.75em;
  align-items: center;
  list-style: none;
  margin: 0.35em 0;
  label {
    display: flex;
    align-items: center;
    gap: 0.35em;
    margin: 0;
    font-weight: 400;
  }
`;

const UrlBox = styled.div`
  display: flex;
  gap: 0.5em;
  input {
    flex: 1;
  }
`;

const EMPTY_IDS: EntityId[] = [];

export function orderedThreads(
  threads: Record<string, Thread>,
  attentionShifts: { thread_id: EntityId }[],
  attentionDriven: boolean,
): Thread[] {
  const copy = Object.fromEntries(
    Object.entries(threads).map(([id, thread]) => [id, { ...thread }]),
  );
  const ranked = attentionDriven
    ? rankThreadsByAttention(attentionShifts, copy)
    : copy;
  return sortThreadsByRank(ranked).map(([, thread]) => thread);
}

export function createShareThreadDrafts(
  threads: Record<string, Thread>,
  attentionShifts: { thread_id: EntityId }[],
  attentionDriven: boolean,
  filterExcludes: EntityId[],
): ThreadDraft[] {
  const hidden = new Set(filterExcludes.map(String));
  return orderedThreads(threads, attentionShifts, attentionDriven).map(thread => ({
    id: thread.id,
    name: thread.name,
    included: !hidden.has(String(thread.id)),
    collapsed: Boolean(thread.collapsed),
  }));
}

export function snapshotFromShareDraft(input: {
  absoluteTimeLabels: boolean;
  attentionShifts: { thread_id: EntityId; timestamp: number }[];
  categories: RootState['user']['categories'];
  draftThreads: ThreadDraft[];
  endValue: string;
  events: RootState['timeline']['events'];
  startValue: string;
  threads: Record<string, Thread>;
  twelveHourClock: boolean;
  traceId: EntityId | null;
  traceName: string | null;
}): { error: string } | { snapshot: TimelineSnapshot } {
  if (input.traceId === null || !input.traceName) {
    return { error: 'Open a trace before sharing.' };
  }
  const leftBoundaryTime = fromDatetimeLocalValue(input.startValue);
  const rightBoundaryTime = fromDatetimeLocalValue(input.endValue);
  if (leftBoundaryTime === null || rightBoundaryTime === null || rightBoundaryTime <= leftBoundaryTime) {
    return { error: 'Choose a start time before the end time.' };
  }
  const included = input.draftThreads.filter(thread => thread.included);
  if (included.length === 0) {
    return { error: 'Include at least one thread.' };
  }
  return {
    snapshot: buildTimelineSnapshot(
      {
        traceId: input.traceId,
        traceName: input.traceName,
        threads: Object.values(input.threads),
        events: input.events,
        categories: input.categories,
        attentionShifts: input.attentionShifts,
      },
      {
        leftBoundaryTime,
        rightBoundaryTime,
        includedThreadIds: included.map(thread => thread.id),
        collapsedThreadIds: included.filter(thread => thread.collapsed).map(thread => thread.id),
        absoluteTimeLabels: input.absoluteTimeLabels,
        twelveHourClock: input.twelveHourClock,
      },
    ),
  };
}

interface Props {
  absoluteTimeLabels: boolean;
  attentionDrivenThreadOrder: boolean;
  attentionShifts: { thread_id: EntityId; timestamp: number }[];
  categories: RootState['user']['categories'];
  events: RootState['timeline']['events'];
  filterExcludes: EntityId[];
  hideShareTimeline: () => unknown;
  leftBoundaryTime: number;
  rightBoundaryTime: number;
  shareTimelineVisible: boolean;
  threads: Record<string, Thread>;
  twelveHourClock: boolean;
  traceId: EntityId | null;
  traceName: string | null;
}

function ShareTimeline({
  absoluteTimeLabels,
  attentionDrivenThreadOrder,
  attentionShifts,
  categories,
  events,
  filterExcludes,
  hideShareTimeline,
  leftBoundaryTime: viewLeftBoundaryTime,
  rightBoundaryTime: viewRightBoundaryTime,
  shareTimelineVisible,
  threads,
  twelveHourClock,
  traceId,
  traceName,
}: Props) {
  const [startValue, setStartValue] = useState('');
  const [endValue, setEndValue] = useState('');
  const [draftThreads, setDraftThreads] = useState<ThreadDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!shareTimelineVisible) return;
    const saved = readSavedTimelineViewport();
    const now = Date.now();
    const left = (
      Number.isFinite(viewLeftBoundaryTime) && viewLeftBoundaryTime > 0
        ? viewLeftBoundaryTime
        : saved?.leftBoundaryTime
    ) ?? now - 60 * 60 * 1000;
    const right = (
      Number.isFinite(viewRightBoundaryTime) && viewRightBoundaryTime > 0
        ? viewRightBoundaryTime
        : saved?.rightBoundaryTime
    ) ?? now;
    setStartValue(toDatetimeLocalValue(left));
    setEndValue(toDatetimeLocalValue(right));
    setDraftThreads(
      createShareThreadDrafts(
        threads,
        attentionShifts,
        attentionDrivenThreadOrder,
        filterExcludes,
      ),
    );
    setBusy(false);
    setError(null);
    setShareUrl(null);
    // Seed only when the modal opens. Live thread updates and local checkbox
    // state must not rebuild this list, or includes snap back to Redux.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareTimelineVisible]);

  const draftSnapshot = () => snapshotFromShareDraft({
    absoluteTimeLabels,
    attentionShifts,
    categories,
    draftThreads,
    endValue,
    events,
    startValue,
    threads,
    twelveHourClock,
    traceId,
    traceName,
  });

  const exportJson = () => {
    const result = draftSnapshot();
    if ('error' in result) {
      setError(result.error);
      return;
    }
    setError(null);
    downloadTimelineSnapshot(result.snapshot);
  };

  const publish = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = draftSnapshot();
    if ('error' in result) {
      setError(result.error);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`${SERVER}/api/timeline-shares`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ snapshot: result.snapshot }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof body.error === 'string' ? body.error : `Share failed (${response.status})`);
      }
      if (typeof body.url !== 'string') {
        throw new Error('Share succeeded but no URL was returned.');
      }
      setShareUrl(body.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Share failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppModal
      contentLabel="Share timeline"
      isOpen={shareTimelineVisible}
      onRequestClose={hideShareTimeline}
      wide
    >
      <Wrapper onSubmit={publish}>
        <h1>Share timeline</h1>
        <p>
          Anyone with the link can see this frozen slice — activity names and
          event messages in range. It will not update as the live trace changes.
          Export JSON downloads the same snapshot as a file.
        </p>
        <label htmlFor="share-start">Start</label>
        <input
          id="share-start"
          type="datetime-local"
          step="1"
          value={startValue}
          onChange={event => setStartValue(event.target.value)}
        />
        <label htmlFor="share-end">End</label>
        <input
          id="share-end"
          type="datetime-local"
          step="1"
          value={endValue}
          onChange={event => setEndValue(event.target.value)}
        />
        <label>Threads</label>
        <ul>
          {draftThreads.map(thread => (
            <ThreadRow key={String(thread.id)}>
              <label>
                <input
                  type="checkbox"
                  checked={thread.included}
                  onChange={() => setDraftThreads(current => current.map(item => (
                    String(item.id) === String(thread.id)
                      ? { ...item, included: !item.included }
                      : item
                  )))}
                />
                {thread.name}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={thread.collapsed}
                  disabled={!thread.included}
                  onChange={() => setDraftThreads(current => current.map(item => (
                    String(item.id) === String(thread.id)
                      ? { ...item, collapsed: !item.collapsed }
                      : item
                  )))}
                />
                collapsed
              </label>
            </ThreadRow>
          ))}
        </ul>
        {error ? <p role="alert">{error}</p> : null}
        {shareUrl ? (
          <UrlBox>
            <input readOnly value={shareUrl} aria-label="Share URL" />
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(shareUrl);
              }}
            >
              Copy URL
            </button>
          </UrlBox>
        ) : (
          <button type="submit" disabled={busy}>
            {busy ? 'Publishing…' : 'Publish public URL'}
          </button>
        )}
        <button type="button" onClick={exportJson} disabled={busy}>
          Export JSON
        </button>
        <button type="button" onClick={hideShareTimeline}>
          Close
        </button>
      </Wrapper>
    </AppModal>
  );
}

export default connect(
  (state: RootState) => {
    const timeline = getTimeline(state);
    return {
      absoluteTimeLabels: (state.settings as SettingsState).absoluteTimeLabels,
      attentionDrivenThreadOrder: (state.settings as SettingsState).attentionDrivenThreadOrder,
      twelveHourClock: (state.settings as SettingsState).twelveHourClock,
      attentionShifts: getUser(state).attentionShifts,
      categories: getUser(state).categories,
      events: timeline.events,
      filterExcludes: timeline.trace?.filterExcludes ?? EMPTY_IDS,
      leftBoundaryTime: timeline.leftBoundaryTime,
      rightBoundaryTime: timeline.rightBoundaryTime,
      shareTimelineVisible: state.shareTimelineVisible,
      threads: timeline.threads,
      traceId: timeline.trace?.id ?? null,
      traceName: timeline.trace?.name ?? null,
    };
  },
  dispatch => ({
    hideShareTimeline: () => dispatch(hideShareTimelineAction()),
  }),
)(ShareTimeline);
