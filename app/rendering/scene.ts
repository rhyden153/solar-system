import type { Body, Preset, Simulation, Vector, OrbitGuide } from '../physics/types'
import type { MissionReplay } from '../missions/types'
import { vector, magnitude } from '../physics/vector'
import { AU_KM, DISPLAY_VALUE_SCALE } from '../utils/units'
import { projectToScreen } from './projection'
import { ringFlattening } from './saturn'

export type Scene = {
  simulation: Simulation
  preset: Preset
  replay?: MissionReplay
  view?: NonNullable<MissionReplay['views']>[number]
  displayScale: number
  cameraOffset: Vector
  focus: Vector
  showGuides: boolean
  showTrails: boolean
  selectedBodyId: string
}

const MIN_BODY_DISPLAY_RADIUS = 3
const MAX_BODY_DISPLAY_RADIUS = 24
const BODY_RADIUS_SCALE = 0.9

export function getBodyDisplayRadius(body: Body, scene: Scene) {
  if (scene.view && body.radiusKm) return Math.max(3, body.radiusKm / AU_KM * scene.displayScale)
  if (scene.replay) return body.id === 'sun' ? 8 : body.role === 'Spacecraft' ? 4 : 3
  // Radius follows the cube root of mass, as it would for bodies with similar density.
  const massRadius = Math.cbrt(Math.max(body.mass, 0) * DISPLAY_VALUE_SCALE) * BODY_RADIUS_SCALE
  return Math.min(MAX_BODY_DISPLAY_RADIUS, Math.max(MIN_BODY_DISPLAY_RADIUS, MIN_BODY_DISPLAY_RADIUS + massRadius))
}

export function drawScene(context: CanvasRenderingContext2D, width: number, height: number, scene: Scene) {
  context.clearRect(0, 0, width, height)
  context.fillStyle = '#0a1015'
  context.fillRect(0, 0, width, height)
  drawGrid(context, width, height)
  const focus = scene.focus
  if (scene.showGuides) drawOrbitGuides(context, width, height, focus)
  if (scene.showTrails) drawTrails(context, width, height, focus)
  scene.simulation.bodies.forEach((body) => drawBody(context, width, height, focus, body))

  function worldToScreen(position: Vector, width: number, height: number, focus: Vector) { return projectToScreen(position, width, height, focus, scene.cameraOffset, scene.displayScale) }
  function drawGrid(context: CanvasRenderingContext2D, width: number, height: number) {
    context.save()
    context.strokeStyle = 'rgba(110, 153, 165, 0.08)'
    context.lineWidth = 1
    const spacing = 48
    const origin = worldToScreen(vector(), width, height, vector())
    for (let x = (origin.x % spacing + spacing) % spacing; x < width; x += spacing) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke() }
    for (let y = (origin.y % spacing + spacing) % spacing; y < height; y += spacing) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke() }
    context.strokeStyle = 'rgba(110, 153, 165, 0.14)'
    context.setLineDash([3, 5])
    context.beginPath(); context.moveTo(origin.x, 0); context.lineTo(origin.x, height); context.moveTo(0, origin.y); context.lineTo(width, origin.y); context.stroke()
    context.restore()
  }
  function drawOrbitGuides(context: CanvasRenderingContext2D, width: number, height: number, focus: Vector) {
    context.save()
    const guides = scene.preset.id === 'binary' ? scene.simulation.bodies.map(body => ({ center: vector(), radius: magnitude(body.initialPosition), color: body.color + '66' })) : scene.preset.guides
    guides.forEach((guide: OrbitGuide) => {
      const center = worldToScreen(guide.center, width, height, focus)
      const radius = guide.radius * scene.displayScale
      if (radius < 2 || radius > Math.max(width, height) * 2) return
      context.beginPath(); context.setLineDash([1, 6]); context.strokeStyle = guide.color; context.lineWidth = 1; context.arc(center.x, center.y, radius, 0, Math.PI * 2); context.stroke()
    })
    if (scene.preset.id === 'webb') {
      const l2 = worldToScreen(vector(1500000 / AU_KM, 0), width, height, focus)
      context.strokeStyle = '#b5a0ed99'; context.lineWidth = 1; context.setLineDash([])
      context.beginPath(); context.moveTo(l2.x - 6, l2.y); context.lineTo(l2.x + 6, l2.y); context.moveTo(l2.x, l2.y - 6); context.lineTo(l2.x, l2.y + 6); context.stroke()
      context.fillStyle = '#b5a0ed'; context.font = '11px Consolas, monospace'; context.fillText('L2 (approx.)', l2.x + 10, l2.y - 10)
    }
    const replay = scene.replay
    if (replay) {
      replay.missions.forEach(mission => {
        context.beginPath(); context.setLineDash([3, 5]); context.strokeStyle = `${mission.color}44`
        let started = false
        const day = replay.start + scene.simulation.elapsed * 365.25
        replay.tracks[mission.id]!.forEach((row, index) => {
          if (replay.routeDays && (row[0]! < day || row[0]! > day + replay.routeDays)) return
          const point = worldToScreen(scene.view?.tracks[mission.id]?.[index] ?? vector(row[1], row[2]), width, height, focus)
          if (!started) context.moveTo(point.x, point.y)
          else context.lineTo(point.x, point.y)
          started = true
        })
        context.stroke(); context.setLineDash([])
        mission.events.filter(event => replay.markerEvents ? replay.markerEvents.includes(event.label) : event.label.endsWith('flyby')).forEach(event => {
          const state = replay.sample(mission.id, event.years)
          const position = scene.view ? scene.view.project(state.position3D, replay.start + event.years * 365.25) : state.position
          const point = worldToScreen(position, width, height, focus)
          context.strokeStyle = mission.color; context.beginPath(); context.arc(point.x, point.y, 6, 0, Math.PI * 2); context.stroke()
          context.fillStyle = mission.color; context.font = '10px Consolas, monospace'; context.textAlign = 'left'; context.fillText(`${scene.preset.id === 'voyager1' ? 'V' + mission.id.slice(-1) + ' ' : ''}${event.label} / ${event.date.slice(0, 4)}`, point.x + 10, point.y + (mission.id === 'voyager2' ? 20 : -10))
        })
      })
    }
    context.restore()
  }
  function drawTrails(context: CanvasRenderingContext2D, width: number, height: number, focus: Vector) {
    context.save()
    const replay = scene.replay
    if (replay) {
      const day = replay.start + scene.simulation.elapsed * 365.25
      scene.simulation.bodies.forEach(body => {
        if (!(body.id in replay.tracks)) return
        context.beginPath()
        let started = false
        for (const [index, row] of replay.tracks[body.id]!.entries()) {
          if (row[0]! > day) break
          if (row[0]! < day - (replay.trailDays ?? (body.role === 'Spacecraft' ? Infinity : 90))) continue
          const point = worldToScreen(scene.view?.tracks[body.id]?.[index] ?? vector(row[1], row[2]), width, height, focus)
          if (!started) context.moveTo(point.x, point.y)
          else context.lineTo(point.x, point.y)
          started = true
        }
        const point = worldToScreen(body.position, width, height, focus)
        if (started) context.lineTo(point.x, point.y)
        context.strokeStyle = `${body.color}${body.role === 'Spacecraft' ? 'ee' : '55'}`
        context.lineWidth = body.role === 'Spacecraft' ? 2 : 1
        context.stroke()
      })
      context.restore()
      return
    }
    scene.simulation.bodies.forEach((body) => {
      if (body.trail.length < 2) return
      context.beginPath()
      body.trail.forEach((point, index) => {
        const screen = worldToScreen(point, width, height, focus)
        if (index === 0) context.moveTo(screen.x, screen.y)
        else context.lineTo(screen.x, screen.y)
      })
      context.strokeStyle = `${body.color}55`; context.lineWidth = body.id === scene.selectedBodyId ? 1.6 : 1; context.stroke()
    })
    context.restore()
  }
  function drawBody(context: CanvasRenderingContext2D, width: number, height: number, focus: Vector, body: Body) {
    const point = worldToScreen(body.position, width, height, focus)
    const radius = getBodyDisplayRadius(body, scene)
    const margin = radius + 36
    if (point.x < -margin || point.x > width + margin || point.y < -margin || point.y > height + margin) return
    context.save()
    if (body.role === 'Star') {
      const glow = context.createRadialGradient(point.x, point.y, radius * .3, point.x, point.y, radius * 2.6)
      glow.addColorStop(0, `${body.color}55`); glow.addColorStop(1, `${body.color}00`); context.fillStyle = glow; context.beginPath(); context.arc(point.x, point.y, radius * 2.6, 0, Math.PI * 2); context.fill()
    }
    if (scene.preset.id === 'cassini' && body.id === 'saturn') drawSaturnRings(context, point, false)
    context.fillStyle = body.color; context.beginPath(); context.arc(point.x, point.y, radius, 0, Math.PI * 2); context.fill()
    if (scene.preset.id === 'cassini' && body.id === 'saturn') drawSaturnRings(context, point, true)
    if (!scene.replay?.hiddenBodyLabels?.includes(body.id)) {
      context.fillStyle = !!scene.replay && body.role === 'Spacecraft' ? body.color : '#dbe7e7'; context.font = '11px Consolas, monospace'; context.textAlign = 'center'; context.fillText(body.name, point.x, point.y + radius + (!!scene.replay && body.role === 'Spacecraft' ? (body.id === 'voyager2' ? -24 : 34) : 18))
    }
    context.restore()
  }
  function drawSaturnRings(context: CanvasRenderingContext2D, point: Vector, front: boolean) {
    for (const [inner, outer, color] of [[74658, 92000, '#89775788'], [92000, 117580, '#c4b18ab0'], [122170, 136775, '#a99b7d99']] as const) {
      const outerRadius = outer / AU_KM * scene.displayScale
      const innerRadius = inner / AU_KM * scene.displayScale
      const start = front ? 0 : Math.PI
      const end = front ? Math.PI : Math.PI * 2
      context.beginPath(); context.fillStyle = color
      context.ellipse(point.x, point.y, outerRadius, outerRadius * ringFlattening, 0, start, end)
      context.ellipse(point.x, point.y, innerRadius, innerRadius * ringFlattening, 0, end, start, true)
      context.closePath(); context.fill()
    }
  }
}
