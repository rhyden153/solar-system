export const dot = (a: number[], b: number[]) => a.reduce((sum, x, i) => sum + x * b[i]!, 0)
export const norm = (a: number[]) => Math.hypot(...a)
export const unit = (a: number[]) => a.map(x => x / norm(a))
export const cross = (a: number[], b: number[]) => [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!]
export const radians = (degrees: number) => degrees * Math.PI / 180
