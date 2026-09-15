import assert from 'node:assert/strict'
import { loadLaboratory, loadTsModule } from './test-support.mjs'

const galileo = await loadTsModule(new URL('../app/utils/galileo.ts', import.meta.url))
const { galileoTracks, galileoStart, galileoEnd, galileoYears, galileoDate, galileoMissions, sampleGalileoBody } = galileo
const AU_KM = 149597870.7

assert.equal(galileoDate(0), '1989-10-19')
assert.equal(galileoDate(galileoYears), '1995-12-07')
for (const [id, rows] of Object.entries(galileoTracks)) {
  if (id === 'probe') assert.ok(rows[0][0] > galileoStart)
  else assert.equal(rows[0][0], galileoStart)
  assert.equal(rows.at(-1)[0], galileoEnd)
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    assert.equal(row.length, 7)
    assert.ok(row.every(Number.isFinite))
    if (i) assert.ok(row[0] > rows[i - 1][0])
    const state = sampleGalileoBody(id, (row[0] - galileoStart) / 365.25)
    assert.ok(Math.abs(state.position.x - row[1]) < 1e-8)
    assert.ok(Math.abs(state.position.y - row[2]) < 1e-8)
    assert.ok(Math.abs(state.height - row[3]) < 1e-8)
    if ((id === 'galileo' || id === 'probe') && i) assert.ok(row[0] - rows[i - 1][0] <= 0.500001)
  }
}

const orbiterEvents = galileoMissions[0].events
const probeEvents = galileoMissions[1].events
const separationKm = (craft, target, years) => {
  const a = sampleGalileoBody(craft, years)
  const b = sampleGalileoBody(target, years)
  return Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y, a.height - b.height) * AU_KM
}
for (const [label, target, min, max] of [
  ['Venus flyby', 'venus', 21000, 23000],
  ['Earth flyby 1', 'earth', 7000, 7600],
  ['Gaspra flyby', 'gaspra', 1500, 1800],
  ['Earth flyby 2', 'earth', 6400, 7000],
  ['Ida flyby', 'ida', 2400, 2800],
  ['Jupiter arrival', 'jupiter', 280000, 295000],
]) {
  const event = orbiterEvents.find(event => event.label === label)
  const distance = separationKm('galileo', target, event.years)
  assert.ok(distance > min && distance < max, `${label}: ${distance} km from ${target}`)
}
const entry = probeEvents.find(event => event.label === 'Atmospheric entry')
assert.ok(separationKm('probe', 'jupiter', entry.years) > 70000)
assert.ok(separationKm('probe', 'jupiter', entry.years) < 73000)
assert.equal(galileo.isGalileoBodyAvailable('probe', 0), false)
assert.equal(galileo.isGalileoBodyAvailable('probe', probeEvents[0].years), true)

const lab = await loadLaboratory()
await lab.selectPreset('galileo')
assert.equal(lab.selectedBodyId.value, 'galileo')
assert.deepEqual(lab.simulation.value.bodies.map(body => body.id), ['sun', 'venus', 'earth', 'gaspra', 'ida', 'jupiter', 'galileo'])
const initial = { ...lab.simulation.value.bodies.at(-1).position }
lab.integrate(0.001)
assert.notDeepEqual(lab.simulation.value.bodies.at(-1).position, initial)

for (const event of orbiterEvents) {
  lab.seekMission(event.years, 'galileo')
  assert.equal(lab.isRunning.value, false)
  assert.deepEqual({ ...lab.simulation.value.bodies.find(body => body.id === 'galileo').position }, sampleGalileoBody('galileo', event.years).position)
}
lab.seekMission(entry.years, 'probe')
assert.equal(lab.selectedBodyId.value, 'probe')
assert.deepEqual({ ...lab.simulation.value.bodies.find(body => body.id === 'probe').position }, sampleGalileoBody('probe', entry.years).position)

const annotations = []
let pathSegments = 0
const contextState = {}
const context = new Proxy(contextState, { get(target, name) {
  if (name === 'createRadialGradient') return () => ({ addColorStop() {} })
  if (name === 'fillText') return (label, x, y) => annotations.push({ label, x, y, align: target.textAlign ?? 'left', font: target.font ?? '10px' })
  return (...args) => {
    if (name === 'lineTo') pathSegments++
    if (['moveTo', 'lineTo', 'arc'].includes(name)) assert.ok(args.every(Number.isFinite), `${name} contains invalid coordinates`)
  }
}, set(target, name, value) { target[name] = value; return true } })
lab.canvas.value = { getContext: () => context }
lab.canvasSize.value = { width: 800, height: 500, dpr: 1 }
lab.draw()
assert.ok(annotations.some(({ label }) => label === 'Galileo Orbiter'))
assert.equal(annotations.some(({ label }) => label === 'Atmospheric Probe'), false)
assert.ok(annotations.some(({ label }) => label.includes('Jupiter arrival')))
assert.equal(annotations.some(({ label }) => label.includes('Atmospheric entry')), false)
assert.ok(pathSegments > galileoTracks.galileo.length + galileoTracks.probe.length)
lab.canvas.value = null

lab.integrate(100)
assert.equal(lab.simulation.value.elapsed, galileoYears)
assert.equal(lab.isRunning.value, false)
lab.resetSimulation()
assert.equal(lab.simulation.value.elapsed, 0)
assert.equal(lab.selectedBodyId.value, 'galileo')
assert.equal(lab.simulation.value.bodies.some(body => body.id === 'probe'), false)
await lab.selectPreset('voyager1')
assert.equal(lab.activeReplay.value.date(0), '1977-08-21')
lab.selectPreset('solar')
assert.equal(lab.activeReplay.value, undefined)
console.log('Galileo gravity assists, asteroid encounters, probe separation, Jupiter entry, playback, drawing, reset, and preset switching passed.')
