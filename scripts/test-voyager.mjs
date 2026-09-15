import assert from 'node:assert/strict'
import { loadLaboratory, loadTsModule } from './test-support.mjs'

const mission = await loadTsModule(new URL('../app/utils/voyager.ts', import.meta.url))
const { voyagerTracks, sampleVoyagerBody, missionStart, missionYears, missionDate, dateToMissionYears } = mission
assert.equal(missionDate(0), '1977-08-21')
assert.equal(missionDate(missionYears), '2026-09-08')
for (const [id, rows] of Object.entries(voyagerTracks)) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    assert.equal(row.length, 7)
    assert.ok(row.every(Number.isFinite))
    if (i) assert.ok(row[0] > rows[i - 1][0])
    const state = sampleVoyagerBody(id, (row[0] - missionStart) / 365.25)
    assert.ok(Math.abs(state.position.x - row[1]) < 1e-8)
    assert.ok(Math.abs(state.position.y - row[2]) < 1e-8)
    assert.ok(Number.isFinite(state.speed))
  }
}
for (const [craft, planet, date] of [['voyager1', 'jupiter', '1979-03-05'], ['voyager1', 'saturn', '1980-11-12'], ['voyager2', 'jupiter', '1979-07-09'], ['voyager2', 'saturn', '1981-08-25'], ['voyager2', 'uranus', '1986-01-24'], ['voyager2', 'neptune', '1989-08-25']]) {
  const years = dateToMissionYears(date)
  let closest = Infinity
  for (let hour = 0; hour < 24; hour++) {
    const a = sampleVoyagerBody(craft, years + hour / (24 * 365.25))
    const b = sampleVoyagerBody(planet, years + hour / (24 * 365.25))
    closest = Math.min(closest, Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y, a.height - b.height))
  }
  assert.ok(closest < 0.005, `${planet} encounter missed: ${closest} AU`)
  console.log(`${craft} ${planet} flyby: ${(closest * 149597870.7).toFixed(0)} km (hourly samples)`)
}
assert.ok(sampleVoyagerBody('voyager1', dateToMissionYears('1990-02-14')).distance > 35)
assert.ok(sampleVoyagerBody('voyager1', missionYears).distance > 160)
assert.ok(sampleVoyagerBody('voyager1', missionYears).height > 50)
assert.ok(sampleVoyagerBody('voyager2', missionYears).distance > 130)
assert.ok(sampleVoyagerBody('voyager2', missionYears).height < -50)
assert.deepEqual(sampleVoyagerBody('voyager2', -10), sampleVoyagerBody('voyager2', 0))
assert.deepEqual(sampleVoyagerBody('voyager2', 100), sampleVoyagerBody('voyager2', missionYears))
assert.deepEqual(sampleVoyagerBody('voyager1', -10), sampleVoyagerBody('voyager1', 0))
assert.deepEqual(sampleVoyagerBody('voyager1', 100), sampleVoyagerBody('voyager1', missionYears))

// Exercise the actual app's preset selection, playback, seeking, and reset logic.
const lab = await loadLaboratory()
assert.ok(!lab.presetCatalog.some(preset => preset.id === 'slingshot'))
await lab.selectPreset('voyager1')
assert.equal(lab.simulation.value.bodies.length, 10)
assert.equal(lab.selectedBodyId.value, 'voyager2')
assert.ok(!lab.simulation.value.bodies.some(body => body.id === 'voyager1'))
lab.integrate(0.1)
assert.equal(lab.simulation.value.elapsed, 0.1)
assert.equal(lab.simulation.value.bodies.length, 11)
const craft1 = lab.simulation.value.bodies.find(body => body.id === 'voyager1')
const craft2 = lab.simulation.value.bodies.find(body => body.id === 'voyager2')
assert.notEqual(craft1.color, craft2.color)
assert.equal(craft1.role, 'Spacecraft')
assert.equal(craft2.role, 'Spacecraft')
lab.seekMission(dateToMissionYears('1989-08-25'), 'voyager2')
assert.equal(lab.selectedBodyId.value, 'voyager2')
lab.seekMission(dateToMissionYears('1980-11-12'), 'voyager1')
assert.equal(lab.selectedBodyId.value, 'voyager1')
lab.seekMission(0)
assert.equal(lab.selectedBodyId.value, 'voyager2')
assert.equal(lab.simulation.value.bodies.length, 10)
for (const replay of mission.voyagerMissions) {
  for (const event of replay.events) {
    const years = dateToMissionYears(event.date)
    assert.equal(missionDate(years), event.date)
    lab.seekMission(years, replay.id)
    assert.equal(lab.selectedBodyId.value, replay.id)
    for (const body of lab.simulation.value.bodies.filter(body => body.role === 'Spacecraft')) {
      const expected = sampleVoyagerBody(body.id, years)
      assert.deepEqual({ ...body.position }, expected.position)
      assert.ok(Math.max(Math.abs(body.position.x), Math.abs(body.position.y)) * lab.displayScale.value <= 210.00001)
    }
  }
}
lab.seekMission(dateToMissionYears('1990-02-14'))
assert.equal(lab.isRunning.value, false)
assert.ok(Math.hypot(...Object.values(lab.simulation.value.bodies.at(-1).position)) > 30)
lab.isRunning.value = true
lab.integrate(100)
assert.equal(lab.simulation.value.elapsed, missionYears)
assert.equal(lab.isRunning.value, false)
lab.resetSimulation()
assert.equal(lab.simulation.value.elapsed, 0)
assert.equal(lab.simulation.value.bodies.length, 10)
assert.equal(lab.selectedBodyId.value, 'voyager2')
lab.selectPreset('solar')
lab.integrate(0.002)
assert.equal(lab.simulation.value.elapsed, 0.002)
console.log('Voyager data, flybys, playback, endpoint, reset, and solar regression checks passed.')

// Exercise pointer capture, camera projection, and picking after a manual pan.
const captures = new Set()
lab.canvas.value = {
  getContext: () => null,
  getBoundingClientRect: () => ({ left: 10, top: 20 }),
  setPointerCapture: id => captures.add(id),
  hasPointerCapture: id => captures.has(id),
  releasePointerCapture: id => captures.delete(id),
}
lab.canvasSize.value = { width: 800, height: 500, dpr: 2 }
const pointer = (x, y, button = 2, buttons = 2, pointerId = 7) => ({
  clientX: x, clientY: y, button, buttons, pointerId, preventDefault() {},
})
const project = body => lab.worldToScreen(body.position, 800, 500, lab.getFocusPoint())
const closeTo = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`)
for (const preset of ['solar', 'comets', 'voyager1', 'galileo']) {
  await lab.selectPreset(preset)
  lab.isRunning.value = false
  const selectedBefore = lab.selectedBodyId.value
  const sun = lab.simulation.value.bodies.find(body => body.id === 'sun')
  const original = project(sun)
  lab.startCanvasPan(pointer(100, 100, 0, 1))
  assert.equal(lab.canvasPan.value, null, 'Left-click must not start a pan')
  lab.startCanvasPan(pointer(100, 100))
  assert.ok(captures.has(7))
  lab.moveCanvasPan(pointer(300, 300, 2, 2, 8))
  assert.deepEqual(project(sun), original, 'Ignore unrelated pointers')
  lab.moveCanvasPan(pointer(160, 140))
  closeTo(project(sun).x, original.x + 60)
  closeTo(project(sun).y, original.y + 40)
  assert.equal(lab.selectedBodyId.value, selectedBefore)
  assert.equal(lab.isPanned.value, true)
  lab.endCanvasPan(pointer(160, 140, 2, 0))
  assert.equal(lab.canvasPan.value, null)
  assert.equal(captures.size, 0)
  lab.moveCanvasPan(pointer(200, 200))
  closeTo(project(sun).x, original.x + 60)
  // Body picking uses the shifted display position, including the canvas bounds.
  const sunPoint = project(sun)
  lab.handleCanvasClick({ button: 0, clientX: sunPoint.x + 10, clientY: sunPoint.y + 20 })
  assert.equal(lab.selectedBodyId.value, 'sun')
  lab.setZoom(2)
  closeTo(project(sun).x, original.x + 120)
  closeTo(project(sun).y, original.y + 80)
  lab.startCanvasPan(pointer(160, 140))
  lab.moveCanvasPan(pointer(130, 120))
  closeTo(project(sun).x, original.x + 90)
  closeTo(project(sun).y, original.y + 60)
  lab.recenterCamera()
  assert.equal(lab.canvasPan.value, null)
  assert.equal(captures.size, 0)
  assert.equal(lab.isPanned.value, false)
  assert.equal(lab.zoomLevel.value, 2, 'Recenter preserves zoom')
  assert.equal(lab.isRunning.value, false, 'Panning and recentering preserve pause state')
  assert.deepEqual(project(sun), original)
}
const panAway = () => {
  lab.startCanvasPan(pointer(100, 100))
  lab.moveCanvasPan(pointer(150, 120))
  assert.equal(lab.isPanned.value, true)
}
for (const restore of [lab.resetSimulation, () => lab.selectPreset('solar'), lab.applyManualSystem]) {
  panAway()
  restore()
  assert.equal(lab.isPanned.value, false)
  assert.equal(lab.canvasPan.value, null)
  assert.equal(captures.size, 0)
}
panAway()
lab.moveCanvasPan(pointer(150, 120, 2, 0))
assert.equal(lab.canvasPan.value, null, 'A missing right button ends the drag')
panAway()
lab.stopCanvasPan()
assert.equal(lab.canvasPan.value, null, 'Window blur ends the drag')
assert.equal(captures.size, 0)
lab.canvas.value = null
console.log('Canvas panning, zoom, picking, recentering, and pointer cleanup checks passed.')

const shortcut = (key, options = {}) => {
  let prevented = false
  const event = { key, code: '', repeat: false, defaultPrevented: false, ctrlKey: false, altKey: false, metaKey: false, target: null, preventDefault() { prevented = true }, ...options }
  lab.handleKeyboardShortcut(event)
  return prevented
}
lab.isRunning.value = false
assert.equal(shortcut(' ', { code: 'Space' }), true)
assert.equal(lab.isRunning.value, true)
shortcut(' ', { code: 'Space', repeat: true })
assert.equal(lab.isRunning.value, true, 'Held space does not repeatedly toggle playback')
lab.speed.value = 1
assert.equal(shortcut('+'), true)
assert.equal(lab.speed.value, 2)
shortcut('-', { code: 'NumpadSubtract' })
assert.equal(lab.speed.value, 1)
shortcut('-')
assert.equal(lab.speed.value, 1, 'Speed is clamped at the slider minimum')
lab.speed.value = 20
shortcut('=', { code: 'Equal' })
assert.equal(lab.speed.value, 20, 'Speed is clamped at the slider maximum')
lab.focusMode.value = false
assert.equal(shortcut('Enter'), true)
assert.equal(lab.focusMode.value, true)
shortcut('Enter')
assert.equal(lab.focusMode.value, false)
const inputTarget = { closest: () => ({}) }
assert.equal(shortcut(' ', { code: 'Space', target: inputTarget }), false)
assert.equal(lab.isRunning.value, true, 'Shortcuts are ignored while using an interactive control')
assert.equal(shortcut(' ', { code: 'Space', ctrlKey: true }), false)
assert.equal(lab.isRunning.value, true, 'Modified shortcuts are left to the browser')
console.log('Space, speed, zoom, repeat, bounds, and editable-control keyboard shortcuts passed.')
