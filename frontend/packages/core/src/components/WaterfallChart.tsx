import React, { Component, type ReactNode } from 'react';
import Measure from './Measure';

import { colors } from '../styles';
import { getBlockTransform } from '../utilities/waterfallChart';
import type { ProcessedActivity, TraceBlock } from '../utilities/processTrace';
import type { Category } from '../types/Category';

interface Props {
  activities: Record<string, ProcessedActivity>;
  blocksByActivity: Record<string, TraceBlock[]>;
  categories: Category[];
  maxTime?: number;
  minTime?: number;
}

interface Size { height: number; width: number }

interface State {
  bottomBoundaryTime: number;
  canvasHeight: number;
  canvasWidth: number;
  topBoundaryTime: number;
}

class WaterfallChart extends Component<Props, State> {
  state: State = {
    canvasWidth: 300,
    canvasHeight: 150,
    topBoundaryTime: 0,
    bottomBoundaryTime: Date.now(),
  };

  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  drawFrame: number | null = null;

  blockWidth = 10;
  blockPadding = 1;

  componentDidMount() {
    this.ctx = this.canvas?.getContext('2d') ?? null;

    this.setState({
      topBoundaryTime: this.props.minTime ?? 0,
      bottomBoundaryTime: this.props.maxTime ?? Date.now(),
    });

    this.setCanvasSize({ width: 300, height: 150 });
  }

  componentDidUpdate(): void {
    if (this.drawFrame !== null) cancelAnimationFrame(this.drawFrame);
    this.drawFrame = requestAnimationFrame(() => this.draw());
  }

  componentWillUnmount(): void {
    if (this.drawFrame !== null) cancelAnimationFrame(this.drawFrame);
  }

  setCanvasSize = ({ width, height }: Size): void => {
    this.setState({
      canvasWidth: width,
      canvasHeight: height
    });
  };

  render(): ReactNode {
    return (
      <div style={{ width: '100%' }}>
        <Measure
          bounds
          onResize={contentRect => {
            /* 🤔 I feel like this shouldn't be necessary, but otherwise I get stuck in a render loop.bind.. */
            if (
              contentRect.bounds.width !== this.state.canvasWidth ||
              contentRect.bounds.height !== this.state.canvasHeight
            ) {
              this.setCanvasSize(contentRect.bounds);
            }
          }}
        >
          {({ measureRef }) => (
            <canvas
              ref={canvas => {
                measureRef(canvas);
                this.canvas = canvas;
              }}
              style={{
                width: '100%',
                height: '100%'
              }}
              height={this.state.canvasHeight * window.devicePixelRatio || 300}
              width={this.state.canvasWidth * window.devicePixelRatio || 450}
              /* ⚠️ this hs got to be an antipattern to put this in render, right? */
            />
          )}
        </Measure>
      </div>
    );
  }

  draw(): void {
    if (!this.ctx) return;
    this.drawActivityColumns();
    // this.drawBlocks();
  }

  drawActivityColumns(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    Object.entries(this.props.blocksByActivity).forEach(([activity_id, blocks], ind) => {
      ctx.fillStyle = '#f00';
      const activity = this.props.activities[activity_id];
      if (activity.status === 'suspended') {
        ctx.fillRect(
          ind * (this.blockWidth + 1),
          this.state.canvasHeight / 2,
          this.blockWidth,
          this.state.canvasHeight
        );
      }

      ctx.fillStyle = colors.flames.main;
      /** 💁 sometimes the categories array contains null or undefined... probably shouldn't but 🤷‍ */
      if (activity.categories.length > 0 && activity.categories[0]) {
        // ⚠️ don't always just show the color belonging to category 0... need a better way
        const cat = this.props.categories.find(element => element.id === activity.categories[0]);
        if (cat) {
          ctx.fillStyle = cat.color_background;
        }
      }

      this.drawActivityColumn(ind, blocks, activity);
    });
  }

  drawActivityColumn(ind: number, blocks: TraceBlock[], _activity: ProcessedActivity): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    blocks.forEach(block => {
      const { startTime, endTime } = block;
      const { blockX, blockY, blockHeight } = this.getBlockTransform(
        startTime,
        endTime,
        ind
      );
      ctx.fillRect(blockX, blockY, this.blockWidth, blockHeight);
    });
  }

  getBlockTransform(startTime: number, endTime: number | undefined, columnInd: number) {
    return getBlockTransform(
      startTime,
      endTime,
      this.state.topBoundaryTime,
      this.state.bottomBoundaryTime,
      this.blockWidth,
      columnInd * (this.blockWidth + 1),
      this.state.canvasWidth,
      this.state.canvasHeight
    );
  }

}

export default WaterfallChart;
