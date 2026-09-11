import type { BodySeed, EditableBody } from '../physics/types'
import { vector, add, subtract, scale, magnitude } from '../physics/vector'
import { G, centerOnBarycenter } from '../physics/engine'
import { toDisplayValue, toPhysicsValue } from '../utils/units'
const SOLAR_SYSTEM_BODY_NAMES = ['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', "Sedna", "Eris", "Haumea"] as const
const manualPalette = ['#f4b942', '#3ea6a6', '#cf6c4f', '#78c8c8', '#597ed0', '#d89a62', '#a99bd2', '#7fc7b5', '#d78f56', '#c0c8cc', '#e58a8a', '#9eb3d6']

export function randomPlanetMassDisplay(planetNumber: number) {
  const minimum = 0.1
  const maximum = 7 * planetNumber
  return Number((minimum + Math.random() * (maximum - minimum)).toFixed(2))
}

export function createManualStar(): EditableBody {
  return { id: 'custom-star', name: SOLAR_SYSTEM_BODY_NAMES[0], mass: toDisplayValue(1), x: 0, y: 0, vx: 0, vy: 0, color: '#f4b942', role: 'Star' }
}

export function createManualPlanet(index: number): EditableBody {
  const radius = 0.8 + index * 0.45
  const angle = index * 1.45
  const orbitSpeed = Math.sqrt(G / radius)
  return {
    id: `custom-planet-${index + 1}`,
    name: SOLAR_SYSTEM_BODY_NAMES[index + 1] ?? `Planet ${index + 1}`,
    mass: randomPlanetMassDisplay(index + 1),
    x: toDisplayValue(radius * Math.cos(angle)),
    y: toDisplayValue(radius * Math.sin(angle)),
    vx: toDisplayValue(-orbitSpeed * Math.sin(angle)),
    vy: toDisplayValue(orbitSpeed * Math.cos(angle)),
    color: manualPalette[(index + 1) % manualPalette.length]!,
    role: 'Planet',
  }
}

export function editableBodyToSeed(body: EditableBody): BodySeed {
  return {
    id: body.id,
    name: body.name || body.id,
    mass: toPhysicsValue(body.mass),
    color: body.color,
    position: vector(toPhysicsValue(body.x), toPhysicsValue(body.y)),
    velocity: vector(toPhysicsValue(body.vx), toPhysicsValue(body.vy)),
    role: body.role,
  }
}

export function calculateManualViewScale(bodies: BodySeed[]) {
  const primary = bodies[0]?.position ?? vector()
  const furthest = Math.max(...bodies.map((body) => magnitude(subtract(body.position, primary))), 1)
  return Math.min(900, Math.max(8, 250 / furthest))
}

export function orbitingBody(id: string, name: string, mass: number, radius: number, color: string, angle: number, role: string): BodySeed {
  const position = vector(radius * Math.cos(angle), radius * Math.sin(angle))
  const speed = Math.sqrt(G * (1 + mass) / radius)
  return { id, name, mass, color, position, velocity: vector(-speed * Math.sin(angle), speed * Math.cos(angle)), orbitParent: 'sun', role }
}

export function ellipticalOrbitingBody(id: string, name: string, mass: number, semiMajorAxis: number, eccentricity: number, color: string, angle: number): BodySeed {
  const periapsis = semiMajorAxis * (1 - eccentricity)
  const position = vector(periapsis * Math.cos(angle), periapsis * Math.sin(angle))
  const speed = Math.sqrt(G * (1 + mass) * (1 + eccentricity) / periapsis)
  return { id, name, mass, color, position, velocity: vector(-speed * Math.sin(angle), speed * Math.cos(angle)), orbitParent: 'sun', role: 'Comet' }
}

export function createSolarSystem(): BodySeed[] {
  return centerOnBarycenter([
    { id: 'sun', name: SOLAR_SYSTEM_BODY_NAMES[0], mass: 1, color: '#f4b942', position: vector(), velocity: vector(), role: 'Star' },
    orbitingBody('mercury', SOLAR_SYSTEM_BODY_NAMES[1], toPhysicsValue(randomPlanetMassDisplay(1)), 0.3871, '#a7b0b5', 1.4, 'Planet'),
    orbitingBody('venus', SOLAR_SYSTEM_BODY_NAMES[2], toPhysicsValue(randomPlanetMassDisplay(2)), 0.7233, '#d78f56', 2.5, 'Planet'),
    orbitingBody('earth', SOLAR_SYSTEM_BODY_NAMES[3], toPhysicsValue(randomPlanetMassDisplay(3)), 1, '#3ea6a6', 3.65, 'Planet'),
    orbitingBody('mars', SOLAR_SYSTEM_BODY_NAMES[4], toPhysicsValue(randomPlanetMassDisplay(4)), 1.5237, '#cf6c4f', 4.55, 'Planet'),
    orbitingBody('jupiter', SOLAR_SYSTEM_BODY_NAMES[5], toPhysicsValue(randomPlanetMassDisplay(5)), 5.2028, '#d1ad85', 5.1, 'Planet'),
    orbitingBody('saturn', SOLAR_SYSTEM_BODY_NAMES[6], toPhysicsValue(randomPlanetMassDisplay(6)), 9.5388, '#c8bc82', 0.65, 'Planet'),
    orbitingBody('uranus', SOLAR_SYSTEM_BODY_NAMES[7], toPhysicsValue(randomPlanetMassDisplay(7)), 19.1914, '#78c8c8', 2.05, 'Planet'),
    orbitingBody('neptune', SOLAR_SYSTEM_BODY_NAMES[8], toPhysicsValue(randomPlanetMassDisplay(8)), 30.0611, '#597ed0', 3.05, 'Planet'),
  ])
}

export function createCometSystem(): BodySeed[] {
  const sun: BodySeed = { id: 'sun', name: 'Sun', mass: 1, color: '#f4b942', position: vector(), velocity: vector(), role: 'Star' }
  const planet = orbitingBody('planet', 'Planet', 3.003e-6, 1, '#3ea6a6', 1.8, 'Planet')
  return centerOnBarycenter([
    sun,
    planet,
    ellipticalOrbitingBody('swift', 'Swift', 1e-11, 0.85, 0.65, '#d78f56', 0.3),
    ellipticalOrbitingBody('ember', 'Ember', 1e-11, 2.2, 0.72, '#cf6c4f', 2.1),
    ellipticalOrbitingBody('halley', 'Halley', 1e-11, 4.8, 0.82, '#78c8c8', 4.5),
    ellipticalOrbitingBody('wanderer', 'Wanderer', 1e-11, 8, 0.88, '#a99bd2', 5.2),
  ])
}

export function createBinary(primaryMass = 1, companionMass = 0.65): BodySeed[] {
  const separation = 0.65
  const totalMass = primaryMass + companionMass
  const angularSpeed = Math.sqrt(G * totalMass / Math.pow(separation, 3))
  const primaryRadius = separation * companionMass / totalMass
  const companionRadius = separation * primaryMass / totalMass
  return centerOnBarycenter([
    { id: 'primary', name: 'Aster', mass: primaryMass, color: '#f4b942', position: vector(-primaryRadius, 0), velocity: vector(0, -primaryRadius * angularSpeed), role: 'Star' },
    { id: 'companion', name: 'Cinder', mass: companionMass, color: '#db7760', position: vector(companionRadius, 0), velocity: vector(0, companionRadius * angularSpeed), role: 'Star' },
  ])
}

export function createFigureEight(): BodySeed[] {
  // Classic equal-mass periodic solution, scaled to AU / year units.
  const velocityScale = Math.sqrt(G)
  const a = { position: vector(-0.97000436, 0.24308753), velocity: vector(0.466203685 * velocityScale, 0.43236573 * velocityScale) }
  const b = { position: vector(), velocity: vector(-0.93240737 * velocityScale, -0.86473146 * velocityScale) }
  const c = { position: scale(add(a.position, b.position), -1), velocity: scale(add(a.velocity, b.velocity), -1) }
  return [
    { id: 'alpha', name: 'Alpha', mass: 1, color: '#7fc7b5', position: a.position, velocity: a.velocity, role: 'Body' },
    { id: 'beta', name: 'Beta', mass: 1, color: '#d89a62', position: b.position, velocity: b.velocity, role: 'Body' },
    { id: 'gamma', name: 'Gamma', mass: 1, color: '#8f9edb', position: c.position, velocity: c.velocity, role: 'Body' },
  ]
}
