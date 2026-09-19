import { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';

import type { RootState } from '../rootReducer';
import {
  SWYZZLE_IDLE_MS,
  SwyzzleIdleGate,
  isTextEntryTarget,
  rememberSwyzzleClearKey,
  takeSwyzzleClearKey,
} from '../utilities/swyzzleIdle';
import { SwyzzleRenderer } from '../vendor/swyzzle';

const SOURCE_SELECTOR = '#chart-wrapper canvas';
const REFRESH_MS = 400;

function sourceCanvas(): HTMLCanvasElement | null {
  return document.querySelector<HTMLCanvasElement>(SOURCE_SELECTOR);
}

function syncOverlay(overlay: HTMLCanvasElement, source: HTMLElement): void {
  const rect = source.getBoundingClientRect();
  overlay.style.position = 'fixed';
  overlay.style.left = `${rect.left}px`;
  overlay.style.top = `${rect.top}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  overlay.style.pointerEvents = 'none';
  overlay.style.zIndex = '6';
}

function SwyzzleTraceOverlay({ enabled }: { enabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showing, setShowing] = useState(false);
  const showingRef = useRef(false);
  showingRef.current = showing;

  useEffect(() => {
    if (!enabled) {
      setShowing(false);
      return undefined;
    }

    const gate = new SwyzzleIdleGate(SWYZZLE_IDLE_MS, setShowing);
    gate.start();
    const consumed = new Set<string>();

    const onPointerMove = () => gate.notePointerMove();
    const onWake = () => gate.noteWake();
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTextEntryTarget(event.target)) {
        gate.noteWake();
        return;
      }
      if (rememberSwyzzleClearKey(event, showingRef.current, consumed)) {
        event.preventDefault();
        event.stopPropagation();
      }
      gate.noteWake();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (!takeSwyzzleClearKey(event, consumed)) return;
      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onWake, { passive: true });
    window.addEventListener('wheel', onWake, { passive: true });
    window.addEventListener('touchstart', onWake, { passive: true });
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);

    return () => {
      gate.stop();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onWake);
      window.removeEventListener('wheel', onWake);
      window.removeEventListener('touchstart', onWake);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !showing) return undefined;
    const overlay = canvasRef.current;
    if (!overlay) return undefined;

    let renderer: SwyzzleRenderer | null = null;
    try {
      renderer = new SwyzzleRenderer(overlay, { effect: 'swyzzle' });
    } catch (_error) {
      return undefined;
    }

    const capture = () => {
      const source = sourceCanvas();
      const host = document.getElementById('chart-wrapper') ?? source;
      if (!source || !host || !source.width || !source.height) return;
      syncOverlay(overlay, host);
      try {
        if (renderer?.source) renderer.refreshSource(source);
        else renderer?.capture(source);
      } catch (_error) {
        // The chart canvas can be mid-resize; skip this frame.
      }
    };

    capture();
    const interval = window.setInterval(capture, REFRESH_MS);
    window.addEventListener('resize', capture, { passive: true });

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', capture);
      renderer?.destroy();
    };
  }, [enabled, showing]);

  if (!enabled || !showing) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-swyzzle-overlay="true"
      style={{ position: 'fixed', pointerEvents: 'none', zIndex: 6 }}
    />
  );
}

export default connect((state: RootState) => ({
  enabled: state.settings.swyzzle,
}))(SwyzzleTraceOverlay);
