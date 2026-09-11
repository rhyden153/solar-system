import data from '../data/galileo.json'
import { sampleTrack } from './ephemeris'
import { dateToYears, formatMissionDate } from './time'

export const galileoTracks = data.states
export type GalileoBodyId = keyof typeof galileoTracks
export const galileoStart = galileoTracks.galileo[0]![0]!
export const galileoEnd = galileoTracks.galileo.at(-1)![0]!
export const galileoYears = (galileoEnd - galileoStart) / 365.25

export function galileoDateToYears(date: string) {
  return dateToYears(date, galileoStart)
}

export function galileoDate(years: number) {
  return formatMissionDate(galileoStart, years)
}

export function sampleGalileoBody(id: GalileoBodyId, years: number) {
  return sampleTrack(galileoTracks[id], galileoStart + years * 365.25)
}

export function isGalileoBodyAvailable(id: GalileoBodyId, years: number) {
  return galileoStart + years * 365.25 >= galileoTracks[id][0]![0]!
}

// Seek dated encounters to the closest separation, to the nearest minute.
function encounterYears(date: string, craft: 'galileo' | 'probe', target: Exclude<GalileoBodyId, 'galileo' | 'probe'>) {
  const start = galileoDateToYears(date)
  let closest = Infinity
  let years = start
  for (let minute = 0; minute < 1440; minute++) {
    const time = start + minute / (1440 * 365.25)
    const spacecraft = sampleGalileoBody(craft, time)
    const body = sampleGalileoBody(target, time)
    const distance = Math.hypot(spacecraft.position.x - body.position.x, spacecraft.position.y - body.position.y, spacecraft.height - body.height)
    if (distance < closest) { closest = distance; years = time }
  }
  return years
}

const orbiterEvents = [
  { label: 'Earth departure', date: data.start },
  { label: 'Venus flyby', date: '1990-02-10', target: 'venus' },
  { label: 'Earth flyby 1', date: '1990-12-08', target: 'earth' },
  { label: 'Gaspra flyby', date: '1991-10-29', target: 'gaspra' },
  { label: 'Earth flyby 2', date: '1992-12-08', target: 'earth' },
  { label: 'Ida flyby', date: '1993-08-28', target: 'ida' },
  { label: 'Probe release', date: '1995-07-13T05:31:00Z' },
  { label: 'Jupiter arrival', date: '1995-12-07', target: 'jupiter' },
] as const

const missionEvent = (event: typeof orbiterEvents[number]) => ({
  label: event.label,
  date: event.date.slice(0, 10),
  years: event.label === 'Earth departure' ? 0 : 'target' in event ? encounterYears(event.date, 'galileo', event.target) : galileoDateToYears(event.date),
})

export const galileoMissions = [
  { id: 'galileo', name: 'Galileo Orbiter', color: '#e9c580', events: orbiterEvents.map(missionEvent) },
  { id: 'probe', name: 'Galileo Atmospheric Probe', color: '#ff8f70', events: [
    { label: 'Probe release', date: '1995-07-13', years: galileoDateToYears('1995-07-13T05:31:00Z') },
    { label: 'Atmospheric entry', date: '1995-12-07', years: encounterYears('1995-12-07', 'probe', 'jupiter') },
  ] },
]
