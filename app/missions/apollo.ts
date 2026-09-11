import apolloData from '../data/apollo11.json'
import { sampleTrack } from '../utils/ephemeris'
import { createLocalReplay } from '../utils/local-replay'
import { AU_KM } from '../utils/units'
import { toDay } from '../utils/time'
import { cross, dot, unit } from '../physics/vector3'

// Face the Earth–Moon orbital plane at the lunar orbit insertion.
const lunarState = sampleTrack(apolloData.states.moon, toDay('1969-07-19T17:27:48Z'))
const right = unit(lunarState.position3D)
const normal = unit(cross(lunarState.position3D, lunarState.velocity3D))
const up = cross(normal, right)
const project = (p: number[]) => ({ x: dot(p, right), y: dot(p, up) })
export const apolloReplay = createLocalReplay(apolloData, {
  body: 'apollo11', name: 'Apollo 11', color: '#83bffa', distanceLabel: 'Distance to Earth',
  bodies: [
    { id: 'earth', name: 'Earth', mass: 3.003e-6, color: '#3ea6a6', role: 'Planet', radiusKm: 6378 },
    { id: 'moon', name: 'Moon', mass: 3.694e-8, color: '#bec8cf', role: 'Moon', radiusKm: 1737 },
    { id: 'apollo11', name: 'Apollo 11', mass: 2e-26, color: '#83bffa', role: 'Spacecraft' },
  ],
  views: [
    { id: 'system', label: 'Earth–Moon', frame: 'EARTH–MOON / ORBITAL PLANE', extent: 250000 / AU_KM, center: { x: 200000 / AU_KM, y: 0 }, project },
    { id: 'moon', label: 'Lunar orbit', frame: 'MOON / ORBITAL PLANE', extent: 4500 / AU_KM, center: { x: 0, y: 0 }, project: (p, day) => {
      const moon = sampleTrack(apolloData.states.moon, day).position3D
      return project(p.map((x,i) => x - moon[i]!))
    } },
  ],
  events: [
    { label: 'Translunar injection', date: apolloData.start },
    { label: 'Lunar orbit insertion', date: '1969-07-19T17:21:50.4Z' },
    { label: 'Lunar orbit circularization', date: '1969-07-19T21:43:36.8Z' },
    { label: 'Eagle lands', date: '1969-07-20T20:17:43Z' },
    { label: 'First steps on the Moon', date: '1969-07-21T02:56:15Z' },
    { label: 'Eagle liftoff', date: '1969-07-21T17:54:00Z' },
    { label: 'Rendezvous and docking', date: '1969-07-21T21:35:00Z' },
    { label: 'Transearth injection', date: '1969-07-22T04:55:42.3Z' },
    { label: 'Earth entry', date: apolloData.end },
  ],
  source: { label: 'NASA Apollo 11 mission report', url: 'https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf' },
  markerEvents: ['Lunar orbit insertion', 'Transearth injection'],
  note: 'Educational reconstruction of Apollo 11’s Columbia trajectory, anchored to NASA mission-report states with JPL Moon positions. Lunar orbit, coasts and burns are simplified. Eagle’s landing, first steps and liftoff are timeline milestones; its separate descent and ascent are not modeled. Replay runs from translunar injection to Earth entry, before atmospheric descent and splashdown.',
  inspectorNote: 'Follow Apollo 11 to lunar orbit and back to Earth. Switch to Lunar orbit for a close-up. The track follows Columbia while Armstrong and Aldrin explore the surface in Eagle. Distances and speeds are approximate and Earth-relative.',
})
