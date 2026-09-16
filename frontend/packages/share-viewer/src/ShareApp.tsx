import { useEffect, useState } from 'react';
import { Route, Routes, useParams } from 'react-router-dom';
import {
  ChartHarness,
  isTimelineSnapshot,
  type TimelineSnapshot,
} from '../../core/src/chart';

function snapshotUrl(id: string): string {
  const base = (import.meta.env.VITE_SNAPSHOT_BASE_URL as string | undefined)?.replace(/\/$/, '');
  if (!base) {
    throw new Error('VITE_SNAPSHOT_BASE_URL is not set');
  }
  return `${base}/${id}.json`;
}

function SharePage() {
  const { id } = useParams<{ id: string }>();
  const [snapshot, setSnapshot] = useState<TimelineSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Missing share id.');
      return;
    }
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
        if (!response.ok) throw new Error(response.status === 404 ? 'This share was not found.' : 'Could not load this share.');
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
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Could not load this share.');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
        <h1>Share unavailable</h1>
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
      viewport={snapshot.viewport}
    />
  );
}

export function ShareApp() {
  return (
    <Routes>
      <Route path="/s/:id" element={<SharePage />} />
      <Route
        path="*"
        element={(
          <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
            <h1>Flambe share</h1>
            <p>Open a link like <code>/s/&lt;id&gt;</code> to view a frozen timeline.</p>
          </main>
        )}
      />
    </Routes>
  );
}
