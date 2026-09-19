import { useEffect, useState } from 'react';
import {
  ChartHarness,
  isTimelineSnapshot,
  type TimelineSnapshot,
} from '../../core/src/chart';
import { colors } from '../../core/src/styles';
import { SharePlayground } from './SharePlayground';
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
  const [error, setError] = useState<string | null>(null);

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

  if (!id) {
    return <SharePlayground />;
  }

  if (error) {
    return (
      <main
        style={{
          boxSizing: 'border-box',
          color: colors.text,
          fontFamily: 'sans-serif',
          height: '100%',
          padding: 24,
        }}
      >
        <h1>Share unavailable</h1>
        <p>{error}</p>
      </main>
    );
  }

  if (!snapshot) {
    return (
      <main style={{ color: colors.text, fontFamily: 'sans-serif', padding: 24 }}>
        <p>Loading timeline…</p>
      </main>
    );
  }

  document.title = `${snapshot.fixture.traceName} · Flambe share`;

  return (
    <ChartHarness
      demoOverlays={false}
      fixture={snapshot.fixture}
      height="100%"
      timeLabels={snapshot.timeLabels}
      viewport={snapshot.viewport}
    />
  );
}
