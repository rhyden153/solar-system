import { performance, PerformanceObserver } from 'node:perf_hooks'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { loadTsModule } from './test-support.mjs'

// Override the root to compare a saved checkout using the same workload.
const root = resolve(process.env.SOLAR_SOURCE_ROOT ?? '.')
const { useLaboratory } = await loadTsModule(pathToFileURL(resolve(root, 'app/composables/useLaboratory.ts')))
const lab = useLaboratory({ lifecycle: false })
const counts = { minor: 0, total: 0 }
const observer = new PerformanceObserver(list => {
  for (const entry of list.getEntries()) { counts.total++; if (entry.detail.kind === 1) counts.minor++ }
})
observer.observe({ entryTypes: ['gc'] })
let randomState = 17
const originalRandom = Math.random
Math.random = () => ((randomState = Math.imul(randomState, 1664525) + 1013904223 >>> 0) / 4294967296)
const results = []
try {
  for (const preset of ['solar', 'comets', 'figure-eight', 'voyager1', 'cassini']) {
    await lab.selectPreset(preset)
    const dt = lab.activePreset.value.dt
    for (let step = 0; step < 500; step++) lab.integrate(dt)
    await new Promise(resolve => setImmediate(resolve))
    globalThis.gc?.()
    await new Promise(resolve => setImmediate(resolve))
    const before = { ...counts }
    const heap = process.memoryUsage().heapUsed
    let bodyArrayReplacements = 0
    let firstPositionReplacements = 0
    let previousBodies = lab.simulation.value.bodies
    let previousPosition = previousBodies[0]?.position
    const start = performance.now()
    for (let step = 0; step < 10000; step++) {
      lab.integrate(dt)
      const currentBodies = lab.simulation.value.bodies
      if (currentBodies !== previousBodies) bodyArrayReplacements++
      if (currentBodies[0]?.position !== previousPosition) firstPositionReplacements++
      previousBodies = currentBodies
      previousPosition = currentBodies[0]?.position
      if (step % 10 === 0) {
        void lab.selectedBody.value
        void lab.selectedDistance.value
        void lab.selectedMissionState.value
        void lab.displayScale.value
        if (!lab.isReplay.value) void lab.energyDrift.value
      }
    }
    const ms = performance.now() - start
    const heapDelta = process.memoryUsage().heapUsed - heap
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    const minorGCs = counts.minor - before.minor
    globalThis.gc?.()
    const retainedHeapDelta = globalThis.gc ? process.memoryUsage().heapUsed - heap : null
    results.push({ preset, steps: 10000, ms: Math.round(ms), minorGCs, heapDelta, retainedHeapDelta, bodyArrayReplacements, firstPositionReplacements, bodies: lab.simulation.value.bodies.length })
  }
} finally {
  Math.random = originalRandom
  observer.disconnect()
}
console.log(JSON.stringify(results, null, 2))
