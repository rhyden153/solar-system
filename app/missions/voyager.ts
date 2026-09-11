import * as voyager from '../utils/voyager'
import type { MissionReplay } from './types'

export const voyagerReplay: MissionReplay = {
  bodies: [
    { id: 'sun', name: 'Sun', mass: 1, color: '#f4b942', role: 'Star' },
    { id: 'mercury', name: 'Mercury', mass: 1.66e-7, color: '#a7b0b5', orbitParent: 'sun', role: 'Planet' },
    { id: 'venus', name: 'Venus', mass: 2.447e-6, color: '#d78f56', orbitParent: 'sun', role: 'Planet' },
    { id: 'earth', name: 'Earth', mass: 3.003e-6, color: '#3ea6a6', orbitParent: 'sun', role: 'Planet' },
    { id: 'mars', name: 'Mars', mass: 3.227e-7, color: '#cf6c4f', orbitParent: 'sun', role: 'Planet' },
    { id: 'jupiter', name: 'Jupiter', mass: 0.0009543, color: '#d1ad85', orbitParent: 'sun', role: 'Planet' },
    { id: 'saturn', name: 'Saturn', mass: 0.0002857, color: '#c8bc82', orbitParent: 'sun', role: 'Planet' },
    { id: 'uranus', name: 'Uranus', mass: 0.00004365, color: '#78c8c8', orbitParent: 'sun', role: 'Planet' },
    { id: 'neptune', name: 'Neptune', mass: 0.00005149, color: '#597ed0', orbitParent: 'sun', role: 'Planet' },
    { id: 'voyager1', name: 'Voyager 1', mass: 3.6e-28, color: '#f2e5a2', orbitParent: 'sun', role: 'Spacecraft' },
    { id: 'voyager2', name: 'Voyager 2', mass: 3.6e-28, color: '#e99bdb', orbitParent: 'sun', role: 'Spacecraft' },
  ],

  tracks: voyager.voyagerTracks, start: voyager.missionStart, years: voyager.missionYears,
  date: voyager.missionDate, dateToYears: voyager.dateToMissionYears,
  sample: (id, years) => voyager.sampleVoyagerBody(id as voyager.VoyagerBodyId, years),
  available: (id, years) => voyager.isVoyagerBodyAvailable(id as voyager.VoyagerBodyId, years),
  selectedBody: 'voyager2',
  missions: voyager.voyagerMissions.map(mission => ({ ...mission, events: mission.events.map(event => ({ ...event, years: voyager.dateToMissionYears(event.date) })) })),
  note: 'Early flybys are approximate. Each spacecraft appears the day after its launch; later positions include predictions.',
  inspectorNote: 'Historical trajectory replay with fixed masses. Distance and speed use all three dimensions; the map projects onto the orbital plane. Voyager 1 heads above this plane after Saturn; Voyager 2 heads below it after Neptune.',
}
