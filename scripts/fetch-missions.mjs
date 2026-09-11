import { horizons, writeDataset, mergeStates } from './horizons.mjs'

// Keep JPL requests sequential. UT dates match the mission timelines.
const configs = [
  { id: 'cassini', start: '2017-04-22T00:00:00Z', end: '2017-09-15T10:31:00Z', center: '500@699', plane: 'FRAME', targets: { cassini: '-82', titan: '606', enceladus: '602' }, step: '30m', fine: [['2017-09-15T00:00:00Z', '2017-09-15T10:31:00Z', '1m']] },
  { id: 'rosetta', start: '2014-08-06T09:06:00Z', end: '2016-09-30T10:39:00Z', center: '500@1000012', plane: 'ECLIPTIC', targets: { rosetta: '-226' }, step: '1h', fine: [['2016-09-29T12:00:00Z', '2016-09-30T10:39:00Z', '1m']] },
  { id: 'webb', start: '2021-12-26T00:00:00Z', end: '2023-01-24T19:05:00Z', center: '500@399', plane: 'ECLIPTIC', targets: { webb: '-170', sun: '10', moon: '301' }, step: '6h', fine: [] },
]
for (const config of configs) {
  const states = {}
  let provenance = ''
  for (const [id, target] of Object.entries(config.targets)) {
    const { rows, header } = await horizons(target, config.center, config.start, config.end, id === 'titan' ? '3h' : id === 'enceladus' ? '1h' : config.step, config.plane)
    if (id === config.id) provenance = header
    if (id === config.id) for (const [start, end, step] of config.fine) rows.push(...(await horizons(target, config.center, start, end, step, config.plane)).rows)
    // Always include the endpoint, even when the regular cadence misses it.
    const minuteBefore = new Date(Date.parse(config.end) - 60000).toISOString()
    rows.push((await horizons(target, config.center, minuteBefore, config.end, '1m', config.plane)).rows.at(-1))
    states[id] = mergeStates(rows)
    console.log(`${config.id}/${id}: ${states[id].length} states`)
  }
  await writeDataset(config.id, { source: 'https://ssd.jpl.nasa.gov/horizons/', start: config.start, end: config.end, center: config.center, frame: `Geometric J2000 ${config.plane}; AU and AU/day; UT`, states }, provenance)
}
