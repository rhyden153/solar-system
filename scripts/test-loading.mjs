import assert from 'node:assert/strict'
import { loadLaboratory } from './test-support.mjs'

const lab = await loadLaboratory()
assert.ok(lab.presetCatalog.every(preset => !preset.replay), 'Startup does not initialize mission replays')
const voyager = lab.presetCatalog.find(preset => preset.id === 'voyager1')
const loadVoyager = voyager.loadReplay
let finishLoad
voyager.loadReplay = () => new Promise(resolve => { finishLoad = resolve }).then(loadVoyager)

const originalSimulation = lab.simulation.value
const firstSelection = lab.selectPreset('voyager1')
assert.equal(lab.pendingPresetId.value, 'voyager1')
assert.equal(lab.activePresetId.value, 'solar')
assert.equal(lab.simulation.value, originalSimulation, 'Current simulation remains usable during loading')
await lab.selectPreset('binary')
finishLoad()
await firstSelection
assert.equal(lab.activePresetId.value, 'binary', 'An older download cannot override a later selection')
assert.equal(lab.pendingPresetId.value, '')
voyager.loadReplay = () => { throw new Error('Cached mission should not be loaded again') }
await lab.selectPreset('voyager1')
assert.equal(lab.activePresetId.value, 'voyager1')
assert.equal(lab.activeReplay.value.date(0), '1977-08-21')
assert.equal(lab.simulation.value.bodies.length, 10)

const galileo = lab.presetCatalog.find(preset => preset.id === 'galileo')
const loadGalileo = galileo.loadReplay
galileo.loadReplay = () => Promise.reject(new Error('Network unavailable'))
const beforeFailure = lab.simulation.value
await lab.selectPreset('galileo')
assert.equal(lab.activePresetId.value, 'voyager1')
assert.equal(lab.simulation.value, beforeFailure)
assert.equal(lab.pendingPresetId.value, '')
assert.match(lab.presetError.value, /could not load/)
galileo.loadReplay = loadGalileo
await lab.selectPreset('galileo')
assert.equal(lab.activePresetId.value, 'galileo', 'Failed downloads can be retried')
assert.equal(lab.presetError.value, '')

const cassini = lab.presetCatalog.find(preset => preset.id === 'cassini')
const loadCassini = cassini.loadReplay
const sharedRequest = loadCassini()
assert.equal(loadCassini(), sharedRequest, 'Repeated requests share the same download')
await sharedRequest

const rosetta = lab.presetCatalog.find(preset => preset.id === 'rosetta')
const loadRosetta = rosetta.loadReplay
rosetta.loadReplay = () => new Promise(resolve => { finishLoad = resolve }).then(loadRosetta)
const pendingSelection = lab.selectPreset('rosetta')
lab.openConfigurator()
lab.applyManualSystem()
finishLoad()
await pendingSelection
assert.equal(lab.activePresetId.value, 'custom', 'A download cannot replace a custom system')
assert.equal(lab.isRunning.value, false)
assert.equal(lab.pendingPresetId.value, '')

console.log('Lazy mission loading, caching, selection races, failure recovery, and custom system cancellation passed.')
