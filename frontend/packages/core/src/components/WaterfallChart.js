import React, { Component } from 'react';
import Measure from 'react-measure';

import { colors } from '../styles';
import { getBlockTransform } from '../utilities/waterfallChart';

class WaterfallChart extends Component {
  state = {
    canvasWidth: 300,
    canvasHeight: 150
  };

  blockWidth = 10;
  blockPadding = 1;

  componentDidMount() {
    const ctx = this.canvas.getContext('2d');
    this.ctx = ctx;

    this.setState({
      topBoundaryTime: this.props.minTime,
      bottomBoundaryTime: Date.now()
    });

    this.setCanvasSize({ width: 300, height: 150 });
  }

  setCanvasSize = ({ width, height }) => {
    this.setState({
      canvasWidth: width,
      canvasHeight: height
    });
  };

  render() {
    requestAnimationFrame(() => {
      this.draw();
    });
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
              onMouseMove={this.onMouseMove}
              onMouseEnter={this.onMouseEnter}
              onMouseLeave={this.onMouseLeave}
            />
          )}
        </Measure>
      </div>
    );
  }

  draw() {
    this.drawActivityColumns();
    // this.drawBlocks();
  }

  drawActivityColumns() {
    Object.entries(this.props.blocksByActivity).forEach(([activity_id, blocks], ind) => {
      this.ctx.fillStyle = '#f00';
      const activity = this.props.activities[activity_id];
      if (activity.status === 'suspended') {
        this.ctx.fillRect(
          ind * (this.blockWidth + 1),
          this.state.canvasHeight / 2,
          this.blockWidth,
          this.state.canvasHeight
        );
      }

      this.ctx.fillStyle = colors.flames.main;
      /** 💁 sometimes the categories array contains null or undefined... probably shouldn't but 🤷‍ */
      if (activity.categories.length > 0 && activity.categories[0]) {
        // ⚠️ don't always just show the color belonging to category 0... need a better way
        const cat = this.props.categories.find(element => element.id === activity.categories[0]);
        if (cat) {
          this.ctx.fillStyle = cat.color_background;
        }
      }

      this.drawActivityColumn(ind, blocks, activity);
    });
  }

  drawActivityColumn(ind, blocks, activity) {
    blocks.forEach(block => {
      const { startTime, endTime } = block;
      const { blockX, blockY, blockHeight } = this.getBlockTransform(
        startTime,
        endTime,
        ind
      );
      this.ctx.fillRect(blockX, blockY, this.blockWidth, blockHeight);
    });
  }

  getBlockTransform(startTime, endTime, columnInd) {
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

  drawBlock(block) {
    this.ctx.fillText(block.startTime, 0, Math.random() * 100);
  }
}

export default WaterfallChart;
