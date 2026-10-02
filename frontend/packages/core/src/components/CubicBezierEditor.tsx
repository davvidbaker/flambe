import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import type { BezierNode, PresetZoomCurve } from '../utilities/presetZoomSettings';

const WIDTH = 260;
const HEIGHT = 180;
const PADDING = 18;
const PLOT_WIDTH = WIDTH - PADDING * 2;
const PLOT_HEIGHT = HEIGHT - PADDING * 2;
const Y_MIN = -1;
const Y_MAX = 2;
const Y_RANGE = Y_MAX - Y_MIN;

const Editor = styled.div`
  margin-top: 6px;
  width: ${WIDTH}px;

  svg {
    display: block;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    touch-action: none;
  }
`;

const Toolbar = styled.div`
  display: flex;
  gap: 5px;
  margin-top: 6px;

  button {
    font-size: 10px;
  }
`;

type DragTarget = { index: number; part: 'anchor' | 'in' | 'out' };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const pointX = (value: number) => PADDING + value * PLOT_WIDTH;
const pointY = (value: number) => PADDING + ((Y_MAX - value) / Y_RANGE) * PLOT_HEIGHT;

function pathFor(curve: PresetZoomCurve): string {
  return curve.slice(1).reduce((path, node, index) => {
    const previous = curve[index]!;
    return `${path} C ${pointX(previous.outX)} ${pointY(previous.outY)}, ${pointX(node.inX)} ${pointY(node.inY)}, ${pointX(node.x)} ${pointY(node.y)}`;
  }, `M ${pointX(curve[0]!.x)} ${pointY(curve[0]!.y)}`);
}

export default function CubicBezierEditor({
  value,
  onChange,
}: {
  value: PresetZoomCurve;
  onChange: (value: PresetZoomCurve) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<DragTarget | null>(null);
  const [selected, setSelected] = useState(1);

  const moveHandle = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging || !svgRef.current) return;
    const bounds = svgRef.current.getBoundingClientRect();
    const rawX = clamp((event.clientX - bounds.left - PADDING) / PLOT_WIDTH, 0, 1);
    const y = clamp(
      Y_MAX - ((event.clientY - bounds.top - PADDING) / PLOT_HEIGHT) * Y_RANGE,
      Y_MIN,
      Y_MAX,
    );
    const nodes = value.map(node => ({ ...node }));
    const node = nodes[dragging.index]!;
    const previous = nodes[dragging.index - 1];
    const next = nodes[dragging.index + 1];

    if (dragging.part === 'anchor' && dragging.index > 0 && dragging.index < nodes.length - 1) {
      const x = clamp(rawX, (previous?.x ?? 0) + 0.02, (next?.x ?? 1) - 0.02);
      const dx = x - node.x;
      const dy = y - node.y;
      Object.assign(node, {
        x, y,
        inX: node.inX + dx, inY: node.inY + dy,
        outX: node.outX + dx, outY: node.outY + dy,
      });
    } else if (dragging.part === 'in' && previous) {
      node.inX = clamp(rawX, previous.x, node.x);
      node.inY = y;
    } else if (dragging.part === 'out' && next) {
      node.outX = clamp(rawX, node.x, next.x);
      node.outY = y;
    }
    onChange(nodes);
  };

  const beginDrag = (
    event: React.PointerEvent<SVGCircleElement>,
    target: DragTarget,
  ) => {
    setDragging(target);
    setSelected(target.index);
    event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId);
  };

  const addPoint = () => {
    if (value.length >= 8) return;
    let widest = 0;
    for (let index = 1; index < value.length - 1; index += 1) {
      if (value[index + 1]!.x - value[index]!.x > value[widest + 1]!.x - value[widest]!.x) {
        widest = index;
      }
    }
    const left = value[widest]!;
    const right = value[widest + 1]!;
    const x = (left.x + right.x) / 2;
    const y = (left.y + right.y) / 2;
    const spread = (right.x - left.x) / 6;
    const node: BezierNode = {
      x, y,
      inX: x - spread, inY: y,
      outX: x + spread, outY: y,
    };
    const nodes = [...value.slice(0, widest + 1), node, ...value.slice(widest + 1)];
    setSelected(widest + 1);
    onChange(nodes);
  };

  const removePoint = () => {
    if (selected <= 0 || selected >= value.length - 1 || value.length <= 2) return;
    onChange(value.filter((_, index) => index !== selected));
    setSelected(Math.max(1, selected - 1));
  };

  return (
    <Editor>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width={WIDTH}
        height={HEIGHT}
        aria-label="Preset zoom piecewise Bézier curve"
        onPointerMove={moveHandle}
        onPointerUp={event => {
          setDragging(null);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={() => setDragging(null)}
      >
        <line x1={PADDING} y1={pointY(0)} x2={WIDTH - PADDING} y2={pointY(0)} stroke="#ccc" />
        <line x1={PADDING} y1={pointY(1)} x2={WIDTH - PADDING} y2={pointY(1)} stroke="#ccc" />
        {value.map((node, index) => (
          <React.Fragment key={`guides-${index}`}>
            {index > 0 && <line x1={pointX(node.x)} y1={pointY(node.y)} x2={pointX(node.inX)} y2={pointY(node.inY)} stroke="#aaa" />}
            {index < value.length - 1 && <line x1={pointX(node.x)} y1={pointY(node.y)} x2={pointX(node.outX)} y2={pointY(node.outY)} stroke="#aaa" />}
          </React.Fragment>
        ))}
        <path d={pathFor(value)} fill="none" stroke="#2f75dd" strokeWidth="3" />
        {value.map((node, index) => (
          <React.Fragment key={`points-${index}`}>
            {index > 0 && (
              <circle cx={pointX(node.inX)} cy={pointY(node.inY)} r="5" fill="#fff" stroke="#2f75dd" onPointerDown={event => beginDrag(event, { index, part: 'in' })} />
            )}
            {index < value.length - 1 && (
              <circle cx={pointX(node.outX)} cy={pointY(node.outY)} r="5" fill="#fff" stroke="#2f75dd" onPointerDown={event => beginDrag(event, { index, part: 'out' })} />
            )}
            <circle
              cx={pointX(node.x)}
              cy={pointY(node.y)}
              r={index === selected ? 7 : 6}
              fill={index === selected ? '#174d9c' : '#2f75dd'}
              stroke="#fff"
              strokeWidth="2"
              style={{ cursor: index === 0 || index === value.length - 1 ? 'default' : 'move' }}
              onPointerDown={event => beginDrag(event, { index, part: 'anchor' })}
            />
          </React.Fragment>
        ))}
      </svg>
      <Toolbar>
        <button type="button" onClick={addPoint} disabled={value.length >= 8}>Add point</button>
        <button
          type="button"
          onClick={removePoint}
          disabled={selected <= 0 || selected >= value.length - 1 || value.length <= 2}
        >
          Remove point
        </button>
        <span>{value.length - 1} segments</span>
      </Toolbar>
    </Editor>
  );
}
