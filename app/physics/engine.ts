import type { Body, BodySeed, Simulation, Vector } from './types'
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

function acceleration(body: Body, bodies: Body[]): Vector {
  return bodies.reduce((result, other) => {
    if (other.id === body.id) return result
    const offset = subtract(other.position, body.position)
    const distanceSq = Math.max(offset.x * offset.x + offset.y * offset.y, MIN_DISTANCE_SQ)
    return add(result, scale(offset, G * other.mass / (distanceSq * Math.sqrt(distanceSq))))
  }, vector())
}

export function integratePhysics(simulation: Simulation, dt: number, trailPoints = MAX_TRAIL_POINTS) {
  const current = simulation.bodies
  const firstAccelerations = current.map((body) => acceleration(body, current))
  current.forEach((body, index) => {
    body.velocity = add(body.velocity, scale(firstAccelerations[index]!, dt / 2))
    body.position = add(body.position, scale(body.velocity, dt))
  })
  const secondAccelerations = current.map((body) => acceleration(body, current))
  current.forEach((body, index) => { body.velocity = add(body.velocity, scale(secondAccelerations[index]!, dt / 2)) })
  simulation.elapsed += dt
  simulation.steps += 1
  resetEjectedBodies(simulation)
  if (simulation.steps % 4 === 0) {
    current.forEach((body) => {
      body.trail.push({ ...body.position })
      if (body.trail.length > trailPoints) body.trail.shift()
    })
  }
}

export function totalEnergy(bodies: BodySeed[]): number {
  let kinetic = 0
  let potential = 0
  bodies.forEach((body, index) => {
    kinetic += 0.5 * body.mass * (body.velocity.x ** 2 + body.velocity.y ** 2)
    bodies.slice(index + 1).forEach((other) => { potential -= G * body.mass * other.mass / Math.max(magnitude(subtract(other.position, body.position)), Math.sqrt(MIN_DISTANCE_SQ)) })
  })
  return kinetic + potential
}

function resetEjectedBodies(simulation: Simulation) {
  const { bodies, sunId, previousSunDistances } = simulation
  const sun = bodies.find((body) => body.id === sunId)
  if (!sun) return

  bodies.forEach((body) => {
    if (body.id === sun.id) return
    const distance = magnitude(subtract(body.position, sun.position))
    const previousDistance = previousSunDistances.get(body.id) ?? distance
    previousSunDistances.set(body.id, distance)
    if (previousDistance > EJECTION_DISTANCE_AU || distance <= EJECTION_DISTANCE_AU) return

    body.position = { ...body.initialPosition }
    body.velocity = { ...body.initialVelocity }
    body.trail = [{ ...body.initialPosition }]
    previousSunDistances.set(body.id, magnitude(subtract(body.position, sun.position)))
  })
}
