import type { Body, BodySeed } from '../physics/types'
import type { MissionReplay } from './types'
import { vector } from '../physics/vector'
import { DAYS_PER_YEAR } from '../utils/units'

type ReplayBody = MissionReplay['bodies'][number]
type ReplayView = NonNullable<MissionReplay['views']>[number]
const ORIGIN_3D = [0, 0, 0]

function writeBodyState(body: BodySeed, seed: ReplayBody, replay: MissionReplay, years: number, day: number, view?: ReplayView) {
  const state = seed.id in replay.tracks ? replay.sample(seed.id, years) : null
  const position = state?.position3D ?? seed.referencePosition ?? ORIGIN_3D
  const projected = view ? view.project(position, day) : state?.position
  body.position.x = projected?.x ?? position[0]!
  body.position.y = projected?.y ?? position[1]!
  body.velocity.x = state?.velocity.x ?? 0
  body.velocity.y = state?.velocity.y ?? 0
}

export function createReplayBodies(replay: MissionReplay, years = 0, viewId = ''): BodySeed[] {
  const view = replay.views?.find(view => view.id === viewId) ?? replay.views?.[0]
  const day = replay.start + years * DAYS_PER_YEAR
  const bodies: BodySeed[] = []
  for (const seed of replay.bodies) {
    if (seed.id in replay.tracks && !replay.available(seed.id, years)) continue
    const body = { ...seed, position: vector(), velocity: vector() }
    writeBodyState(body, seed, replay, years, day, view)
    bodies.push(body)
  }
  return bodies
}

// Keep surviving bodies and their vectors stable while admitting/removing delayed craft.
export function updateReplayBodies(bodies: Body[], replay: MissionReplay, years: number, viewId = '') {
  const view = replay.views?.find(view => view.id === viewId) ?? replay.views?.[0]
  const day = replay.start + years * DAYS_PER_YEAR
  let index = 0
  for (const seed of replay.bodies) {
    if (seed.id in replay.tracks && !replay.available(seed.id, years)) continue
    if (bodies[index]?.id !== seed.id) {
      const existing = bodies.findIndex((body, bodyIndex) => bodyIndex > index && body.id === seed.id)
      if (existing >= 0) bodies.splice(index, existing - index)
      else bodies.splice(index, 0, { ...seed, position: vector(), velocity: vector(), initialPosition: vector(), initialVelocity: vector(), trail: [] })
    }
    const body = bodies[index++]!
    writeBodyState(body, seed, replay, years, day, view)
    body.initialPosition.x = body.position.x
    body.initialPosition.y = body.position.y
    body.initialVelocity.x = body.velocity.x
    body.initialVelocity.y = body.velocity.y
    body.trail.length = 0
  }
  bodies.length = index
}
