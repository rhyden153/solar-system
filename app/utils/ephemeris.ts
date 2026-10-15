export function sampleTrack(track: number[][], julianDay: number) {
  const day = Math.min(track.at(-1)![0]!, Math.max(track[0]![0]!, julianDay))
  let low = 0
  let high = track.length - 1
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2)
    if (track[middle]![0]! <= day) low = middle
    else high = middle
  }
  const a = track[low]!
  const b = track[high]!
  const span = b[0]! - a[0]!
  const t = (day - a[0]!) / span
  // Cubic Hermite interpolation uses Horizons velocities, retaining curved motion.
  const t2 = t ** 2
  const t3 = t ** 3
  const p0 = 2 * t3 - 3 * t2 + 1
  const p1 = (t3 - 2 * t2 + t) * span
  const p2 = -2 * t3 + 3 * t2
  const p3 = (t3 - t2) * span
  const v0 = 6 * t2 - 6 * t
  const v1 = (3 * t2 - 4 * t + 1) * span
  const v2 = -6 * t2 + 6 * t
  const v3 = (3 * t2 - 2 * t) * span
  const position = new Array<number>(3)
  const velocity = new Array<number>(3)
  for (let axis = 1; axis <= 3; axis++) {
    position[axis - 1] = p0 * a[axis]! + p1 * a[axis + 3]! + p2 * b[axis]! + p3 * b[axis + 3]!
    velocity[axis - 1] = (v0 * a[axis]! + v1 * a[axis + 3]! + v2 * b[axis]! + v3 * b[axis + 3]!) / span * 365.25
  }
  return { position3D: position, velocity3D: velocity, position: { x: position[0]!, y: position[1]! }, velocity: { x: velocity[0]!, y: velocity[1]! }, distance: Math.hypot(...position), speed: Math.hypot(...velocity), height: position[2]! }
}

// Sorted mission tracks use inclusive windows. `after` selects the upper bound.
export function trackBound(track: number[][], day: number, after = false) {
  let low = 0
  let high = track.length
  while (low < high) {
    const middle = (low + high) >>> 1
    const time = track[middle]![0]!
    if (after ? time <= day : time < day) low = middle + 1
    else high = middle
  }
  return low
}
