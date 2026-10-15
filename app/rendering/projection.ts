import type { Vector } from '../physics/types'

export function projectToScreen(position: Vector, width: number, height: number, focus: Vector, offset: Vector, scale: number, output: Vector = { x: 0, y: 0 }): Vector {
  output.x = width / 2 + (position.x - focus.x - offset.x) * scale
  output.y = height / 2 - (position.y - focus.y - offset.y) * scale
  return output
}

