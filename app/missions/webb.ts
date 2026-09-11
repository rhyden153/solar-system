import webbData from '../data/webb.json'
import { sampleTrack } from '../utils/ephemeris'
import { createLocalReplay } from '../utils/local-replay'
import { AU_KM } from '../utils/units'
import { dot, radians, unit } from '../physics/vector3'
const webbProject = (p: number[], day: number) => {
  const sun = sampleTrack(webbData.states.sun, day).position3D
  const outward = unit([-sun[0]!, -sun[1]!, 0])
  const sideways = [-outward[1]!, outward[0]!, 0]
  return { x: dot(p, outward), y: dot(p, sideways) * Math.cos(radians(30)) + p[2]! * Math.sin(radians(30)) }
}
export const webbReplay = createLocalReplay(webbData, {
  body: 'webb', name: 'James Webb', color: '#b5a0ed', distanceLabel: 'Distance to Earth',
  bodies: [
    { id: 'earth', name: 'Earth', mass: 3.003e-6, color: '#3ea6a6', role: 'Planet', radiusKm: 6378 },
    { id: 'moon', name: 'Moon', mass: 3.694e-8, color: '#bec8cf', role: 'Moon', radiusKm: 1737 },
    { id: 'webb', name: 'James Webb', mass: 3.1e-27, color: '#b5a0ed', role: 'Spacecraft' },
  ],
  views: [
    { id: 'system', label: 'Earth–L2', frame: 'ROTATING SUN–EARTH / TILTED VIEW', extent: 1100000 / AU_KM, center: { x: 800000 / AU_KM, y: 0 }, project: webbProject },
    { id: 'halo', label: 'Halo close-up', frame: 'ROTATING SUN–EARTH / L2', extent: 800000 / AU_KM, center: { x: 1500000 / AU_KM, y: 0 }, project: webbProject },
  ],
  events: [
    { label: 'Earth departure', date: webbData.start },
    { label: 'Sunshield deployed', date: '2022-01-04T00:00:00Z' },
    { label: 'Halo orbit insertion', date: '2022-01-24T19:05:00Z' },
    { label: 'First images released', date: '2022-07-12T00:00:00Z' },
    { label: 'One year at L2', date: webbData.end },
  ],
  note: 'Reconstructed JPL trajectory covering departure and the first year at L2. The view rotates with the Sun–Earth direction; the L2 cross is an approximate reference point, not a physical body.',
  inspectorNote: 'Webb loops near L2 while Earth travels around the Sun. This rotating, tilted view makes the halo visible. Distance and speed are Earth-relative inertial values; the Sun is offscreen to the left.',
})
