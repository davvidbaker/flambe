import { useEffect, useState } from 'react';
import {
  ChartHarness,
  isTimelineSnapshot,
  type TimelineSnapshot,
} from '../../core/src/chart';
import { shareIdFromPath } from './sharePath';

function snapshotUrl(id: string): string {
  const base = import.meta.env.VITE_SNAPSHOT_BASE_URL?.replace(/\/$/, '');
  if (!base) {
    throw new Error('VITE_SNAPSHOT_BASE_URL is not set');
  }
  return `${base}/${id}.json`;
}

export function ShareApp() {
  const id = typeof window === 'undefined' ? null : shareIdFromPath(window.location.pathname);
  const [snapshot, setSnapshot] = useState<TimelineSnapshot | null>(null);
  const [error, setError] = useState<string | null>(id ? null : 'Open a link like /s/<id> to view a frozen timeline.');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setSnapshot(null);
    setError(null);
    let url: string;
    try {
      url = snapshotUrl(id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Share viewer is not configured.');
      return;
    }
    fetch(url)
      .then(async response => {
        if (!response.ok) {
          throw new Error(response.status === 404 ? 'This share was not found.' : 'Could not load this share.');
        }
        return response.json();
      })
      .then(body => {
        if (cancelled) return;
        if (!isTimelineSnapshot(body)) {
          setError('This share file is not a Flambe timeline snapshot.');
          return;
        }
        setSnapshot(body);
      })
      .catch(caught => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Could not load this share.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
        <h1>{id ? 'Share unavailable' : 'Flambe share'}</h1>
        <p>{error}</p>
      </main>
    );
  }

  if (!snapshot) {
    return (
      <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
        <p>Loading timeline…</p>
      </main>
    );
  }

  document.title = `${snapshot.fixture.traceName} · Flambe share`;

  return (
    <ChartHarness
      demoOverlays={false}
      fixture={snapshot.fixture}
      timeLabels={snapshot.timeLabels}
      viewport={snapshot.viewport}
    />
  );
}
