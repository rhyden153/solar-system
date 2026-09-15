import type { Vector, EditableBody, Preset, Simulation } from '../physics/types'
import { vector, add, subtract, scale, magnitude } from '../physics/vector'
import { createSimulation, integratePhysics, totalEnergy } from '../physics/engine'
import { createManualStar, createManualPlanet, editableBodyToSeed, calculateManualViewScale } from '../presets/initial-conditions'
import { formatYears } from '../utils/format'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { createPresetCatalog } from '../presets/catalog'
import { drawScene, getBodyDisplayRadius, type Scene } from '../rendering/scene'
import { useCamera } from '../composables/useCamera'
import { AU_KM } from '../utils/units'
import { createReplayBodies } from '../missions/playback'

export function useLaboratory({ lifecycle = true } = {}) {
  const binaryPrimaryMass = ref(1)
  const binaryCompanionMass = ref(0.65)

  const presetCatalog = createPresetCatalog(() => [binaryPrimaryMass.value, binaryCompanionMass.value])
  const pendingPresetId = ref('')
  const presetError = ref('')
  let presetRequest = 0

  function cancelPresetLoad() {
    presetRequest += 1
    pendingPresetId.value = ''
    presetError.value = ''
  }

  const manualStar = ref<EditableBody>(createManualStar())
  const manualPlanets = ref<EditableBody[]>([0, 1, 2].map((index) => createManualPlanet(index)))
  const manualPlanetCount = ref(manualPlanets.value.length)
  const manualViewScale = ref(180)
  const configOpen = ref(false)
  const configError = ref('')
  const showInspector = ref(true)
  const showTelemetry = ref(true)
  const focusMode = ref(false)
  const editableBodies = computed(() => [manualStar.value, ...manualPlanets.value])
  const customPreset = computed<Preset>(() => ({
    id: 'custom',
    name: 'Custom System',
    category: 'USER CONFIGURATION',
    summary: `${manualPlanets.value.length} planets / 1 star`,
    description: 'A user-defined system using the same fixed-step Newtonian gravity model as the laboratory presets.',
    bodies: `${editableBodies.value.length} bodies`,
    dt: 0.001,
    viewScale: manualViewScale.value,
    focusBody: manualStar.value.id,
    guides: [],
    createBodies: () => editableBodies.value.map(editableBodyToSeed),
  }))
  const activePresetId = ref('solar')
  const activePreset = computed(() => activePresetId.value === 'custom' ? customPreset.value : (presetCatalog.find((preset) => preset.id === activePresetId.value) ?? presetCatalog[0]!))
  const replayViewId = ref('')
  const simulation = ref<Simulation>(createCurrentSimulation())
  const isRunning = ref(true)
  const speed = ref(1)
  const showTrails = ref(true)
  const showGuides = ref(true)
  const selectedBodyId = ref('earth')
  const canvas = ref<HTMLCanvasElement | null>(null)
  const stage = ref<HTMLElement | null>(null)
  const canvasSize = ref({ width: 0, height: 0, dpr: 1 })
  let animationFrame = 0
  let resizeObserver: ResizeObserver | undefined
  let lastFrame = 0

  function createCurrentSimulation() {
    const preset = activePreset.value
    const bodies = preset.replay ? createReplayBodies(preset.replay, 0, replayViewId.value) : preset.createBodies()
    return createSimulation(bodies)
  }

  function integrate(dt: number) {
    if (activeReplay.value) {
      updateMissionPlayback(simulation.value.elapsed + dt)
      simulation.value.steps += 1
      if (simulation.value.elapsed >= activeReplay.value.years) isRunning.value = false
    } else {
      integratePhysics(simulation.value, dt, activePreset.value.trailPoints)
    }
  }

  function animate(timestamp: number) {
    const frameDelta = Math.min(timestamp - lastFrame, 80)
    lastFrame = timestamp
    if (isRunning.value && frameDelta > 0) {
      const substeps = speed.value < 1 ? 1 : Math.round(speed.value)
      const dt = activePreset.value.dt * Math.min(speed.value, 1)
      for (let step = 0; step < substeps; step += 1) integrate(dt)
    }
    draw()
    animationFrame = window.requestAnimationFrame(animate)
  }

  const selectedBody = computed(() => simulation.value.bodies.find((body) => body.id === selectedBodyId.value) ?? simulation.value.bodies[0])
  const activeReplay = computed(() => activePreset.value.replay)
  const isReplay = computed(() => !!activeReplay.value)
  const activeReplayView = computed(() => activeReplay.value?.views?.find(view => view.id === replayViewId.value) ?? activeReplay.value?.views?.[0])
  const isGalileo = computed(() => activePresetId.value === 'galileo')
  const selectedMissionState = computed(() => {
    const replay = activeReplay.value
    const body = selectedBody.value
    return replay && body && body.id in replay.tracks ? replay.sample(body.id, simulation.value.elapsed) : null
  })

  function updateMissionPlayback(years: number) {
    const replay = activeReplay.value
    if (!replay) return
    simulation.value.elapsed = Math.max(0, Math.min(replay.years, years))
    // Rebuild active bodies so seeking before a spacecraft's departure removes it.
    const bodies = createReplayBodies(replay, simulation.value.elapsed, replayViewId.value)
    simulation.value.bodies = bodies.map(body => ({ ...body, trail: [], initialPosition: { ...body.position }, initialVelocity: { ...body.velocity } }))
    if (!simulation.value.bodies.some(body => body.id === selectedBodyId.value)) selectedBodyId.value = replay.selectedBody
  }
  function seekMission(years: number, spacecraft?: string) {
    isRunning.value = false
    updateMissionPlayback(years)
    if (spacecraft && simulation.value.bodies.some(body => body.id === spacecraft)) selectedBodyId.value = spacecraft
    draw()
  }
  const energyDrift = computed(() => {
    const start = Math.abs(simulation.value.initialEnergy)
    if (!start) return 0
    return ((totalEnergy(simulation.value.bodies) - simulation.value.initialEnergy) / start) * 100
  })
  const selectedDistance = computed(() => {
    if (selectedMissionState.value) return selectedMissionState.value.distance
    if (activeReplay.value?.bodies) return 0
    const body = selectedBody.value
    if (!body) return 0
    const reference = simulation.value.bodies.find((item) => item.id === (body.orbitParent ?? 'sun'))
    return !reference || reference.id === body.id ? magnitude(body.position) : magnitude(subtract(body.position, reference.position))
  })
  const cameraTargetId = computed(() => activePreset.value.systemFocusBody ?? activePreset.value.focusBody)
  const focusBodyName = computed(() => simulation.value.bodies.find((body) => body.id === cameraTargetId.value)?.name ?? 'CENTER')
  const displayScale = computed(() => {
    const size = Math.min(canvasSize.value.width || 800, canvasSize.value.height || 500)
    if (activeReplayView.value) return size * 0.43 / activeReplayView.value.extent * zoomLevel.value
    if (activePresetId.value === 'binary') return size * 0.4 / 0.65 * zoomLevel.value
    if (activePresetId.value === 'figure-eight') return size * 0.4 * zoomLevel.value
    if (isGalileo.value) return size * 0.42 / activePreset.value.viewScale * zoomLevel.value
    if (isReplay.value) {
      const probes = simulation.value.bodies.filter(body => body.role === 'Spacecraft')
      const extent = Math.max(12, ...probes.flatMap(body => [Math.abs(body.position.x), Math.abs(body.position.y)]))
      return Math.min(canvasSize.value.width || 800, canvasSize.value.height || 500) * 0.42 / extent * zoomLevel.value
    }
    return activePreset.value.viewScale * zoomLevel.value
  })
  const { zoomLevel, cameraOffset, canvasPan, isPanned, setZoom, recenterCamera, worldToScreen, startCanvasPan, moveCanvasPan, stopCanvasPan, endCanvasPan, handleWheel } = useCamera(canvas, displayScale, draw)

  const statusText = computed(() => isRunning.value ? 'RUNNING' : 'PAUSED')
  const missionOutsideView = computed(() => {
    if (!activeReplayView.value || !canvasSize.value.width) return false
    const craft = simulation.value.bodies.find(body => body.id === activeReplay.value?.selectedBody)
    if (!craft) return false
    const { width, height } = canvasSize.value
    const point = worldToScreen(craft.position, width, height, getFocusPoint())
    return point.x < 0 || point.x > width || point.y < 0 || point.y > height
  })

  function updateEditableBody(id: string, patch: Partial<EditableBody>) {
    const body = editableBodies.value.find(body => body.id === id)
    if (body) Object.assign(body, patch)
  }
  function resizeManualPlanets() {
    const nextCount = Math.min(12, Math.max(0, Math.floor(Number(manualPlanetCount.value) || 0)))
    manualPlanetCount.value = nextCount
    while (manualPlanets.value.length < nextCount) manualPlanets.value.push(createManualPlanet(manualPlanets.value.length))
    if (manualPlanets.value.length > nextCount) manualPlanets.value.splice(nextCount)
  }

  function openConfigurator() {
    cancelPresetLoad()
    isRunning.value = false
    configError.value = ''
    configOpen.value = true
  }

  function closeConfigurator() {
    configOpen.value = false
    configError.value = ''
  }

  function restoreManualStarter() {
    manualStar.value = createManualStar()
    manualPlanets.value = [0, 1, 2].map((index) => createManualPlanet(index))
    manualPlanetCount.value = 3
    configError.value = ''
  }

  function applyManualSystem() {
    resizeManualPlanets()
    const invalidBody = editableBodies.value.find((body) => {
      return !body.name.trim() || !Number.isFinite(Number(body.mass)) || Number(body.mass) <= 0 || ![body.x, body.y, body.vx, body.vy].every((value) => Number.isFinite(Number(value)))
    })
    if (invalidBody) {
      configError.value = `${invalidBody.name || 'Every body'} needs a name, positive mass, and numeric position and velocity values.`
      return
    }
    const seeds = editableBodies.value.map(editableBodyToSeed)
    cancelPresetLoad()
    manualViewScale.value = calculateManualViewScale(seeds)
    activePresetId.value = 'custom'
    simulation.value = createCurrentSimulation()
    selectedBodyId.value = manualStar.value.id
    zoomLevel.value = 1
    recenterCamera()
    focusMode.value = true
    configOpen.value = false
    configError.value = ''
    isRunning.value = false
  }

  async function selectPreset(id: string) {
    const preset = presetCatalog.find(preset => preset.id === id)
    if (!preset) return
    cancelPresetLoad()
    const request = presetRequest
    if (preset.loadReplay && !preset.replay) {
      pendingPresetId.value = id
      try {
        await preset.loadReplay()
      } catch {
        if (request === presetRequest) {
          pendingPresetId.value = ''
          presetError.value = `${preset.name} could not load. Select it to retry, or refresh the page.`
        }
        return
      }
      if (request !== presetRequest) return
      pendingPresetId.value = ''
    }
    activePresetId.value = id
    replayViewId.value = ''
    simulation.value = createCurrentSimulation()
    selectedBodyId.value = activeReplay.value?.selectedBody ?? activePreset.value.focusBody ?? simulation.value.bodies[0]?.id ?? ''
    zoomLevel.value = 1
    recenterCamera()
    isRunning.value = true
  }
  function resetSimulation() {
    simulation.value = createCurrentSimulation()
    selectedBodyId.value = activeReplay.value?.selectedBody ?? activePreset.value.focusBody ?? simulation.value.bodies[0]?.id ?? ''
    recenterCamera()
    isRunning.value = false
  }
  function updateBinaryMasses() {
    const running = isRunning.value
    resetSimulation()
    isRunning.value = running
  }
  function setReplayView(id: string) {
    replayViewId.value = id
    zoomLevel.value = 1
    updateMissionPlayback(simulation.value.elapsed)
    recenterCamera()
  }
  function formatRuler() {
    const distance = 120 / displayScale.value
    return activeReplayView.value ? `${(distance * AU_KM).toLocaleString(undefined, { maximumFractionDigits: distance * AU_KM < 10 ? 1 : 0 })} km` : `${distance.toFixed(displayScale.value > 1000 ? 4 : 2)} AU`
  }

  function stepOnce() { integrate(activePreset.value.dt); draw() }

  function handleKeyboardShortcut(event: KeyboardEvent) {
    const target = event.target as { closest?: (selector: string) => Element | null } | null
    if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || target?.closest?.('input, textarea, select, button, a, [contenteditable="true"]')) return
    if (event.key === ' ' || event.code === 'Space') {
      if (!event.repeat) isRunning.value = !isRunning.value
    } else if (event.key === '+' || event.key === '=' || event.code === 'NumpadAdd') {
      speed.value = Math.min(20, Math.round(speed.value) + 1)
    } else if (event.key === '-' || event.key === '_' || event.code === 'NumpadSubtract') {
      speed.value = Math.max(1, Math.round(speed.value) - 1)
    } else if (event.key === 'Enter' && !event.repeat) {
      focusMode.value = !focusMode.value
    } else return
    event.preventDefault()
  }

  function renderScene(): Scene {
    return { simulation: simulation.value, preset: activePreset.value, replay: activeReplay.value,
      view: activeReplayView.value, displayScale: displayScale.value, cameraOffset: cameraOffset.value,
      focus: getFocusPoint(), showGuides: showGuides.value, showTrails: showTrails.value,
      selectedBodyId: selectedBodyId.value }
  }
  function draw() {
    const render = getCanvasContext()
    if (render?.width && render.height) drawScene(render.context, render.width, render.height, renderScene())
  }
  function getCanvasContext() {
    if (!canvas.value) return null
    const context = canvas.value.getContext('2d')
    if (!context) return null
    context.setTransform(canvasSize.value.dpr, 0, 0, canvasSize.value.dpr, 0, 0)
    return { context, width: canvasSize.value.width, height: canvasSize.value.height }
  }

  function getFocusPoint(): Vector {
    if (activeReplayView.value) return activeReplayView.value.center
    const focus = cameraTargetId.value ? simulation.value.bodies.find((body) => body.id === cameraTargetId.value) : undefined
    if (focus) return focus.position
    const totalMass = simulation.value.bodies.reduce((sum, body) => sum + body.mass, 0)
    const center = simulation.value.bodies.reduce((sum, body) => add(sum, scale(body.position, body.mass)), vector())
    return scale(center, 1 / totalMass)
  }

  function resizeCanvas() {
    if (!stage.value || !canvas.value) return
    const rect = stage.value.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvasSize.value = { width: rect.width, height: rect.height, dpr }
    canvas.value.width = Math.max(1, Math.floor(rect.width * dpr))
    canvas.value.height = Math.max(1, Math.floor(rect.height * dpr))
    draw()
  }
  function handleCanvasClick(event: MouseEvent) {
    if (!canvas.value || event.button !== 0 || canvasPan.value) return
    const rect = canvas.value.getBoundingClientRect()
    const click = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    const focus = getFocusPoint()
    let nearest: { id: string; distance: number } | undefined
    simulation.value.bodies.forEach((body) => { const point = worldToScreen(body.position, canvasSize.value.width, canvasSize.value.height, focus); const distance = Math.hypot(point.x - click.x, point.y - click.y); if (distance < Math.max(getBodyDisplayRadius(body, renderScene()) + 12, 18) && (!nearest || distance < nearest.distance)) nearest = { id: body.id, distance } })
    if (nearest) selectedBodyId.value = nearest.id
  }

  if (lifecycle) {
    onMounted(() => {
      window.addEventListener('blur', stopCanvasPan)
      window.addEventListener('keydown', handleKeyboardShortcut)
      resizeObserver = new ResizeObserver(resizeCanvas)
      if (stage.value) resizeObserver.observe(stage.value)
      resizeCanvas()
      animationFrame = window.requestAnimationFrame(animate)
  })
  onUnmounted(() => { cancelPresetLoad(); stopCanvasPan(); window.removeEventListener('blur', stopCanvasPan); window.removeEventListener('keydown', handleKeyboardShortcut); window.cancelAnimationFrame(animationFrame); resizeObserver?.disconnect() })
  }

  return {
    binaryPrimaryMass,
    binaryCompanionMass,
    presetCatalog,
    pendingPresetId,
    presetError,
    manualPlanetCount,
    configOpen,
    configError,
    showInspector,
    showTelemetry,
    focusMode,
    editableBodies,
    activePresetId,
    activePreset,
    simulation,
    isRunning,
    speed,
    showTrails,
    showGuides,
    selectedBodyId,
    canvas,
    stage,
    canvasSize,
    selectedBody,
    activeReplay,
    isReplay,
    activeReplayView,
    selectedMissionState,
    energyDrift,
    selectedDistance,
    focusBodyName,
    displayScale,
    statusText,
    missionOutsideView,
    integrate,
    seekMission,
    updateEditableBody,
    resizeManualPlanets,
    openConfigurator,
    closeConfigurator,
    restoreManualStarter,
    applyManualSystem,
    selectPreset,
    resetSimulation,
    updateBinaryMasses,
    setReplayView,
    formatRuler,
    stepOnce,
    handleKeyboardShortcut,
    draw,
    getFocusPoint,
    handleCanvasClick,
    zoomLevel,
    canvasPan,
    isPanned,
    setZoom,
    recenterCamera,
    worldToScreen,
    startCanvasPan,
    moveCanvasPan,
    stopCanvasPan,
    endCanvasPan,
    handleWheel,
    formatYears
  }

}
