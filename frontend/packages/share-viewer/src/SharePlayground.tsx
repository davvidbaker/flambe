import { useCallback, useEffect, useRef, useState } from 'react';
import { ChartHarness, type TimelineSnapshot } from '../../core/src/chart';
import { AuthFrame } from '../../core/src/components/AuthShell';
import Logo from '../../core/src/components/Logo/src';
import { colors } from '../../core/src/styles';
import { createExampleSnapshot, formatSnapshotJson } from './exampleSnapshot';
import {
  clearLocalSnapshot,
  readLocalSnapshot,
  readLocalSnapshotText,
  snapshotFromFileText,
  writeLocalSnapshotText,
} from './localSnapshot';

function hasFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}

function snapshotsEqual(left: TimelineSnapshot, right: TimelineSnapshot): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isRetiredStarter(snapshot: TimelineSnapshot, text: string): boolean {
  if (snapshot.fixture.traceName !== 'Share playground') return false;
  const span = snapshot.viewport.rightBoundaryTime - snapshot.viewport.leftBoundaryTime;
  const day = 24 * 60 * 60 * 1000;
  return (
    snapshot.exportedAt === 1_700_000_000_000
    || /elastic/i.test(text)
    || span < 7 * day
    || span > 180 * day
    || snapshot.fixture.events.length < 40
    || snapshot.fixture.threads.length < 3
  );
}

function loadInitial(): { snapshot: TimelineSnapshot; starterText: string; text: string } {
  const stored = readLocalSnapshot();
  const storedText = readLocalSnapshotText();
  if (stored && storedText && !isRetiredStarter(stored, storedText)) {
    return { snapshot: stored, starterText: storedText, text: storedText };
  }
  const snapshot = createExampleSnapshot();
  const text = formatSnapshotJson(snapshot);
  return { snapshot, starterText: text, text };
}

export function SharePlayground() {
  const [boot] = useState(loadInitial);
  const [jsonText, setJsonText] = useState(boot.text);
  const [snapshot, setSnapshot] = useState(boot.snapshot);
  const [chartKey, setChartKey] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const appliedJson = useRef(JSON.stringify(boot.snapshot));
  const starterText = useRef(boot.starterText);

  const persistText = useCallback((text: string) => {
    try {
      writeLocalSnapshotText(text);
      setNotice(null);
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Could not keep this file after a refresh.');
    }
  }, []);

  const applyValidText = useCallback(
    (text: string, persist: boolean) => {
      const next = snapshotFromFileText(text);
      setParseError(null);
      if (!snapshotsEqual(JSON.parse(appliedJson.current) as TimelineSnapshot, next)) {
        appliedJson.current = JSON.stringify(next);
        setSnapshot(next);
        setChartKey(key => key + 1);
      }
      if (persist) persistText(text);
      return next;
    },
    [persistText],
  );

  const loadDroppedFile = useCallback(
    async (file: File | undefined) => {
      if (!file) {
        setParseError('Drop a JSON file that contains a Flambe timeline snapshot.');
        return;
      }
      const text = await file.text();
      setJsonText(text);
      try {
        applyValidText(text, true);
      } catch (caught) {
        setParseError(caught instanceof Error ? caught.message : 'Could not read that file.');
      }
    },
    [applyValidText],
  );

  useEffect(() => {
    try {
      applyValidText(jsonText, jsonText !== starterText.current);
    } catch (caught) {
      setParseError(caught instanceof Error ? caught.message : 'Could not read that file.');
    }
  }, [applyValidText, jsonText]);

  useEffect(() => {
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
  }, [loadDroppedFile]);

  document.title = `${snapshot.fixture.traceName} · Flambe share`;

  const buttonStyle = {
    background: colors.background,
    border: `1px solid ${colors.hover}`,
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    padding: '6px 10px',
  } as const;

  return (
    <AuthFrame data-auth-shell="true" style={{ position: 'relative' }}>
    <div style={{ boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: '100%', padding: 10 }}>
      <header
        style={{
          alignItems: 'center',
          background: colors.background,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: '6px 8px 12px',
          textAlign: 'center',
        }}
      >
        <Logo isAnimated size={52} />
        <p style={{ color: '#444', fontSize: 14, margin: 0, maxWidth: 560 }}>
          Paste or drop a Flambe snapshot and see the flame chart. Nothing leaves this browser: the JSON is
          read and saved locally so a refresh keeps it. Nothing is uploaded.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={() => fileInput.current?.click()} style={buttonStyle} type="button">
            Open a JSON file
          </button>
          <button
            onClick={() => {
              const next = createExampleSnapshot();
              const example = formatSnapshotJson(next);
              starterText.current = example;
              setJsonText(example);
              appliedJson.current = JSON.stringify(next);
              setSnapshot(next);
              setChartKey(key => key + 1);
              setParseError(null);
              setNotice(null);
              clearLocalSnapshot();
            }}
            style={buttonStyle}
            type="button"
          >
            Reset example
          </button>
        </div>
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
      </header>
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexWrap: 'wrap',
          minHeight: 0,
        }}
      >
        <section
          style={{
            borderRight: `1px solid ${colors.hover}`,
            display: 'flex',
            flex: '1 1 360px',
            flexDirection: 'column',
            maxWidth: 560,
            minHeight: 240,
            minWidth: 280,
          }}
        >
          <div style={{ fontSize: 13, lineHeight: 1.5, padding: '12px 14px 8px' }}>
            <p style={{ margin: '0 0 8px' }}>
              A snapshot is a <code>version: 1</code> JSON object with a <code>viewport</code> and a{' '}
              <code>fixture</code> of threads, categories, and events. Each event has a phase:{' '}
              <code>B</code> begin, <code>E</code> end, <code>S</code> suspend, <code>R</code> resume,{' '}
              <code>Q</code> question, <code>X</code> instant. <code>parent_id</code> nests work;{' '}
              <code>agent_name</code> marks agent work. Timestamps are Unix milliseconds.
            </p>
            <p style={{ margin: 0 }}>
              Edit the JSON below. The chart redraws whenever it parses.
            </p>
          </div>
          <textarea
            aria-label="Timeline snapshot JSON"
            onChange={event => setJsonText(event.target.value)}
            spellCheck={false}
            style={{
              border: 'none',
              borderTop: `1px solid ${colors.hover}`,
              flex: 1,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 12,
              lineHeight: 1.45,
              minHeight: 180,
              outline: 'none',
              padding: 12,
              resize: 'none',
              whiteSpace: 'pre',
            }}
            value={jsonText}
          />
          <div
            style={{
              borderTop: `1px solid ${colors.hover}`,
              color: parseError ? colors.red : '#444',
              fontSize: 12,
              minHeight: 36,
              padding: '8px 12px',
            }}
          >
            {parseError ?? notice ?? 'Valid snapshot. Saved in this browser only.'}
          </div>
        </section>
        <div style={{ flex: '1.4 1 420px', minHeight: 280, minWidth: 280 }}>
          <ChartHarness
            demoOverlays={false}
            fixture={snapshot.fixture}
            height="100%"
            key={chartKey}
            timeLabels={snapshot.timeLabels}
            viewport={snapshot.viewport}
          />
        </div>
      </div>
      {dragging ? (
        <div
          style={{
            alignItems: 'center',
            background: colors.dropTarget,
            color: colors.text,
            display: 'flex',
            fontSize: 22,
            inset: 0,
            justifyContent: 'center',
            opacity: 0.92,
            pointerEvents: 'none',
            position: 'fixed',
            zIndex: 20,
          }}
        >
          Drop JSON to replace this snapshot
        </div>
      ) : null}
    </div>
    </AuthFrame>
  );
}
