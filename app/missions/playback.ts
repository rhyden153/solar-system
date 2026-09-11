import type { BodySeed } from '../physics/types'
import type { MissionReplay } from './types'
import { vector } from '../physics/vector'
import { DAYS_PER_YEAR } from '../utils/units'

export function createReplayBodies(replay: MissionReplay, years = 0, viewId = ''): BodySeed[] {
  const view = replay.views?.find(view => view.id === viewId) ?? replay.views?.[0]
  const day = replay.start + years * DAYS_PER_YEAR
  return replay.bodies.filter(body => !(body.id in replay.tracks) || replay.available(body.id, years)).map(body => {
    const state = body.id in replay.tracks ? replay.sample(body.id, years) : null
    const position = state?.position3D ?? body.referencePosition ?? [0, 0, 0]
    return { ...body, position: view ? view.project(position, day) : vector(position[0], position[1]), velocity: state?.velocity ?? vector() }
  })
}
