import { ringFlattening } from '../rendering/saturn'
import cassiniData from '../data/cassini.json'
import { createLocalReplay } from '../utils/local-replay'
import { AU_KM } from '../utils/units'
import { cross, dot, radians, unit } from '../physics/vector3'
// Saturn's approximate J2000 north pole; view the ring plane from 18 degrees above it.
const pole = [Math.cos(radians(83.537)) * Math.cos(radians(40.589)), Math.cos(radians(83.537)) * Math.sin(radians(40.589)), Math.sin(radians(83.537))]
const right = unit(cross([0, 0, 1], pole))
const alongRings = cross(pole, right)
const saturnProject = (p: number[]) => ({ x: dot(p, right), y: dot(p, pole) * Math.cos(radians(18)) + dot(p, alongRings) * ringFlattening })
const origin = { x: 0, y: 0 }
export const cassiniReplay = createLocalReplay(cassiniData, {
  body: 'cassini', name: 'Cassini', color: '#e9c580', distanceLabel: 'Distance to Saturn',
  bodies: [
    { id: 'saturn', name: 'Saturn', mass: 0.0002857, color: '#d9bd80', role: 'Planet', radiusKm: 60268 },
    { id: 'titan', name: 'Titan', mass: 6.76e-8, color: '#e5a55d', role: 'Moon', radiusKm: 2575 },
    { id: 'enceladus', name: 'Enceladus', mass: 5.4e-11, color: '#b8e0eb', role: 'Moon', radiusKm: 252 },
    { id: 'cassini', name: 'Cassini', mass: 1e-27, color: '#e9c580', role: 'Spacecraft' },
  ],
  views: [
    { id: 'system', label: 'Saturn system', frame: 'SATURN / TILTED RING VIEW', extent: 1350000 / AU_KM, center: origin, project: saturnProject },
    { id: 'rings', label: 'Ring dives', frame: 'SATURN / RING CLOSE-UP', extent: 180000 / AU_KM, center: origin, project: saturnProject },
  ],
  events: [
    { label: 'Grand Finale begins', date: cassiniData.start },
    { label: 'First ring dive', date: '2017-04-26T09:00:00Z' },
    { label: 'Saturn solstice', date: '2017-05-24T00:00:00Z' },
    { label: 'Halfway through', date: '2017-06-29T00:00:00Z' },
    { label: 'Titan farewell', date: '2017-09-11T19:04:00Z' },
    { label: 'Atmospheric entry', date: cassiniData.end },
  ],
  trailDays: 7,
  note: 'JPL’s final mission reconstruction. The replay ends at atmospheric entry. The complete route is shown faintly; the bright trail shows the last seven days.',
  inspectorNote: 'Cassini makes 22 loops through the gap between Saturn and its rings. Switch to Ring dives for a closer look. Distances and speeds are relative to Saturn; the tilted projection preserves the north–south motion.',
})
