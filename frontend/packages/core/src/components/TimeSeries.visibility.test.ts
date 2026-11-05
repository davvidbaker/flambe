import { TimeSeries } from './TimeSeries';

it('removes hidden series from plotting and the shared sibling scale', () => {
  const chart = new TimeSeries({ mantras: [], tabs: [], searchTerms: [], observations: [{
    kind: 'hub_price', value: 1, unit: '$/MWh', timestamp: 1000,
    payload: { series: { Small: 1, Large: 10_000 } },
  }] });
  chart.leftBoundaryTime = 0;
  chart.rightBoundaryTime = 2000;
  chart.observationSeries = chart.visibleSeries();
  const small = chart.observationSeries.find(series => series.label === 'Small')!;
  const large = chart.observationSeries.find(series => series.label === 'Large')!;
  expect(small).toBeDefined();
  const fullScale = chart.seriesScale(small).scale.max;
  chart.state = { ...chart.state, hiddenSeries: [large.key] };
  chart.observationSeries = chart.visibleSeries();
  expect(chart.observationSeries.map(series => series.label)).toEqual(['Small']);
  expect(chart.seriesScale(small).scale.max).toBeLessThan(fullScale);
  chart.state = { ...chart.state, hiddenSeries: [large.key, small.key] };
  chart.observationSeries = chart.visibleSeries();
  expect(chart.observationSeries).toEqual([]);
  expect(chart.axisSeries()).toBeNull();
});
