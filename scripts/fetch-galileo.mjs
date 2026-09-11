import { horizons, mergeStates, writeDataset } from './horizons.mjs'

// Galileo's post-launch interplanetary cruise, in a Sun-centered frame.
// Dense encounter windows keep the gravity-assist and arrival geometry intact.
const start = '1989-10-19T02:00:00Z'
const end = '1995-12-07T22:05:00Z'
const probeStart = '1995-07-13T05:31:00Z'
const targets = {
  venus: '299',
  earth: '399',
  gaspra: '951;',
  ida: '243;',
  jupiter: '599',
  galileo: '-77',
  probe: '-344',
}
const encounters = [
  ['venus', '1990-02-09T00:00:00Z', '1990-02-11T00:00:00Z'],
  ['earth', '1990-12-07T00:00:00Z', '1990-12-09T00:00:00Z'],
  ['gaspra', '1991-10-29T00:00:00Z', '1991-10-31T00:00:00Z'],
  ['earth', '1992-12-07T00:00:00Z', '1992-12-09T00:00:00Z'],
  ['ida', '1993-08-27T00:00:00Z', '1993-08-29T00:00:00Z'],
  ['jupiter', '1995-12-06T00:00:00Z', end],
]

const states = {}
let provenance = ''
for (const [id, command] of Object.entries(targets)) {
  const trackStart = id === 'probe' ? probeStart : start
  const result = await horizons(command, '500@10', trackStart, end, id === 'galileo' || id === 'probe' ? '12h' : '1d')
  if (id === 'galileo' || id === 'probe') provenance += result.header
  const rows = [...result.rows]
  for (const [target, fineStart, fineEnd] of encounters) {
    if (id === 'galileo' || id === target || (id === 'probe' && target === 'jupiter')) rows.push(...(await horizons(command, '500@10', fineStart, fineEnd, '5m')).rows)
  }
  const endpointStart = new Date(Date.parse(end) - 60000).toISOString()
  rows.push((await horizons(command, '500@10', endpointStart, end, '1m')).rows.at(-1))
  states[id] = mergeStates(rows)
  console.log(`galileo/${id}: ${states[id].length} states`)
}

if (!provenance.includes('Galileo (spacecraft)') || !provenance.includes('Galileo Probe (spacecraft)')) throw new Error('Missing Galileo provenance')
await writeDataset('galileo', {
  source: 'https://ssd.jpl.nasa.gov/horizons/',
  target: '-77',
  start,
  end,
  center: '500@10',
  frame: 'Heliocentric J2000 ecliptic; AU and AU/day; UT',
  states,
}, provenance)
