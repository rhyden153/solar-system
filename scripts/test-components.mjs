import assert from 'node:assert/strict'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { loadVueComponent } from './test-support.mjs'

async function render(name, props) {
  const component = await loadVueComponent(new URL(`../app/components/${name}.vue`, import.meta.url))
  const app = createSSRApp({ render: () => h(component, props) })
  app.config.warnHandler = warning => { throw new Error(warning) }
  return renderToString(app)
}

const body = { id: 'earth', name: 'Earth', mass: 3.003e-6, color: '#3ea6a6', role: 'Planet', position: { x: 1, y: 0 }, velocity: { x: 0, y: 6.28 }, trail: [] }
const inspector = await render('BodyInspector', { selectedBody: body, selectedMissionState: null, selectedDistance: 1, preset: { id: 'custom' }, bodies: [body], selectedId: 'earth' })
assert.ok(inspector.includes('Earth'))
assert.ok(inspector.includes('1.000 AU'))
assert.ok(inspector.includes('User parameters are active'))
assert.ok(inspector.includes('body-row selected'))

const transport = await render('TransportControls', { isRunning: true, speed: 2, showTrails: true, showGuides: true, showInspector: true, showTelemetry: true, focusMode: false, isReplay: false, zoomLevel: 1 })
assert.ok(transport.includes('Pause'))
assert.ok(transport.includes('2x'))
assert.ok(transport.includes('Metrics'))
assert.ok(transport.includes('100%'))
assert.ok(transport.includes('Run or pause (Space)'))
assert.ok(transport.includes('Toggle canvas zoom (Enter)'))

const timeline = await render('MissionTimeline', {
  title: 'Test mission', elapsed: 0, dt: 0.01,
  replay: { years: 1, date: () => '1969-07-20', available: () => true, missions: [{ id: 'craft', name: 'Columbia', color: '#fff', events: [{ label: 'Eagle lands', date: '1969-07-20', years: 0 }] }], note: 'Reconstructed trajectory' },
})
assert.ok(timeline.includes('Columbia'))
assert.ok(timeline.includes('Flight path'))
assert.ok(timeline.includes('Eagle lands'))

const configurator = await render('SystemConfigurator', { count: 0, error: 'Invalid mass', bodies: [{ id: 'star', name: 'Alpha', mass: 10000, color: '#ffffff', role: 'Star', x: 0, y: 0, vx: 0, vy: 0 }] })
assert.ok(configurator.includes('value="Alpha"'))
assert.ok(configurator.includes('Invalid mass'))
assert.ok(configurator.includes('Apply system'))
console.log('Timeline, inspector, transport, and configurator compile and render without Vue warnings.')
