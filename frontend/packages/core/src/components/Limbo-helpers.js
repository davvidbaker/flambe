import * as d3 from 'd3';

const D_EPSILON = 40;

function makeid() {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

const K = 1e3;
const dt = 1;

export function hexProjection(radius) {
  var dx = radius * 2 * Math.sin(Math.PI / 3),
    dy = radius * 1.5;
  return {
    stream: function(stream) {
      return {
        point: function(x, y) {
          const real_x = (x * dx) / 2;
          const real_y = ((y - (2 - (y & 1)) / 3) * dy) / 2;
          stream.point(real_x, real_y);
        },
        lineStart: function() {
          stream.lineStart();
        },
        lineEnd: function() {
          stream.lineEnd();
        },
        polygonStart: function() {
          stream.polygonStart();
        },
        polygonEnd: function() {
          stream.polygonEnd();
        },
      };
    },
  };
}

export function hexTopology(radius, width, height, forceCarrier, sinks) {
  var dx = radius * 2 * Math.sin(Math.PI / 3),
    dy = radius * 1.5,
    m = Math.ceil((height + radius) / dy) + 1,
    n = Math.ceil(width / dx) + 1,
    geometries = [],
    arcs = [];

  for (var j = -1; j <= m; ++j) {
    for (var i = -1; i <= n; ++i) {
      var y = j * 2,
        x = (i + (j & 1) / 2) * 2;

      arcs.push(
        [[x, y - 1], [1, 1]],
        [[x + 1, y], [0, 1]],
        [[x + 1, y + 1], [-1, 1]],
      );
    }
  }

  let trajectories = [];
  for (var j = 0, q = 3; j < m; ++j, q += 6) {
    for (var i = 0; i < n; ++i, q += 3) {
      const px = i * dx + (j % 2 ? 0 : dx / 2);
      const py = (j - (2 - (j & 1)) / 3) * dy - (j % 2 ? 2 : 1) * (dy / 3);

      const { hitSink, trajectory } = simulatePointCharge(
        { x: px, y: py },
        sinks,
        forceCarrier,
      );

      trajectories.push(trajectory);

      geometries.push({
        hitSink,
        trajectory_id: trajectory.id,
        type: 'Polygon',
        arcs: [
          [
            q,
            q + 1,
            q + 2,
            ~(q + (n + 2 - (j & 1)) * 3),
            ~(q - 2),
            ~(q - (n + 2 + (j & 1)) * 3 + 2),
          ],
        ],
        fill: Math.random() > (i / n) * 2,
      });
    }
  }

  return {
    trajectories,
    transform: { translate: [0, 0], scale: [1, 1] },
    objects: {
      hexagons: { type: 'GeometryCollection', geometries: geometries },
    },
    arcs: arcs,
  };
}

export function simulatePointCharge({ x, y }, sinks, forceCarrier) {
  let trajectory = [{ x, y }];
  let hitSink;

  console.log(`🔥  forceCarrier`, forceCarrier);

  let px = x;
  let py = y;

  let vx = 0;
  let vy = 0;

  for (let t = 0; t < 100; t++) {
    let ax = 0;
    let ay = 0;

    sinks.forEach(curSink => {
      if (hitSink) {
        return;
      }

      const d = distance(curSink.x, curSink.y, px, py);

      if (d < D_EPSILON) {
        hitSink = curSink.id;
      }

      const angle = Math.atan2(curSink.y - py, curSink.x - px);
      // point charge 1
      const f = (K * curSink[forceCarrier]) / d ** 2;

      ax = ax + Math.cos(angle) * f;
      ay = ay + Math.sin(angle) * f;
    });

    if (hitSink) break;

    vx = vx + ax * dt;
    vy = vy + ay * dt;

    px = px + vx * dt;
    py = py + vy * dt;

    trajectory.push({ x: px, y: py });
  }

  trajectory.hitSink = hitSink;
  trajectory.id = makeid();

  return { hitSink, trajectory };
}

export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function pathTween(path) {
  var length = path.node().getTotalLength(); // Get the length of the path
  var r = d3.interpolate(0, length); //Set up interpolation from 0 to the path length
  return function(t) {
    var point = path.node().getPointAtLength(r(t)); // Get the next point along the path
    d3.select(this) // Select the circle
      .attr('cx', point.x) // Set the cx
      .attr('cy', point.y); // Set the cy
  };
}
