import React, { Component } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import { last } from 'lodash/fp';

import {
  hexTopology,
  hexProjection,
  distance,
  pathTween,
  translateAlong,
  transition,
} from './Limbo-helpers';
import { SECOND, MINUTE, HOUR, DAY, WEEK, MONTH } from '../utilities/time';
import { colors } from '../styles';

const drawTrajectories = false;

const Tooltip = styled.div`
  color: white;
  background: rgba(0, 0, 0, 0.5);
  padding: 10px;
`;

const Controls = styled.div`
  background: var(--tint, 'white');
`;

const Wrapper = styled.div`
  svg {
    /* border-radius: 50%; */
  }

  .dot {
    pointer-events: none;
  }

  circle,
  .line {
    stroke: white;
    stroke-width: 1.5px;

    z-index: 100;
  }
  circle {
    cursor: move;
  }
  .hexagon {
    fill: white;
    pointer-events: all;
  }

  .hexagon path {
    transition: fill 250ms linear;
  }

  .hexagon :hover {
    /* stroke-width: 100px;
    stroke: rgba(0, 0, 0, 25%); */
  }

  .hexagon .fill {
    fill: mediumseagreen;
  }

  .mesh {
    fill: none;
    stroke: #fff;
    stroke-opacity: 1;
    pointer-events: none;
  }

  .border {
    fill: none;
    stroke: #;
    stroke-width: 2px;
    pointer-events: none;
  }

  .traj {
    fill: none;
    /* stroke: #00f; */
    stroke-width: 2px;
    opacity: 0;
    pointer-events: none;

    &:hover {
      /* stroke: #0f0; */
      opacity: 1;
    }
  }
`;

function randomXYinUnitCircle() {
  let x = 0,
    y = 0;

  while (distance(x, y, 0.5, 0.5) > 0.5) {
    x = Math.random();
    y = Math.random();
  }
  return { x, y };
}

/* ⚠️ WTF david (function name) */
function calculateTheseThings(activity, events) {
  return {
    daysSinceLastSuspension:
      /* ⚠️ events.timestamp SHOULD always exist. but something is going wrong */
      Date.now() - events[last(activity.events)]
        ? events[last(activity.events)].timestamp / DAY
        : Date.now(),

    daysSinceBeginning: (Date.now() - activity.startTime) / DAY,
    // churn is just the number of events 🤷
    churn: activity.events.length,
  };
}

type Props = {
  activities: Activities,
  events: Events,
};

class Limbo extends Component {
  constructor(props) {
    super(props);
    this.svgRef = React.createRef();
  }

  state = {
    tooltipCopy: '',
    tooltipX: 0,
    tooltipY: 0,

    width: 1000,
    height: 200,

    hexagonRadius: 20,

    forceCarrier: 'weight',
  };

  componentDidMount() {
    // *randomly* lay out the sinks

    const activities = Object.entries(this.props.activities);

    this.sinks = activities.map(([id, a]) => {
      const {
        daysSinceLastSuspension,
        daysSinceBeginning,
        churn,
      } = calculateTheseThings(a, this.props.events);

      const { x, y } = randomXYinUnitCircle();

      const category = this.props.categories.find(
        ({ id }) => a.categories[0] === id,
      );

      return {
        x: x * 1000,
        y: y * 200,
        weight: Math.abs(a.weight),
        daysSinceLastSuspension,
        daysSinceBeginning,
        churn,
        id,
        color_text: category ? category.color_text : 'black',
        color_background: category
          ? category.color_background
          : colors.flames.main,
      };
    });

    this.svg = d3.select('#limboSvg');
    this.draw();
  }

  handleForceCarrierChange = e => {
    this.setState({ forceCarrier: e.target.value }, this.update);
  };

  render() {
    return (
      <Wrapper>
        <Controls>
          <label htmlFor="forceCarrier">forceCarrier</label>
          <select name="forceCarrier" onChange={this.handleForceCarrierChange}>
            <option value="weight">weight</option>
            <option value="churn">churn</option>
            <option value="daysSinceLastSuspension">
              days since last suspension
            </option>
            <option value="daysSinceBeginning">days since beginning</option>
          </select>
        </Controls>
        <svg
          id="limboSvg"
          width={this.state.width}
          height={this.state.height}
          ref={this.svgRef}
        />
        {/* <Tooltip
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            transform: `translateX(${this.state.tooltipX}px) translateY(${
              this.state.tooltipY
            }px)`,
          }}
        >
          {this.state.tooltipCopy}
        </Tooltip> */}
      </Wrapper>
    );
  }

  update = () => {
    console.time('update');
    const width = this.state.width;
    const height = this.state.height;

    const sinks = this.sinks;
    const svg = this.svg;

    // create a hexagon grid
    const radius = this.state.hexagonRadius;

    var topology = hexTopology(
      radius,
      width,
      height,
      this.state.forceCarrier,
      this.sinks,
    );

    var projection = hexProjection(radius);

    var path = d3.geoPath().projection(projection);

    const hexagon = svg
      .selectAll('.hexagon')
      .selectAll('path')
      .data(topology.objects.hexagons.geometries);

    hexagon.attr(
      'fill',
      d =>
        this.sinks.find(
          ({ id }) =>
            console.log(`🔥 id, d.hitSink`, id, d.hitSink) || id === d.hitSink,
        ).color_background,
    );

    const sink = svg.selectAll('circle').data(sinks);
    sink.transition().attr('r', d => d[this.state.forceCarrier]);

    svg
      .selectAll('text')
      .data(sinks)
      .text(
        d =>
          `${this.props.activities[d.id].name},\n ${
            d[this.state.forceCarrier]
          }`,
      );

    var lineFunction = d3
      .line()
      .x(function(d) {
        return d.x;
      })
      .y(function(d) {
        return d.y;
      });

    if (drawTrajectories) {
      /* ⚠️ this is bad d3 code 🤣 */
      topology.trajectories.forEach(traj => {
        svg.selectAll('.traj').attr('d', lineFunction(traj));
      });
    }

    console.timeEnd('update');
    console.log(
      'document.querySelectorAll.length',
      document.querySelectorAll('*').length,
    );
    console.log(
      `🔥  document.querySelectorAll('text').length`,
      document.querySelectorAll('text').length,
    );
    console.log(
      `🔥  document.querySelectorAll('.hexagon').length`,
      document.querySelectorAll('.hexagon').length,
    );
    console.log(
      `🔥  document.querySelectorAll('.traj').length`,
      document.querySelectorAll('.traj').length,
    );
    console.log(
      `🔥  document.querySelectorAll('circle').length`,
      document.querySelectorAll('circle').length,
    );
    console.log(
      `🔥  document.querySelectorAll('g').length`,
      document.querySelectorAll('g').length,
    );
    console.log(
      `🔥  document.querySelectorAll('path').length`,
      document.querySelectorAll('path').length,
    );
  };

  draw = () => {
    console.time('draw');
    const width = this.state.width;
    const height = this.state.height;

    const sinks = this.sinks;
    const svg = this.svg;

    // create a hexagon grid
    const radius = this.state.hexagonRadius;

    var topology = hexTopology(
      radius,
      width,
      height,
      this.state.forceCarrier,
      this.sinks,
    );

    var projection = hexProjection(radius);

    console.log(`🔥  projection`, projection);

    var path = d3.geoPath().projection(projection);

    svg
      .append('g')
      .attr('class', 'hexagon')
      .selectAll('path')
      .data(topology.objects.hexagons.geometries)
      .enter()
      .append('path')
      .attr('d', function(d) {
        return path(topojson.feature(topology, d));
      })
      // .attr('class', function(d) {
      // return `${d.fill ? 'fill ' : ''}${d.hitSink ? d.hitSink : ''}`;
      // })
      .attr(
        'fill',
        // ⚠️ null coalesce probably
        d =>
          this.sinks.find(({ id }) => id === d.hitSink)
            ? this.sinks.find(({ id }) => id === d.hitSink).color_background
            : colors.flames.main,
      )
      .on('mouseenter', mouseenter)
      .on('mouseleave', mouseleave)
      // .on('mousemove', mousemove)
      .on('mouseup', mouseup)
      .on('click', d => {
        console.log(`🔥  d`, d);
        this.props.setSelectedActivity(Number(d.hitSink));
      });

    svg
      .append('path')
      .datum(topojson.mesh(topology, topology.objects.hexagons))
      .attr('class', 'mesh')
      .attr('d', path);

    // var border = svg
    //   .append('path')
    //   .attr('class', 'border')
    //   .call(redraw);

    var mousing = 0;

    svg
      .selectAll('circle')
      .data(sinks)
      .enter()
      .append('circle')
      .attr('cx', ({ x }) => x)
      .attr('cy', ({ y }) => y)
      .attr('r', d => d[this.state.forceCarrier])
      .attr(
        'fill', // ⚠️ null coalesce probably
        d => d.color_background || colors.flames.main,
      );

    svg
      .selectAll('text')
      .data(sinks)
      .enter()
      .append('text')
      .attr('x', ({ x }) => x)
      .attr('y', ({ y }) => y)
      .text(
        d =>
          `${this.props.activities[d.id].name},\n ${
            d[this.state.forceCarrier]
          }`,
      )
      .attr('fill', d => d.color_text || 'black');

    var lineFunction = d3
      .line()
      .x(function(d) {
        return d.x;
      })
      .y(function(d) {
        return d.y;
      });

    // const drawTrajectories = true;
    if (drawTrajectories) {
      /* ⚠️ this is bad d3 code 🤣 */
      topology.trajectories.forEach(traj => {
        svg
          .append('path')
          .attr('d', lineFunction(traj))
          .attr('class', 'traj')
          .attr('id', _d => traj.id)
          .attr('stroke', _d => `hsl(${traj.hitSink || 0}, 70%, 80%)`);
      });
    }

    console.timeEnd('draw');
    console.log(
      'document.querySelectorAll.length',
      document.querySelectorAll('*').length,
    );

    function mousedown(d) {
      // mousing = d.fill ? -1 : +1;
      // mousemove.apply(this, arguments);
    }

    const dot = svg
      .append('circle')
      .attr('r', 5)
      .attr('class', 'dot');

    const that = this;
    function mouseenter(d) {
      const { x, y } = this.getBoundingClientRect();

      const color = (that.sinks.find(({ id }) => id === d.hitSink) || {})
        .color_background;

      if (color) {
        document.body.style.setProperty('--tint', color);
      }

      if (d.hitSink)
        that.setState(
          state =>
            state.tooltipCopy !== that.props.activities[d.hitSink].name
              ? {
                  tooltipX: x,
                  tooltipY: y,
                  tooltipCopy: that.props.activities[d.hitSink].name,
                }
              : state,
        );

      if (drawTrajectories && d && d.trajectory_id) {
        const trajectory_path = d3.select(`#${d.trajectory_id}`);
        trajectory_path.style('opacity', 1);

        const x_range = d3.scaleLinear().range([0, width]);

        const y_range = d3.scaleLinear().range([height, 0]);

        dot.attr('fill', _d => `hsl(${d.hitSink || 0}, 70%, 80%)`);

        // ball animated along the trajectory path
        const ease = d3['easeCircleInOut'] || d3.easeLinearIn;

        transition(dot, trajectory_path);
      }
    }

    function mouseleave(d) {
      if (drawTrajectories && d && d.trajectory_id) {
        d3.select(`#${d.trajectory_id}`).style('opacity', 0);
      }
    }

    function mousemove(d) {
      if (mousing) {
        d3.select(this).classed('fill', (d.fill = mousing > 0));
        border.call(redraw);
      }
    }

    function mouseup() {
      mousemove.apply(this, arguments);
      mousing = 0;
    }

    function redraw(border) {
      border.attr(
        'd',
        path(
          topojson.mesh(topology, topology.objects.hexagons, function(a, b) {
            return a.fill ^ b.fill;
          }),
        ),
      );
    }

    const forceCarrier = this.state.forceCarrier;
  };
}
export default Limbo;
