import type { MissionReplay } from '../missions/types'

export type Vector = { x: number; y: number }
export type OrbitGuide = { center: Vector; radius: number; color: string }
export type BodySeed = {
  id: string
  name: string
  mass: number
  color: string
  position: Vector
  velocity: Vector
  trail?: Vector[]
  orbitParent?: string
  role?: string
  radiusKm?: number
}
export type Body = BodySeed & { trail: Vector[]; initialPosition: Vector; initialVelocity: Vector }
export type EditableBody = {
  id: string
  name: string
  mass: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  role: string
}
export type Preset = {
  id: string
  name: string
  category: string
  summary: string
  description: string
  bodies: string
  dt: number
  viewScale: number
  systemFocusBody?: string
  focusBody?: string
  guides: OrbitGuide[]
  replay?: MissionReplay
  inspectorNote?: string
  trailPoints?: number
  createBodies: () => BodySeed[]
}
export type Simulation = { bodies: Body[]; elapsed: number; steps: number; initialEnergy: number; sunId?: string; previousSunDistances: Map<string, number> }

