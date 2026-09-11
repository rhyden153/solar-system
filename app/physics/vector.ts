import type { Vector } from './types'

export const vector = (x = 0, y = 0): Vector => ({ x, y })
export const add = (a: Vector, b: Vector): Vector => ({ x: a.x + b.x, y: a.y + b.y })
export const subtract = (a: Vector, b: Vector): Vector => ({ x: a.x - b.x, y: a.y - b.y })
export const scale = (a: Vector, amount: number): Vector => ({ x: a.x * amount, y: a.y * amount })
export const magnitude = (a: Vector): number => Math.sqrt(a.x * a.x + a.y * a.y)
