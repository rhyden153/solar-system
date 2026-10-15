import assert from 'node:assert/strict'
import { createRenderer, h, nextTick, isReactive } from 'vue'
import { loadLaboratory, loadTsModule, loadVueComponent } from './test-support.mjs'

const { createSimulation, integratePhysics } = await loadTsModule(new URL('../app/physics/engine.ts', import.meta.url))
const { createBinary } = await loadTsModule(new URL('../app/presets/initial-conditions.ts', import.meta.url))
const { formatCoordinate } = await loadTsModule(new URL('../app/utils/format.ts', import.meta.url))
const { trackBound } = await loadTsModule(new URL('../app/utils/ephemeris.ts', import.meta.url))
const { useLaboratory } = await loadTsModule(new URL('../app/composables/useLaboratory.ts', import.meta.url))
const Inspector = await loadVueComponent(new URL('../app/components/BodyInspector.vue', import.meta.url))

const seeds = createBinary(1, .65)
const originalSeeds = structuredClone(seeds)
const independentSimulation = createSimulation(seeds)
const simulation = createSimulation(seeds)
for (let i = 0; i < 1200; i++) integratePhysics(simulation, .0005)
assert.deepEqual(seeds, originalSeeds, 'In-place physics does not mutate the input seeds')
assert.deepEqual(independentSimulation.bodies.map(b => b.position), seeds.map(b => b.position), 'Simulations created from the same seeds remain independent')
const body = simulation.bodies[0]
const position = body.position, velocity = body.velocity, trail = body.trail
const points = new Set(trail)
for (let i = 0; i < 2400; i++) integratePhysics(simulation, .0005)
assert.equal(body.position, position)
assert.equal(body.velocity, velocity)
assert.equal(body.trail, trail)
assert.equal(body.trail.length, 300)
assert.ok(body.trail.every(point => points.has(point)), 'Full trails recycle their existing points')

const lab = await loadLaboratory()
await lab.selectPreset('voyager1')
assert.equal(isReactive(lab.simulation.value), false, 'Simulation and trails do not enter the proxy graph')
const bodies = lab.simulation.value.bodies
const earth = bodies.find(body => body.id === 'earth')
const earthPosition = earth.position
lab.seekMission(.1)
assert.equal(lab.simulation.value.bodies, bodies)
assert.equal(bodies.find(body => body.id === 'earth'), earth)
assert.equal(earth.position, earthPosition)
assert.ok(bodies.some(body => body.id === 'voyager1'))
lab.seekMission(0)
assert.ok(!bodies.some(body => body.id === 'voyager1'))
assert.equal(bodies.find(body => body.id === 'earth'), earth)
const tracks = [[1], [2], [2], [4]]
for (const [day, low, high] of [[0,0,0], [1,0,1], [2,1,3], [3,3,3], [4,3,4], [5,4,4]]) {
  assert.equal(trackBound(tracks, day), low)
  assert.equal(trackBound(tracks, day, true), high)
}

// Mount through Vue to check explicit notifications, paused rendering, and disposal.
const saved = Object.fromEntries(['window', 'document', 'ResizeObserver'].map(key => [key, globalThis[key]]))
const frames = new Map(), listeners = new Map(), documentListeners = new Map()
let frameId = 0, draws = 0, reads = 0, disconnected = false, resize
const ctx = new Proxy({}, {
  get(_, key) {
    if (key === 'clearRect') return () => { draws++ }
    if (key === 'createRadialGradient') return () => ({ addColorStop() {} })
    return () => {}
  }, set() { return true },
})
const canvas = { getContext() { reads++; return ctx }, width: 0, height: 0 }
globalThis.window = {
  devicePixelRatio: 1,
  requestAnimationFrame(fn) { const id = ++frameId; frames.set(id, fn); return id },
  cancelAnimationFrame(id) { frames.delete(id) },
  addEventListener(name, fn) { listeners.set(name, fn) },
  removeEventListener(name, fn) { if (listeners.get(name) === fn) listeners.delete(name) },
}
globalThis.document = {
  fullscreenElement: null,
  addEventListener(name, fn) { documentListeners.set(name, fn) },
  removeEventListener(name, fn) { if (documentListeners.get(name) === fn) documentListeners.delete(name) },
}
globalThis.ResizeObserver = class {
  constructor(fn) { resize = fn }
  observe() {}
  disconnect() { disconnected = true }
}
const node = (type, text = '') => ({ type, text, children: [], parent: null })
const renderer = createRenderer({
  createElement: node, createText: text => node('text', text), createComment: text => node('comment', text),
  setText: (el, text) => { el.text = text }, setElementText: (el, text) => { el.text = text; el.children = [] },
  patchProp() {}, parentNode: el => el.parent, nextSibling: () => null,
  insert(el, parent, anchor) {
    if (el.parent) el.parent.children.splice(el.parent.children.indexOf(el), 1)
    const index = anchor ? parent.children.indexOf(anchor) : -1
    parent.children.splice(index < 0 ? parent.children.length : index, 0, el)
    el.parent = parent
  },
  remove(el) { if (el.parent) el.parent.children.splice(el.parent.children.indexOf(el), 1) },
})
let mounted
const root = node('root')
const app = renderer.createApp({ setup() {
  mounted = useLaboratory()
  mounted.canvas.value = canvas
  mounted.stage.value = { getBoundingClientRect: () => ({ width: 800, height: 500 }) }
  return () => h('main', [
    h('output', String(mounted.simulation.value.steps)),
    h(Inspector, { selectedId: mounted.selectedBodyId.value, selectedBody: mounted.selectedBody.value, selectedMissionState: mounted.selectedMissionState.value, selectedDistance: mounted.selectedDistance.value, preset: mounted.activePreset.value, replay: mounted.activeReplay.value, bodies: mounted.simulation.value.bodies }),
  ])
} })
const tick = async () => {
  const [id, callback] = frames.entries().next().value
  frames.delete(id)
  callback(id * 16)
  await nextTick()
}
const text = element => element.text + element.children.map(text).join(' ')
try {
  app.mount(root)
  mounted.selectedBodyId.value = 'earth'
  mounted.isRunning.value = false
  await tick()
  const paused = draws
  for (let i = 0; i < 10; i++) await tick()
  assert.equal(draws, paused, 'Paused canvas does not redraw each animation frame')
  mounted.showGuides.value = false
  await tick()
  assert.equal(draws, paused + 1, 'Paused display toggles redraw')
  mounted.setZoom(1.25)
  await tick()
  assert.equal(draws, paused + 2, 'Paused camera zoom redraws')
  const inspectorText = () => text(root.children[0].children[1])
  const oldText = inspectorText()
  mounted.isRunning.value = true
  for (let i = 0; i < 30; i++) await tick()
  assert.notEqual(inspectorText(), oldText, 'Inspector coordinates update with raw simulation data')
  assert.ok(inspectorText().includes(formatCoordinate(mounted.selectedBody.value.position.x)))
  assert.ok(inspectorText().includes(formatCoordinate(mounted.selectedBody.value.position.y)))
  assert.equal(root.children[0].children[0].text, String(mounted.simulation.value.steps), 'Telemetry renders the current step count')
  assert.equal(mounted.selectedBody.value.position.x, mounted.simulation.value.bodies.find(b => b.id === 'earth').position.x)
  assert.equal(reads, 1, 'Canvas context is reused')
  mounted.isRunning.value = false
  resize()
  await tick()
  const panel = {}
  mounted.fullscreenPanel.value = panel
  document.fullscreenElement = mounted.fullscreenPanel.value
  documentListeners.get('fullscreenchange')()
  assert.equal(mounted.isFullscreen.value, true)
  document.fullscreenElement = null
  documentListeners.get('fullscreenchange')()
  assert.equal(mounted.isFullscreen.value, false, 'Native fullscreen exit updates the control')
  app.unmount()
  assert.equal(frames.size, 0)
  assert.equal(listeners.size, 0)
  assert.equal(documentListeners.size, 0)
  assert.equal(disconnected, true)
} finally {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete globalThis[key]
    else globalThis[key] = value
  }
}
console.log('Buffer and trail reuse, stable replay bodies, track bounds, live Vue updates, paused redraws, context reuse, fullscreen sync, and lifecycle cleanup passed.')
