import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ChartHarness,
  isTimelineSnapshot,
  type TimelineSnapshot,
} from '../../core/src/chart';
import { colors } from '../../core/src/styles';
import {
  clearLocalSnapshot,
  readLocalSnapshot,
  snapshotFromFileText,
  writeLocalSnapshot,
} from './localSnapshot';
import { shareIdFromPath } from './sharePath';

function snapshotUrl(id: string): string {
  const base = import.meta.env.VITE_SNAPSHOT_BASE_URL?.replace(/\/$/, '');
  if (!base) {
    throw new Error('VITE_SNAPSHOT_BASE_URL is not set');
  }
  return `${base}/${id}.json`;
}

function hasFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}

export function ShareApp() {
  const id = typeof window === 'undefined' ? null : shareIdFromPath(window.location.pathname);
  const localMode = !id;
  const [snapshot, setSnapshot] = useState<TimelineSnapshot | null>(() =>
    localMode ? readLocalSnapshot() : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [chartKey, setChartKey] = useState(0);
  const dragDepth = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);

  const applyLocalSnapshot = useCallback((next: TimelineSnapshot) => {
    setSnapshot(next);
    setError(null);
    setChartKey(key => key + 1);
    try {
      writeLocalSnapshot(next);
      setNotice(null);
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Could not keep this file after a refresh.');
    }
  }, []);

  const loadDroppedFile = useCallback(
    async (file: File | undefined) => {
      if (!file) {
        setError('Drop a JSON file that contains a Flambe timeline snapshot.');
        return;
      }
      try {
        applyLocalSnapshot(snapshotFromFileText(await file.text()));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not read that file.');
      }
    },
    [applyLocalSnapshot],
  );

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

  useEffect(() => {
    if (!localMode) return undefined;

    const onDragEnter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth.current += 1;
      setDragging(true);
    };
    const onDragOver = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    };
    const onDragLeave = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragging(false);
    };
    const onDrop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      void loadDroppedFile(event.dataTransfer?.files[0]);
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [loadDroppedFile, localMode]);

  const page = (children: ReactNode) => (
    <main
      style={{
        boxSizing: 'border-box',
        color: colors.text,
        fontFamily: 'sans-serif',
        height: '100%',
        padding: 24,
        position: 'relative',
      }}
    >
      {children}
      {localMode ? dropOverlay(dragging) : null}
    </main>
  );

  if (localMode && !snapshot) {
    return page(
      <>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: '0 0 12px' }}>Flambe share</h1>
        <p style={{ lineHeight: 1.5, margin: '0 0 16px', maxWidth: 40 * 16 }}>
          Drop a timeline snapshot JSON file here to render it. It stays in this browser so a refresh
          keeps it. Shared links still work at <code>/s/&lt;id&gt;</code>.
        </p>
        {error ? <p style={{ color: colors.red, margin: '0 0 16px' }}>{error}</p> : null}
        <button
          onClick={() => fileInput.current?.click()}
          style={{
            background: colors.background,
            border: `1px solid ${colors.hover}`,
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            padding: '8px 12px',
          }}
          type="button"
        >
          Choose a JSON file
        </button>
        <input
          accept=".json,application/json"
          hidden
          onChange={event => {
            void loadDroppedFile(event.target.files?.[0]);
            event.target.value = '';
          }}
          ref={fileInput}
          type="file"
        />
      </>,
    );
  }

  if (error && !snapshot) {
    return page(
      <>
        <h1>{id ? 'Share unavailable' : 'Flambe share'}</h1>
        <p>{error}</p>
      </>,
    );
  }

  if (!snapshot) {
    return page(<p>Loading timeline…</p>);
  }

  document.title = `${snapshot.fixture.traceName} · Flambe share`;

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <ChartHarness
        chrome={
          localMode ? (
            <div
              style={{
                alignItems: 'center',
                background: colors.background,
                borderBottom: `1px solid ${colors.hover}`,
                display: 'flex',
                fontFamily: 'sans-serif',
                fontSize: 13,
                gap: 12,
                justifyContent: 'space-between',
                padding: '8px 12px',
              }}
            >
              <span>
                {error
                  ? error
                  : notice
                    ? notice
                    : 'Local snapshot. Drop another JSON file to replace it.'}
              </span>
              <button
                onClick={() => {
                  clearLocalSnapshot();
                  setSnapshot(null);
                  setNotice(null);
                  setError(null);
                  document.title = 'Flambe share';
                }}
                style={{
                  background: colors.background,
                  border: `1px solid ${colors.hover}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
                type="button"
              >
                Clear
              </button>
            </div>
          ) : undefined
        }
        demoOverlays={false}
        fixture={snapshot.fixture}
        height="100%"
        key={localMode ? chartKey : id ?? 'share'}
        timeLabels={snapshot.timeLabels}
        viewport={snapshot.viewport}
      />
      {localMode ? dropOverlay(dragging) : null}
    </div>
  );
}

function dropOverlay(dragging: boolean) {
  if (!dragging) return null;
  return (
    <div
      style={{
        alignItems: 'center',
        background: colors.dropTarget,
        color: colors.text,
        display: 'flex',
        fontFamily: 'sans-serif',
        fontSize: 22,
        inset: 0,
        justifyContent: 'center',
        opacity: 0.92,
        pointerEvents: 'none',
        position: 'fixed',
        zIndex: 20,
      }}
    >
      Drop JSON to render this timeline
    </div>
  );
}
