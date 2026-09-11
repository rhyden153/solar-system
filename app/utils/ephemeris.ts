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
  const position = [1, 2, 3].map(axis => (2 * t ** 3 - 3 * t ** 2 + 1) * a[axis]! + (t ** 3 - 2 * t ** 2 + t) * span * a[axis + 3]! + (-2 * t ** 3 + 3 * t ** 2) * b[axis]! + (t ** 3 - t ** 2) * span * b[axis + 3]!)
  const velocity = [1, 2, 3].map(axis => ((6 * t ** 2 - 6 * t) * a[axis]! + (3 * t ** 2 - 4 * t + 1) * span * a[axis + 3]! + (-6 * t ** 2 + 6 * t) * b[axis]! + (3 * t ** 2 - 2 * t) * span * b[axis + 3]!) / span * 365.25)
  return { position3D: position, velocity3D: velocity, position: { x: position[0]!, y: position[1]! }, velocity: { x: velocity[0]!, y: velocity[1]! }, distance: Math.hypot(...position), speed: Math.hypot(...velocity), height: position[2]! }
}
