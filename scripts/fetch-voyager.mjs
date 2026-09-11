import { horizons, mergeStates } from './horizons.mjs'
import { mkdir, writeFile } from 'node:fs/promises'

// NASA/JPL Horizons: heliocentric, geometric J2000 ecliptic states (AU, AU/day).
// Keep requests sequential, as required by the SSD API fair-use policy.
const targets = { mercury: '199', venus: '299', earth: '399', mars: '499', jupiter: '5', saturn: '6', uranus: '7', neptune: '8', voyager1: '-31', voyager2: '-32' }
const encounters = {
  voyager1: [['1979-03-03', '1979-03-08'], ['1980-11-10', '1980-11-15']],
  voyager2: [['1979-07-07', '1979-07-12'], ['1981-08-23', '1981-08-28'], ['1986-01-22', '1986-01-27'], ['1989-08-23', '1989-08-28']],
}
async function fetchStates(command, start, end, step) {
  return (await horizons(command, '500@10', start, end, step, 'ECLIPTIC', { timeType: null, referenceSystem: null, precision: 11 })).rows
}
const states = {}
for (const [id, command] of Object.entries(targets)) {
  let rows = await fetchStates(command, id === 'voyager1' ? '1977-09-06' : '1977-08-21', '2026-09-08', '5d')
  rows.push(...await fetchStates(command, '2026-09-08', '2026-09-09', '1d'))
  rows.pop()
  for (const [start, stop] of encounters[id] ?? []) {
    rows.push(...await fetchStates(command, start, stop, '1h'))
  }
  states[id] = mergeStates(rows)
  console.log(`${id}: ${states[id].length} states`)
}
await mkdir(new URL('../app/data/', import.meta.url), { recursive: true })
await writeFile(new URL('../app/data/voyagers.json', import.meta.url), JSON.stringify({ source: 'https://ssd.jpl.nasa.gov/horizons/', frame: 'Heliocentric J2000 ecliptic; AU and AU/day; TDB', start: '1977-08-21', end: '2026-09-08', states }))
