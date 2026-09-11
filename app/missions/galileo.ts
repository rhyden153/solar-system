import * as galileo from '../utils/galileo'
import type { MissionReplay } from './types'

export const galileoReplay: MissionReplay = {
  bodies: [
    { id: 'sun', name: 'Sun', mass: 1, color: '#f4b942', role: 'Star' },
    { id: 'venus', name: 'Venus', mass: 2.447e-6, color: '#d78f56', orbitParent: 'sun', role: 'Planet' },
    { id: 'earth', name: 'Earth', mass: 3.003e-6, color: '#3ea6a6', orbitParent: 'sun', role: 'Planet' },
    { id: 'gaspra', name: '951 Gaspra', mass: 1.2e-15, color: '#aaa49d', orbitParent: 'sun', role: 'Asteroid' },
    { id: 'ida', name: '243 Ida', mass: 2.1e-14, color: '#c0a684', orbitParent: 'sun', role: 'Asteroid' },
    { id: 'jupiter', name: 'Jupiter', mass: 0.0009543, color: '#d1ad85', orbitParent: 'sun', role: 'Planet' },
    { id: 'galileo', name: 'Galileo Orbiter', mass: 1.12e-27, color: '#e9c580', orbitParent: 'sun', role: 'Spacecraft' },
    { id: 'probe', name: 'Atmospheric Probe', mass: 1.7e-28, color: '#ff8f70', orbitParent: 'sun', role: 'Spacecraft' },
  ],
  tracks: galileo.galileoTracks,
  start: galileo.galileoStart,
  years: galileo.galileoYears,
  date: galileo.galileoDate,
  dateToYears: galileo.galileoDateToYears,
  sample: (id, years) => galileo.sampleGalileoBody(id as galileo.GalileoBodyId, years),
  available: (id, years) => galileo.isGalileoBodyAvailable(id as galileo.GalileoBodyId, years),
  selectedBody: 'galileo',
  missions: galileo.galileoMissions,
  markerEvents: ['Venus flyby', 'Earth flyby 1', 'Gaspra flyby', 'Earth flyby 2', 'Ida flyby', 'Jupiter arrival'],
  hiddenBodyLabels: ['probe'],
  source: { label: 'NASA Galileo mission', url: 'https://science.nasa.gov/mission/galileo/' },
  distanceLabel: 'Distance to Sun',
  note: 'JPL reconstructed trajectories. The atmospheric probe appears after its July 1995 release and ends at Jupiter entry; the orbiter replay ends at arrival.',
  inspectorNote: 'Galileo reaches Jupiter by flying past Venus, Earth twice, and asteroids Gaspra and Ida. The atmospheric probe separates five months before arrival. The map projects the J2000 trajectory onto the orbital plane; distance and speed retain all three dimensions.',
}
