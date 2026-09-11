import type { Vector } from '../physics/types'

export function projectToScreen(position: Vector, width: number, height: number, focus: Vector, offset: Vector, scale: number): Vector {
  return { x: width / 2 + (position.x - focus.x - offset.x) * scale, y: height / 2 - (position.y - focus.y - offset.y) * scale }
}

