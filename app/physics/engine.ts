import type { Body, BodySeed, Simulation } from './types'
import { vector, add, subtract, scale, magnitude } from './vector'
export const G = 4 * Math.PI * Math.PI
export const MIN_DISTANCE_SQ = 1e-10
export const MAX_TRAIL_POINTS = 300
export const EJECTION_DISTANCE_AU = 35

export function centerOnBarycenter(bodies: BodySeed[]) {
  const totalMass = bodies.reduce((sum, body) => sum + body.mass, 0)
  const center = bodies.reduce((sum, body) => add(sum, scale(body.position, body.mass)), vector())
  const momentum = bodies.reduce((sum, body) => add(sum, scale(body.velocity, body.mass)), vector())
  const barycenter = scale(center, 1 / totalMass)
  const baryVelocity = scale(momentum, 1 / totalMass)
  bodies.forEach((body) => {
    body.position = subtract(body.position, barycenter)
    body.velocity = subtract(body.velocity, baryVelocity)
  })
  return bodies
}

export function createSimulation(seeds: BodySeed[]): Simulation {
  const bodies = seeds.map((body) => ({
    ...body,
    position: { ...body.position },
    velocity: { ...body.velocity },
    trail: [{ ...body.position }],
    initialPosition: { ...body.position },
    initialVelocity: { ...body.velocity },
  }))
  const sun = bodies.find((body) => body.id === 'sun') ?? bodies.find((body) => body.role === 'Star')
  const previousSunDistances = new Map<string, number>()
  if (sun) {
    bodies.forEach((body) => {
      if (body.id !== sun.id) previousSunDistances.set(body.id, magnitude(subtract(body.position, sun.position)))
    })
  }
  return {
    bodies,
    elapsed: 0,
    steps: 0,
    initialEnergy: totalEnergy(bodies),
    sunId: sun?.id,
    previousSunDistances,
  }
}

// Each live simulation owns one reusable buffer; discarded simulations can be collected.
const accelerationBuffers = new WeakMap<Simulation, Float64Array>()

function accelerations(bodies: Body[], output: Float64Array) {
  for (let index = 0; index < bodies.length; index++) {
    const body = bodies[index]!
    let x = 0
    let y = 0
    for (let otherIndex = 0; otherIndex < bodies.length; otherIndex++) {
      const other = bodies[otherIndex]!
      if (other.id === body.id) continue
      const dx = other.position.x - body.position.x
      const dy = other.position.y - body.position.y
      const distanceSq = Math.max(dx * dx + dy * dy, MIN_DISTANCE_SQ)
      const factor = G * other.mass / (distanceSq * Math.sqrt(distanceSq))
      x += dx * factor
      y += dy * factor
    }
    output[index * 2] = x
    output[index * 2 + 1] = y
  }
}

export function integratePhysics(simulation: Simulation, dt: number, trailPoints = MAX_TRAIL_POINTS) {
  const current = simulation.bodies
  let buffer = accelerationBuffers.get(simulation)
  if (!buffer || buffer.length !== current.length * 2) {
    buffer = new Float64Array(current.length * 2)
    accelerationBuffers.set(simulation, buffer)
  }
  accelerations(current, buffer)
  for (let index = 0; index < current.length; index++) {
    const body = current[index]!
    body.velocity.x += buffer[index * 2]! * (dt / 2)
    body.velocity.y += buffer[index * 2 + 1]! * (dt / 2)
    body.position.x += body.velocity.x * dt
    body.position.y += body.velocity.y * dt
  }
  accelerations(current, buffer)
  for (let index = 0; index < current.length; index++) {
    const body = current[index]!
    body.velocity.x += buffer[index * 2]! * (dt / 2)
    body.velocity.y += buffer[index * 2 + 1]! * (dt / 2)
  }
  simulation.elapsed += dt
  simulation.steps += 1
  resetEjectedBodies(simulation)
  if (simulation.steps % 4 === 0) {
    for (const body of current) {
      // Recycle the oldest point once the trail is full, preserving its order.
      if (body.trail.length && body.trail.length >= trailPoints) {
        const point = body.trail.shift()!
        point.x = body.position.x
        point.y = body.position.y
        body.trail.push(point)
      } else if (trailPoints > 0) body.trail.push({ ...body.position })
    }
  }
}

export function totalEnergy(bodies: BodySeed[]): number {
  let kinetic = 0
  let potential = 0
  for (let index = 0; index < bodies.length; index++) {
    const body = bodies[index]!
    kinetic += 0.5 * body.mass * (body.velocity.x ** 2 + body.velocity.y ** 2)
    for (let otherIndex = index + 1; otherIndex < bodies.length; otherIndex++) {
      const other = bodies[otherIndex]!
      const dx = other.position.x - body.position.x
      const dy = other.position.y - body.position.y
      potential -= G * body.mass * other.mass / Math.max(Math.sqrt(dx * dx + dy * dy), Math.sqrt(MIN_DISTANCE_SQ))
    }
  }
  return kinetic + potential
}

function resetEjectedBodies(simulation: Simulation) {
  const { bodies, sunId, previousSunDistances } = simulation
  const sun = bodies.find((body) => body.id === sunId)
  if (!sun) return

  bodies.forEach((body) => {
    if (body.id === sun.id) return
    const dx = body.position.x - sun.position.x
    const dy = body.position.y - sun.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const previousDistance = previousSunDistances.get(body.id) ?? distance
    previousSunDistances.set(body.id, distance)
    if (previousDistance > EJECTION_DISTANCE_AU || distance <= EJECTION_DISTANCE_AU) return

    body.position = { ...body.initialPosition }
    body.velocity = { ...body.initialVelocity }
    body.trail = [{ ...body.initialPosition }]
    previousSunDistances.set(body.id, magnitude(subtract(body.position, sun.position)))
  })
}
