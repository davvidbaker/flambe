import * as React from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import { last, size } from 'lodash/fp';
import { shade } from 'polished';

import {
  SECOND, MINUTE, HOUR, DAY, WEEK, MONTH,
} from '../utilities/time';
import { colors } from '../styles';

import {
  hexTopology,
  hexProjection,
  distance,
  pathTween,
  translateAlong,
  transition,
} from './Limbo-helpers';

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

const initialState = {
  width: 1000,
  height: 400,

  hexagonRadius: 20,

  forceCarrier: 'weight',
  sinks: [],
  trajectoriesAreVisible: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'activities_initialize':
      return { ...state, sinks: action.payload };
    case 'force_carrier_change':
      return { ...state, forceCarrier: action.payload };
    case 'hit_sink':
      return { ...state, ...action.payload };
    case 'set_trajectory_visibility':
      return { ...state, trajectoriesAreVisible: action.payload };

    default:
      return state;
  }
};

const layOutSinks = (activities, events, categories) => activities.map(([id, a]) => {
  // *randomly* lay out the sinks
  const {
    daysSinceLastSuspension,
    daysSinceBeginning,
    churn,
  } = calculateTheseThings(a, events);

  const { x, y } = randomXYinUnitCircle();

  const category = categories.find(({ id }) => a.categories[0] === id);

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
      ? shade(Math.random() * 0.3, category.color_background)
      : 'white',
  };
});

const Limbo = props => {
  const svgRef = React.useRef(null);

  const [state, dispatch] = React.useReducer(reducer, initialState);

  /* ⚠️ update currently unused */
  /* const update = () => {
    const svg = svgRef && svgRef.current;
    if (!svg) return;

    const width = state.width;
    const height = state.height;

    const sinks = state.sinks;

    // create a hexagon grid
    const radius = state.hexagonRadius;

    var topology = hexTopology(
      radius,
      width,
      height,
      state.forceCarrier,
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
      d => this.sinks.find(({ id }) => id === d.hitSink).color_background,
    );

    const sink = svg.selectAll('circle').data(sinks);
    sink.transition().attr('r', d => d[state.forceCarrier]);

    svg
      .selectAll('text')
      .data(sinks)
      .text(
        d => `${this.props.activities[d.id].name},\n ${d[state.forceCarrier]}`,
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
      // ⚠️ this is bad d3 code 🤣
      topology.trajectories.forEach(traj => {
        svg.selectAll('.traj').attr('d', lineFunction(traj));
      });
    }
  }; */

  const draw = () => {
    const svg = d3.select(svgRef.current);
    if (!svg) return;

    const { width } = state;
    const { height } = state;

    const { sinks } = state;

    // create a hexagon grid
    const radius = state.hexagonRadius;

    const topology = hexTopology(
      radius,
      width,
      height,
      state.forceCarrier,
      state.sinks,
    );

    const projection = hexProjection(radius);

    const path = d3.geoPath().projection(projection);

    svg
      .append('g')
      .attr('class', 'hexagon')
      .selectAll('path')
      .data(topology.objects.hexagons.geometries)
      .enter()
      .append('path')
      .attr('d', d => path(topojson.feature(topology, d)))
      // .attr('class', function(d) {
      // return `${d.fill ? 'fill ' : ''}${d.hitSink ? d.hitSink : ''}`;
      // })
      .attr(
        'fill',
        // ⚠️ null coalesce probably
        d => (state.sinks.find(({ id }) => id === d.hitSink)
          ? state.sinks.find(({ id }) => id === d.hitSink).color_background
          : colors.flames.main),
      )
      .on('mouseenter', mouseenter)
      .on('mouseleave', mouseleave)
      // .on('mousemove', mousemove)
      .on('mouseup', mouseup)
      .on('click', d => {
        props.setSelectedActivity(Number(d.hitSink));
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

    let mousing = 0;

    svg
      .selectAll('circle')
      .data(state.sinks)
      .enter()
      .append('circle')
      .attr('cx', ({ x }) => x)
      .attr('cy', ({ y }) => y)
      .attr('r', d => d[state.forceCarrier])
      .attr(
        'fill', // ⚠️ null coalesce probably
        d => d.color_background || colors.flames.main,
      );

    svg
      .selectAll('text')
      .data(state.sinks)
      .enter()
      .append('text')
      .attr('x', ({ x }) => x)
      .attr('y', ({ y }) => y)
      .text(d => `${props.activities[d.id].name},\n ${d[state.forceCarrier]}`)
      .attr('fill', d => d.color_text || 'black');

    const lineFunction = d3
      .line()
      .x(d => d.x)
      .y(d => d.y);

    // const drawTrajectories = true;
    if (state.trajectoriesAreVisible) {
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

    const dot = svg
      .append('circle')
      .attr('r', 5)
      .attr('class', 'dot');

    function mousedown(d) {
      // mousing = d.fill ? -1 : +1;
      // mousemove.apply(this, arguments);
    }
    function mouseenter(d) {
      const { x, y } = this.getBoundingClientRect();

      const color = (state.sinks.find(({ id }) => id === d.hitSink) || {})
        .color_background;

      if (color) {
        document.body.style.setProperty('--tint', color);
      }

      if (state.trajectoriesAreVisible && d && d.trajectory_id) {
        const trajectory_path = d3.select(`#${d.trajectory_id}`);
        trajectory_path.style('opacity', 1);

        const x_range = d3.scaleLinear().range([0, width]);

        const y_range = d3.scaleLinear().range([height, 0]);

        dot.attr('fill', _d => `hsl(${d.hitSink || 0}, 70%, 80%)`);

        // ball animated along the trajectory path
        const ease = d3.easeCircleInOut || d3.easeLinearIn;

        transition(dot, trajectory_path);
      }
    }

    function mouseleave(d) {
      if (state.trajectoriesAreVisible && d && d.trajectory_id) {
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
      console.log(`🔥  redrwaing border`);
      border.attr(
        'd',
        path(
          topojson.mesh(
            topology,
            topology.objects.hexagons,
            (a, b) => a.fill ^ b.fill,
          ),
        ),
      );
    }
  };

  React.useEffect(() => {
    const activities = Object.entries(props.activities);
    dispatch({
      type: 'activities_initialize',
      payload: layOutSinks(activities, props.events, props.categories),
    });
    /* ⚠️ kinda naive */
  }, [size(props.activities)]);

  React.useEffect(() => {
    draw();
    /* ⚠️ kinda naive */
  }, [state.sinks.reduce((acc, { x }) => x + acc, 0)]);

  return (
    <Wrapper>
      <Controls>
        <label htmlFor="forceCarrier">Force Carrier</label>
        <select
          name="forceCarrier"
          onChange={e => dispatch({ type: 'force_carrier_change', payload: e.target.value })
          }
        >
          <option value="weight">weight</option>
          <option value="churn">churn</option>
          <option value="daysSinceLastSuspension">
            days since last suspension
          </option>
          <option value="daysSinceBeginning">days since beginning</option>
        </select>
        <label htmlFor="trajectoriesAreVisible">Trajectory Visibility</label>
        <input
          type="checkbox"
          onChange={e => console.log(e.target.checked)
            || dispatch({
              type: 'set_trajectory_visibility',
              payload: e.target.checked,
            })
          }
          checked={state.trajectoriesAreVisible}
        />
      </Controls>
      <svg
        id="limboSvg"
        width={state.width}
        height={state.height}
        ref={svgRef}
      />
    </Wrapper>
  );
};

export default Limbo;
