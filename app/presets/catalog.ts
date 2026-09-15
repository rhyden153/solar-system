import type { Preset } from '../physics/types'
import { vector } from '../physics/vector'
import { createSolarSystem, createCometSystem, createBinary, createFigureEight } from './initial-conditions'
import type { MissionReplay } from '../missions/types'
import { createReplayBodies } from '../missions/playback'

function missionPreset(definition: Omit<Preset, 'createBodies' | 'replay' | 'loadReplay'>, load: () => Promise<MissionReplay>): Preset {
  let pending: Promise<MissionReplay> | undefined
  const preset: Preset = {
    ...definition,
    loadReplay() {
      // Share in-flight requests and successful loads; allow retries after failures.
      pending ??= load().then(replay => {
        preset.replay = replay
        return replay
      }).catch(error => {
        pending = undefined
        throw error
      })
      return pending
    },
    createBodies() {
      if (!preset.replay) throw new Error(`Mission ${preset.id} has not loaded`)
      return createReplayBodies(preset.replay)
    }
  }
  return preset
}

export function createPresetCatalog(binaryMasses: () => [number, number]): Preset[] {
  return [
  missionPreset({ id: 'voyager1', name: 'Voyager 1 & 2', category: 'MISSION REPLAY', summary: 'Two paths / four giant planets', description: 'Follow both Voyagers from Earth to interstellar space: Voyager 1 via Jupiter and Saturn, Voyager 2 onward past Uranus and Neptune. A shared, dated JPL replay projected onto the orbital plane.', bodies: '11 bodies', dt: 0.002, viewScale: 12, focusBody: 'sun', guides: [1, 5.2, 9.54, 19.19, 30.06].map(radius => ({ center: vector(), radius, color: '#3c5a68' })) }, () => import('../missions/voyager').then(module => module.voyagerReplay)),
  missionPreset({ id: 'galileo', name: 'Galileo: Journey to Jupiter', category: 'MISSION REPLAY', summary: 'Three assists / two asteroids / Jupiter', description: 'Follow Galileo from Earth past Venus, Earth twice, Gaspra, and Ida to Jupiter. At probe release, a second trajectory continues independently into the giant planet’s atmosphere.', bodies: '8 bodies', dt: 0.001, viewScale: 6, focusBody: 'sun', guides: [0.7233, 1, 5.2028].map(radius => ({ center: vector(), radius, color: '#3c5a68' })) }, () => import('../missions/galileo').then(module => module.galileoReplay)),
  missionPreset({ id: 'cassini', name: 'Cassini: Grand Finale', category: 'MISSION REPLAY', summary: '22 loops / Saturn’s rings', description: 'Watch Cassini weave between Saturn and its rings, pass Titan, and begin its final atmospheric descent.', bodies: '4 bodies', dt: 0.02 / 365.25, viewScale: 1, focusBody: 'saturn', guides: [] }, () => import('../missions/cassini').then(module => module.cassiniReplay)),
  missionPreset({ id: 'rosetta', name: 'Rosetta: Comet Rendezvous', category: 'MISSION REPLAY', summary: 'Comet 67P / close maneuvers', description: 'Follow Rosetta from its triangular approach maneuvers through close comet orbits, distant excursions, and its final descent to Comet 67P.', bodies: '2 bodies', dt: 0.04 / 365.25, viewScale: 1, focusBody: 'comet67p', guides: [] }, () => import('../missions/rosetta').then(module => module.rosettaReplay)),
  missionPreset({ id: 'apollo11', name: 'Apollo 11: First Moon Landing', category: 'MISSION RECONSTRUCTION', summary: 'Lunar orbit / first Moon landing', description: 'Follow Columbia to lunar orbit and home, with milestones for Eagle’s landing and humanity’s first steps on the Moon. An educational reconstruction anchored to NASA’s Apollo 11 mission report.', bodies: '3 bodies', dt: 120 / (365.25 * 86400), viewScale: 1, focusBody: 'earth', guides: [] }, () => import('../missions/apollo').then(module => module.apolloReplay)),
  missionPreset({ id: 'webb', name: 'James Webb: Around L2', category: 'MISSION REPLAY', summary: 'Earth departure / halo orbit', description: 'See Webb leave Earth and loop near L2. A view rotating with the Sun–Earth direction reveals the shape of its halo orbit.', bodies: '3 bodies', dt: 0.2 / 365.25, viewScale: 1, focusBody: 'earth', guides: [] }, () => import('../missions/webb').then(module => module.webbReplay)),
  { id: 'solar', name: 'Solar System', category: 'REFERENCE', summary: '1 star / 8 planets', description: 'A planar reference system with circularized starting orbits and randomized planet masses.', bodies: '9 bodies', dt: 0.002, viewScale: 12, focusBody: 'sun', guides: [0.3871, 0.7233, 1, 1.5237, 5.2028, 9.5388, 19.1914, 30.0611].map((radius) => ({ center: vector(), radius, color: '#3c5a68' })), createBodies: createSolarSystem },
  { id: 'comets', name: 'Comet Season', category: 'ECCENTRIC ORBITS', summary: '1 star / 1 planet / 4 comets', description: 'A planet circles its star while four comets return on eccentric paths with different orbital periods.', bodies: '6 bodies', dt: 0.002, viewScale: 28, focusBody: 'planet', systemFocusBody: 'sun', guides: [], createBodies: createCometSystem },
  { id: 'binary', name: 'Binary Stars', category: 'TWO BODY', summary: '2 stars / shared center', description: 'Two stars circle their shared center of mass. Adjust their relative masses to see their orbital sizes and speeds change.', bodies: '2 bodies', dt: 0.0005, viewScale: 570, guides: [], inspectorNote: 'The heavier star stays closer to the shared center of mass. Changing either relative mass starts a new circular orbit at the same separation.', createBodies: () => createBinary(...binaryMasses()) },
  { id: 'figure-eight', name: 'Figure Eight', category: 'PERIODIC ORBIT', summary: '3 bodies / one repeating curve', description: 'Three equal masses chase one another around a figure eight, forming a repeating gravitational choreography.', bodies: '3 bodies', dt: 0.0005, viewScale: 210, guides: [], trailPoints: 700, inspectorNote: 'This special three-body solution uses equal masses and carefully chosen starting velocities. The three colored bodies share the same figure-eight path.', createBodies: createFigureEight },
]
}
