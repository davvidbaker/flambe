import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { processTimelineTrace, setTimeline } from '../actions';
import ConnectedTimeline from '../containers/ConnectedTimeline';
import { createChartStore, seedChartViewport } from '../storybook/createChartStore';
import type { AppChartFixture } from '../storybook/fixtureTrace';
import useMachine from './Commander/this_is_a_hack/machines/use-machine';
import {
  agentToyMachine,
  type AgentStateValue,
  type AgentToyEvent,
} from './AgentStateMachineToy.machine';

interface StateNodeMeta {
  id: AgentStateValue;
  label: string;
  subtitle: string;
  flambeView: string;
  x: number;
  y: number;
  color: string;
}

const STATE_NODES: StateNodeMeta[] = [
  {
    id: 'idle',
    label: 'Idle',
    subtitle: 'No open activity on stack',
    flambeView: 'Away / Here (no open bar)',
    x: 110,
    y: 165,
    color: '#64748b',
  },
  {
    id: 'exploring',
    label: 'Exploring',
    subtitle: 'Reading, searching, pushing sub-questions',
    flambeView: 'Active leaf (stack push)',
    x: 340,
    y: 75,
    color: '#38bdf8',
  },
  {
    id: 'executing',
    label: 'Executing',
    subtitle: 'Editing code, running tests, popping leaves',
    flambeView: 'Active leaf (working)',
    x: 340,
    y: 255,
    color: '#22c55e',
  },
  {
    id: 'consulting_reducer',
    label: 'Consulting Reducer',
    subtitle: 'flambe message → awaiting direction',
    flambeView: 'Model review on active flame',
    x: 600,
    y: 75,
    color: '#a855f7',
  },
  {
    id: 'waiting_for_human',
    label: 'Waiting for Human',
    subtitle: 'Surfaced decision / AskQuestion checkpoint',
    flambeView: 'Open bar; rail fades after 60s silence',
    x: 600,
    y: 255,
    color: '#f59e0b',
  },
  {
    id: 'suspended',
    label: 'Suspended (Limbo)',
    subtitle: 'Explicitly parked with flambe suspend',
    flambeView: 'In Limbo pane until resumed',
    x: 825,
    y: 165,
    color: '#f43f5e',
  },
];

const EDGES: Array<{
  from: AgentStateValue;
  to: AgentStateValue;
  label: string;
}> = [
  { from: 'idle', to: 'exploring', label: 'START_ROOT' },
  { from: 'exploring', to: 'executing', label: 'LOCK_IN_PLAN' },
  { from: 'executing', to: 'exploring', label: 'HIT_RABBIT_HOLE' },
  { from: 'executing', to: 'idle', label: 'POP_LEAF / FINISH_ALL' },
  { from: 'exploring', to: 'consulting_reducer', label: 'ASK_REDUCER' },
  { from: 'executing', to: 'consulting_reducer', label: 'ASK_REDUCER' },
  { from: 'consulting_reducer', to: 'executing', label: 'REDUCER_CONTINUE' },
  { from: 'consulting_reducer', to: 'waiting_for_human', label: 'REDUCER_ESCALATE' },
  { from: 'exploring', to: 'waiting_for_human', label: 'NEEDS_DECISION' },
  { from: 'executing', to: 'waiting_for_human', label: 'NEEDS_DECISION' },
  { from: 'waiting_for_human', to: 'executing', label: 'HUMAN_REPLIED' },
  { from: 'waiting_for_human', to: 'suspended', label: 'SUSPEND_WORK' },
  { from: 'executing', to: 'suspended', label: 'SUSPEND_WORK' },
  { from: 'exploring', to: 'suspended', label: 'SUSPEND_WORK' },
  { from: 'suspended', to: 'exploring', label: 'RESUME_WORK' },
  { from: 'suspended', to: 'idle', label: 'FINISH_ALL' },
];

const EVENT_BUTTONS: Array<{
  event: AgentToyEvent;
  label: string;
  validFrom: AgentStateValue[];
}> = [
  {
    event: { type: 'START_ROOT' },
    label: 'Start Root Activity',
    validFrom: ['idle'],
  },
  {
    event: { type: 'DIVE_DEEPER' },
    label: 'Dive Deeper (Push Child)',
    validFrom: ['exploring'],
  },
  {
    event: { type: 'LOCK_IN_PLAN' },
    label: 'Lock In Plan → Execute',
    validFrom: ['exploring'],
  },
  {
    event: { type: 'HIT_RABBIT_HOLE' },
    label: 'Hit Rabbit Hole (Push)',
    validFrom: ['executing'],
  },
  {
    event: { type: 'POP_LEAF' },
    label: 'Pop Current Leaf (flambe end)',
    validFrom: ['executing'],
  },
  {
    event: { type: 'ASK_REDUCER' },
    label: 'Message Reducer',
    validFrom: ['exploring', 'executing'],
  },
  {
    event: { type: 'REDUCER_CONTINUE' },
    label: 'Reducer: Continue',
    validFrom: ['consulting_reducer'],
  },
  {
    event: { type: 'REDUCER_ESCALATE' },
    label: 'Reducer: Escalate to Human',
    validFrom: ['consulting_reducer'],
  },
  {
    event: { type: 'NEEDS_DECISION' },
    label: 'Ask Human a Question',
    validFrom: ['exploring', 'executing'],
  },
  {
    event: { type: 'HUMAN_REPLIED' },
    label: 'Human Replied',
    validFrom: ['waiting_for_human'],
  },
  {
    event: { type: 'SUSPEND_WORK' },
    label: 'Suspend to Limbo',
    validFrom: ['exploring', 'executing', 'waiting_for_human'],
  },
  {
    event: { type: 'RESUME_WORK' },
    label: 'Resume from Limbo',
    validFrom: ['suspended'],
  },
  {
    event: { type: 'FINISH_ALL' },
    label: 'End All Open Work',
    validFrom: ['exploring', 'executing', 'suspended'],
  },
];

const CATEGORIES = [
  { id: 1, name: 'coding', color_background: '#efc360', color_text: '#000000' },
  { id: 2, name: 'investigation', color_background: '#60a5fa', color_text: '#000000' },
  { id: 3, name: 'review', color_background: '#a78bfa', color_text: '#000000' },
  { id: 4, name: 'operations', color_background: '#34d399', color_text: '#000000' },
  { id: 5, name: 'failure', color_background: '#fb7185', color_text: '#000000' },
];

function pickNextAutoEvent(
  stateValue: AgentStateValue,
  stackDepth: number,
): AgentToyEvent {
  switch (stateValue) {
    case 'idle':
      return { type: 'START_ROOT' };
    case 'exploring': {
      const roll = Math.random();
      if (stackDepth < 3 && roll < 0.35) return { type: 'DIVE_DEEPER' };
      if (roll < 0.72) return { type: 'LOCK_IN_PLAN' };
      if (roll < 0.88) return { type: 'ASK_REDUCER' };
      return { type: 'NEEDS_DECISION' };
    }
    case 'executing': {
      const roll = Math.random();
      if (stackDepth < 4 && roll < 0.25) return { type: 'HIT_RABBIT_HOLE' };
      if (roll < 0.65) return { type: 'POP_LEAF' };
      if (roll < 0.82) return { type: 'ASK_REDUCER' };
      if (roll < 0.93) return { type: 'NEEDS_DECISION' };
      return { type: 'SUSPEND_WORK' };
    }
    case 'consulting_reducer':
      return Math.random() < 0.72
        ? { type: 'REDUCER_CONTINUE' }
        : { type: 'REDUCER_ESCALATE' };
    case 'waiting_for_human':
      return Math.random() < 0.78
        ? { type: 'HUMAN_REPLIED' }
        : { type: 'SUSPEND_WORK' };
    case 'suspended':
      return Math.random() < 0.8
        ? { type: 'RESUME_WORK' }
        : { type: 'FINISH_ALL' };
  }
}

export function AgentStateMachineToy() {
  const [snapshot, send] = useMachine(agentToyMachine);
  // Paused by default so it's crystal clear zero compute / zero tokens are running unless clicked
  const [autoBounce, setAutoBounce] = useState(false);
  const [speedMs, setSpeedMs] = useState(1600);

  const currentState = snapshot.value as AgentStateValue;
  const {
    agentId,
    agentName,
    thread,
    simTimeMs,
    stack,
    traceEvents,
    lastContactAgoSec,
    blockerQuestion,
    reducerReply,
    history,
  } = snapshot.context;

  const [chartEnv] = useState(() => {
    const initialMin = simTimeMs - 4 * 60_000;
    const initialMax = simTimeMs + 10 * 60_000;
    const viewport = {
      leftBoundaryTime: initialMin,
      rightBoundaryTime: initialMax,
    };
    const fixture: AppChartFixture = {
      traceId: 9400,
      traceName: 'XState Toy Trace',
      threads: [thread],
      events: traceEvents,
      categories: CATEGORIES,
      attentionShifts: [],
      agents: [
        {
          agent_id: agentId,
          name: agentName,
          platform: 'Cursor',
          last_seen_at: new Date().toISOString(),
        },
      ],
    };
    seedChartViewport(fixture, simTimeMs, viewport);
    const store = createChartStore(fixture, simTimeMs, {
      viewport,
      demoOverlays: false,
      settings: { showActivityIds: false },
    });
    return { fixture, store, initialMin };
  });

  // Sync XState traceEvents into the real Flambe timeline Redux store on every transition
  useEffect(() => {
    const earliest =
      traceEvents.length > 0
        ? Math.min(...traceEvents.map(e => e.timestamp)) - 90_000
        : simTimeMs - 4 * 60_000;
    const rightEdge = Math.max(Date.now() + 2 * 60_000, simTimeMs + 4 * 60_000);
    chartEnv.store.dispatch(processTimelineTrace(traceEvents, [thread], []));
    chartEnv.store.dispatch(setTimeline(earliest, rightEdge));
  }, [chartEnv, traceEvents, thread, simTimeMs]);

  useEffect(() => {
    if (!autoBounce) return undefined;
    const timer = window.setInterval(() => {
      send(pickNextAutoEvent(currentState, stack.length));
    }, speedMs);
    return () => window.clearInterval(timer);
  }, [autoBounce, speedMs, currentState, stack.length, send]);

  const currentMeta =
    STATE_NODES.find(node => node.id === currentState) ?? STATE_NODES[0];
  const lastEdge = history[0];
  const contactFreshness = Math.max(0, 1 - lastContactAgoSec / 60);
  const hasOpenWork = stack.length > 0 && currentState !== 'suspended';

  return (
    <MemoryRouter>
      <Provider store={chartEnv.store}>
        <div
          style={{
            height: '100vh',
            background: '#0b0f17',
            color: '#e2e8f0',
            fontFamily:
              'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: 16,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            overflow: 'hidden',
          }}
        >
          {/* Header bar with explicit ZERO COMPUTE badge */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              padding: '10px 16px',
              background: '#111827',
              border: '1px solid #1f2937',
              borderRadius: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 10,
                  height: 34,
                  borderRadius: 4,
                  background: hasOpenWork
                    ? `rgba(74, 222, 128, ${0.25 + contactFreshness * 0.75})`
                    : '#475569',
                }}
                title="Simulated Flambe neon-green actor rail"
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{agentName}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: `${currentMeta.color}22`,
                      color: currentMeta.color,
                      border: `1px solid ${currentMeta.color}66`,
                    }}
                  >
                    xstate: {currentState}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: '#064e3b',
                      color: '#6ee7b7',
                      border: '1px solid #059669',
                    }}
                  >
                    LOCAL XSTATE SIMULATION · 0 LLM TOKENS / 0 API CALLS
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  Every XState transition emits `B` / `E` / `S` / `R` events directly into the
                  live Flambe thread below.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => send(pickNextAutoEvent(currentState, stack.length))}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #38bdf8',
                  background: '#0284c7',
                  color: '#f8fafc',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Step 1 Bounce
              </button>

              <button
                type="button"
                onClick={() => setAutoBounce(prev => !prev)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #334155',
                  background: autoBounce ? '#16a34a' : '#1e293b',
                  color: '#f8fafc',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {autoBounce ? 'Auto-Timer: ON' : 'Auto-Timer: OFF'}
              </button>

              <select
                value={speedMs}
                onChange={e => setSpeedMs(Number(e.target.value))}
                style={{
                  background: '#1e293b',
                  color: '#e2e8f0',
                  border: '1px solid #334155',
                  borderRadius: 6,
                  padding: '5px 8px',
                  fontSize: 12,
                }}
              >
                <option value={800}>0.8s</option>
                <option value={1600}>1.6s</option>
                <option value={2800}>2.8s</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setAutoBounce(false);
                  send({ type: 'RESET' });
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #334155',
                  background: '#111827',
                  color: '#94a3b8',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Top split: XState graph + transition controls */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(480px, 1.45fr) minmax(320px, 1fr)',
              gap: 14,
              height: 292,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                background: '#111827',
                border: '1px solid #1f2937',
                borderRadius: 10,
                padding: 12,
                height: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                viewBox="0 0 940 330"
                style={{
                  width: '100%',
                  height: '100%',
                  background: '#0d131f',
                  borderRadius: 8,
                  border: '1px solid #1e293b',
                }}
              >
                <defs>
                  <marker
                    id="arrow-muted"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#334155" />
                  </marker>
                  <marker
                    id="arrow-active"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                </defs>

                {EDGES.map((edge, idx) => {
                  const fromNode = STATE_NODES.find(n => n.id === edge.from)!;
                  const toNode = STATE_NODES.find(n => n.id === edge.to)!;
                  const isJustTraversed =
                    lastEdge &&
                    lastEdge.from === edge.from &&
                    lastEdge.to === edge.to;

                  const dx = toNode.x - fromNode.x;
                  const dy = toNode.y - fromNode.y;
                  const dist = Math.hypot(dx, dy) || 1;
                  const offsetX = (dx / dist) * 72;
                  const offsetY = (dy / dist) * 32;

                  const x1 = fromNode.x + offsetX;
                  const y1 = fromNode.y + offsetY;
                  const x2 = toNode.x - offsetX;
                  const y2 = toNode.y - offsetY;

                  const curveOffset =
                    edge.from === 'exploring' && edge.to === 'executing'
                      ? -22
                      : edge.from === 'executing' && edge.to === 'exploring'
                        ? 22
                        : 0;

                  return (
                    <path
                      key={`${edge.from}-${edge.to}-${idx}`}
                      d={`M ${x1} ${y1} Q ${(x1 + x2) / 2 + curveOffset} ${(y1 + y2) / 2} ${x2} ${y2}`}
                      fill="none"
                      stroke={isJustTraversed ? '#38bdf8' : '#1e293b'}
                      strokeWidth={isJustTraversed ? 2.5 : 1.5}
                      strokeDasharray={isJustTraversed ? undefined : '4 3'}
                      markerEnd={
                        isJustTraversed ? 'url(#arrow-active)' : 'url(#arrow-muted)'
                      }
                    />
                  );
                })}

                {STATE_NODES.map(node => {
                  const isActive = node.id === currentState;
                  const nodeW = 176;
                  const nodeH = 62;
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x - nodeW / 2}, ${node.y - nodeH / 2})`}
                    >
                      <rect
                        width={nodeW}
                        height={nodeH}
                        rx={9}
                        fill={isActive ? '#172033' : '#111827'}
                        stroke={isActive ? node.color : '#334155'}
                        strokeWidth={isActive ? 2.5 : 1.2}
                      />
                      <circle
                        cx={16}
                        cy={20}
                        r={5}
                        fill={isActive ? node.color : '#475569'}
                      />
                      <text
                        x={28}
                        y={24}
                        fill={isActive ? '#f8fafc' : '#cbd5e1'}
                        fontSize={13}
                        fontWeight={700}
                      >
                        {node.label}
                      </text>
                      <text x={14} y={43} fill="#94a3b8" fontSize={10.5}>
                        {node.subtitle.slice(0, 30)}
                      </text>
                    </g>
                  );
                })}

                <g
                  transform={`translate(${currentMeta.x}, ${currentMeta.y - 40})`}
                  style={{ transition: 'transform 340ms cubic-bezier(0.22, 1, 0.36, 1)' }}
                >
                  <rect
                    x={-38}
                    y={-13}
                    width={76}
                    height={20}
                    rx={10}
                    fill={currentMeta.color}
                  />
                  <text
                    x={0}
                    y={1}
                    textAnchor="middle"
                    fill="#090d16"
                    fontSize={11}
                    fontWeight={800}
                  >
                    {agentName}
                  </text>
                </g>
              </svg>
            </div>

            <div
              style={{
                background: '#111827',
                border: '1px solid #1f2937',
                borderRadius: 10,
                padding: 12,
                height: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 8,
                overflow: 'hidden',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#94a3b8',
                    marginBottom: 8,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Fire XState Transition (valid from `{currentState}` highlighted)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {EVENT_BUTTONS.map(btn => {
                    const enabled = btn.validFrom.includes(currentState);
                    return (
                      <button
                        key={btn.event.type}
                        type="button"
                        disabled={!enabled}
                        onClick={() => {
                          setAutoBounce(false);
                          send(btn.event);
                        }}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: enabled ? 600 : 400,
                          border: enabled
                            ? `1px solid ${currentMeta.color}`
                            : '1px solid #1e293b',
                          background: enabled ? '#1e293b' : '#0f172a',
                          color: enabled ? '#f8fafc' : '#475569',
                          cursor: enabled ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  height: 58,
                  flexShrink: 0,
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: '#0d131f',
                  border: '1px solid #1e293b',
                  fontSize: 11,
                  lineHeight: '16px',
                  color: '#cbd5e1',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {lastEdge ? (
                    <>
                      <strong>Last transition:</strong> {lastEdge.from} → {lastEdge.to} (
                      <code>{lastEdge.detail}</code>)
                    </>
                  ) : (
                    <span style={{ color: '#64748b' }}>No transitions yet</span>
                  )}
                </div>
                <div
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: blockerQuestion
                      ? '#fde68a'
                      : reducerReply
                        ? '#e9d5ff'
                        : '#64748b',
                  }}
                >
                  {blockerQuestion ? (
                    <>
                      <strong>Blocked on human:</strong> {blockerQuestion}
                    </>
                  ) : reducerReply ? (
                    <>
                      <strong>Reducer:</strong> {reducerReply}
                    </>
                  ) : (
                    'Status: ready for next XState event'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom half: Real ConnectedTimeline rendering the thread flamechart */}
          <div
            style={{
              flex: 1,
              minHeight: 260,
              borderRadius: 10,
              overflow: 'hidden',
              border: '1px solid #1f2937',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <ConnectedTimeline
              trace_id={chartEnv.fixture.traceId}
              addCommand={() => undefined}
              submitCommand={() => undefined}
            />
          </div>
        </div>
      </Provider>
    </MemoryRouter>
  );
}

export default {
  title: 'App/Agent XState Toy',
  component: AgentStateMachineToy,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AgentStateMachineToy>;

export const BouncingAgent: StoryObj<typeof AgentStateMachineToy> = {};
