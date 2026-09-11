import assert from 'node:assert/strict'
import { loadTsModule } from './test-support.mjs'
import { horizons, mergeStates } from './horizons.mjs'

const { createSimulation, integratePhysics, totalEnergy } = await loadTsModule(new URL('../app/physics/engine.ts', import.meta.url))
const { createBinary } = await loadTsModule(new URL('../app/presets/initial-conditions.ts', import.meta.url))
const { createLocalReplay } = await loadTsModule(new URL('../app/utils/local-replay.ts', import.meta.url))
const { createReplayBodies } = await loadTsModule(new URL('../app/missions/playback.ts', import.meta.url))
const { toDay } = await loadTsModule(new URL('../app/utils/time.ts', import.meta.url))

// Exercise the physics engine without constructing Vue state or mission datasets.
const simulation = createSimulation(createBinary(1, 0.65))
for (let step = 0; step < 2000; step++) integratePhysics(simulation, 0.0005)
assert.ok(Math.abs((totalEnergy(simulation.bodies) - simulation.initialEnergy) / simulation.initialEnergy) < 0.00001)
for (const axis of ['x', 'y']) {
  assert.ok(Math.abs(simulation.bodies.reduce((sum, body) => sum + body.mass * body.position[axis], 0)) < 1e-10)
  assert.ok(Math.abs(simulation.bodies.reduce((sum, body) => sum + body.mass * body.velocity[axis], 0)) < 1e-10)
}

// Projection caching must be lazy and preserve delayed spacecraft availability.
const start = '2014-08-06T09:06:00Z'
const day = toDay(start)
const firstDay = Number(day.toPrecision(15))
const data = { start, end: '2014-08-08T09:06:00Z', states: {
  craft: [[firstDay, 1, 0, 0, 0, 1, 0], [day + 2, 1, 2, 0, 0, 1, 0]],
  later: [[day + 1, 2, 0, 0, 0, 1, 0], [day + 2, 2, 1, 0, 0, 1, 0]],
} }
let projections = 0
const replay = createLocalReplay(data, {
  body: 'craft', name: 'Craft', color: '#fff', distanceLabel: 'Distance', note: '', inspectorNote: '', events: [],
  bodies: ['origin', 'craft', 'later'].map(id => ({ id, name: id, mass: 1, color: '#fff', role: 'Spacecraft' })),
  views: [{ id: 'xy', label: 'XY', frame: 'XY', extent: 1, center: { x: 0, y: 0 }, project: p => { projections++; return { x: p[0], y: p[1] } } }],
})
assert.equal(projections, 0)
const tracks = replay.views[0].tracks
assert.equal(projections, 4)
assert.equal(replay.views[0].tracks, tracks)
assert.equal(projections, 4)
assert.deepEqual(createReplayBodies(replay).map(body => body.id), ['origin', 'craft'])
assert.deepEqual(createReplayBodies(replay, 1 / 365.25).map(body => body.id), ['origin', 'craft', 'later'])

// Verify fetching options without network requests or regenerating checked-in data.
const originalFetch = globalThis.fetch
const requests = []
globalThis.fetch = async url => {
  requests.push(new URL(url).searchParams)
  return { ok: true, json: async () => ({ result: 'header\n$$SOE\n2450000, date, 1.123456789012345, 2, 3, 4, 5, 6,\n$$EOE' }) }
}
try {
  const voyager = await horizons('-31', '500@10', '1977-09-06', '1977-09-07', '1d', 'ECLIPTIC', { timeType: null, referenceSystem: null, precision: 11 })
  const precise = await horizons('-77', '500@10', '1989-10-19', '1989-10-20', '1d', 'ECLIPTIC', { timeType: 'TDB', precision: 13 })
  const local = await horizons('301', '500@399', '1969-07-16T00:00:00Z', '1969-07-17T00:00:00Z', '5m', 'FRAME')
  assert.equal(requests[0].has('TIME_TYPE'), false)
  assert.equal(requests[0].has('REF_SYSTEM'), false)
  assert.equal(requests[1].get('TIME_TYPE'), 'TDB')
  assert.equal(requests[2].get('TIME_TYPE'), 'UT')
  assert.equal(requests[2].get('REF_PLANE'), 'FRAME')
  assert.equal(voyager.rows[0][1], 1.123456789)
  assert.equal(precise.rows[0][1], 1.123456789012)
  assert.equal(local.rows[0][1], 1.12345678901235)
  assert.equal(local.header, 'header\n')
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ result: '$$SOE\n2450000, date, bad, 2, 3, 4, 5, 6\n$$EOE' }) })
  await assert.rejects(horizons('x', 'y', '2000-01-01', '2000-01-02', '1d'), /Invalid state vector/)
} finally {
  globalThis.fetch = originalFetch
}
assert.deepEqual(mergeStates([[2, 20], [1, 10], [2, 21]]), [[1, 10], [2, 21]])
console.log('Pure physics, replay availability, lazy projections, and Horizons options passed.')
