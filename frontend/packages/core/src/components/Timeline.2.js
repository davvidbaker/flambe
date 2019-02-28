// WIP
import * as React from 'react';

import FlameChart from './FlameChart';
import * as TimelineChart from '../utilities/timelineChart';

const Timeline = props => {
  // actual refs
  const flameChart = React.useRef(null);
  const timeSeries = React.useRef(null);
  const tooltip = React.useRef(null);
  const focusedBlock = React.useRef(null);

  // refs as instance variables
  const leftBoundaryTime = React.useRef();
  const rightBoundaryTime = React.useRef()

  /* 💁 I only want this effect to run once. */
  // https://reactjs.org/docs/hooks-faq.html#is-there-something-like-instance-variables
  React.useLayoutEffect(() => {
    if (!selectionRef.current) {
      selectionRef.current = true;
      inputRef.current.setSelectionRange(0, value.length);
    }
  });
  
  const handleWheel = e => {
    e.preventDefault();
    const zoomCenterTime = TimelineChart.pixelsToTime(
      e.nativeEvent.offsetX,
      this.leftBoundaryTime,
      this.rightBoundaryTime,
      this.state.width,
    );

    // pan around if holding shift or scroll was mostly vertical
    if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) {
      // props.pan just does left right panning of the timeline
      this.pan(e.deltaX, 0, this.state.width);

      requestAnimationFrame(this.drawChildren.bind(this));
    } else if (e.getModifierState('Shift')) {
      if (typeof e.deltaY === 'number') {
        /* ⚠️ probably should move this to timelinestate */
        // this.setState({ scrollTop: this.state.scrollTop + Number(e.deltaY) });
      }
    } else {
      this.zoom(
        e.deltaY,
        e.nativeEvent.offsetX,
        zoomCenterTime,
        this.state.width,
      );
      requestAnimationFrame(this.drawChildren.bind(this));
    }
  };

  return (
    <>
      <div onWheel={handleWheel}>
        <FlameChart
          ref={flameChart}
          activities={props.activities}
          attentionShifts={props.attentionShifts}
          blocks={props.blocks}
          categories={props.categories}
          currentAttention={last(props.attentionShifts).thread_id}
          // leftBoundaryTime={leftBoundaryTime}
          maxTime={props.maxTime}
          minTime={props.minTime}
          modifiers={props.modifiers}
          pan={this.pan}
          // rightBoundaryTime={rightBoundaryTime}
          showThreadDetail={this.showThreadDetail}
          threadLevels={props.threadLevels}
          hoverBlock={props.hoverBlock}
          focusBlock={props.focusBlock}
          focusedBlockIndex={props.focusedBlockIndex}
          hoveredBlockIndex={props.hoveredBlockIndex}
          threads={threads}
          toggleThread={props.toggleThread}
          topOffset={this.topOffset || 0}
          updateEvent={props.updateEvent}
          zoom={this.zoom}
        />
      </div>
      {this.state.composingZoomChord && (
        <div style={{ position: 'fixed', bottom: 0, left: 0 }}>
          Zoom to... (Waiting for second key of chord) {this.state.zoomChord}{' '}
          {this.state.zoomChordMultiplier} hours ago
        </div>
      )}
      {this.flameChart &&
        this.flameChart.current && (
          <Swyzzler canvas={this.flameChart.current.canvas} />
        )}
      }
    </>
  );
};
