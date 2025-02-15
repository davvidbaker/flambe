import * as React from 'react';
import * as d3 from 'd3';

const WIDTH = 400;
const HEIGHT = 400;

const pie = d3
  .pie()
  .sort(null)
  .value(d => d.value);

class PieChart extends React.Component {
  componentDidMount() {
    this.svg = d3.select('#pieSvg');
    this.draw();
  }

  draw = () => {
    const data = [
      { label: 'one', value: 20 },
      { label: 'two', value: 50 },
      { label: 'three', value: 30 },
    ];

    const arc = d3
      .arc()
      .innerRadius(0)
      .outerRadius(Math.min(WIDTH, HEIGHT) / 2 - 1);

    const color = d3
      .scaleOrdinal()
      .domain(data.map(d => d.name))
      .range(
        d3
          .quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), data.length)
          .reverse(),
      );

    const arcs = pie(data);

    const g = this.svg
      .append('g')
      .attr('transform', `translate(${WIDTH / 2},${HEIGHT / 2})`);

    g.selectAll('path')
      .data(arcs)
      .enter()
      .append('path')
      .attr('fill', d => color(d.data.name))
      .attr('stroke', 'white')
      .attr('d', arc);
  };

  render() {
    return <svg id="pieSvg" width={WIDTH} height={HEIGHT} />;
  }
}

export default PieChart;
