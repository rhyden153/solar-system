import rosettaData from '../data/rosetta.json'
import { createLocalReplay } from '../utils/local-replay'
import { AU_KM } from '../utils/units'
const xy = (p: number[]) => ({ x: p[0]!, y: p[1]! })
const origin = { x: 0, y: 0 }
export const rosettaReplay = createLocalReplay(rosettaData, {
  body: 'rosetta', name: 'Rosetta', color: '#8ccfc0', distanceLabel: 'Distance to comet',
  bodies: [
    { id: 'comet67p', name: 'Comet 67P', mass: 5e-18, color: '#a9a49c', role: 'Comet', radiusKm: 2 },
    { id: 'rosetta', name: 'Rosetta', mass: 1.5e-27, color: '#8ccfc0', role: 'Spacecraft' },
  ],
  views: [
    { id: 'close', label: 'Comet close-up', frame: 'COMET 67P / ECLIPTIC', extent: 160 / AU_KM, center: origin, project: xy },
    { id: 'system', label: 'Full excursion', frame: 'COMET 67P / ECLIPTIC', extent: 1600 / AU_KM, center: origin, project: xy },
  ],
  events: [
    { label: 'Comet rendezvous', date: rosettaData.start },
    { label: 'Mapping orbit', date: '2014-09-10T00:00:00Z' },
    { label: 'Philae landing day', date: '2014-11-12T15:34:00Z' },
    { label: 'Comet perihelion', date: '2015-08-13T00:00:00Z' },
    { label: 'Final descent', date: '2016-09-29T20:50:00Z' },
    { label: 'Comet touchdown', date: rosettaData.end },
  ],
  trailDays: 14, routeDays: 30,
  note: 'ESA’s mission navigation solutions via JPL, using the mission-specific Comet 67P reference. The guide previews the next 30 days and the bright trail shows the last 14 days. Philae’s separate descent is not plotted.',
  inspectorNote: 'Watch Rosetta’s triangular approach maneuvers become close comet orbits. Full excursion reveals the distant science excursions. The comet is a schematic marker; distance and speed are measured from its center.',
})
