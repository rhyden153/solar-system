import { dateToYears, formatMissionDate } from './time'
import data from '../data/voyagers.json'
import { sampleTrack } from './ephemeris'

export const voyagerTracks = data.states
export type VoyagerBodyId = keyof typeof voyagerTracks
export const missionStart = voyagerTracks.voyager2[0]![0]!
export const missionEnd = Math.min(voyagerTracks.voyager1.at(-1)![0]!, voyagerTracks.voyager2.at(-1)![0]!)
export const missionYears = (missionEnd - missionStart) / 365.25
export const voyagerMissions = [
  { id: 'voyager1', name: 'Voyager 1', color: '#f2e5a2', events: [
    { label: 'Earth departure', date: '1977-09-06' },
    { label: 'Jupiter flyby', date: '1979-03-05' },
    { label: 'Saturn flyby', date: '1980-11-12' },
    { label: 'Pale Blue Dot', date: '1990-02-14' },
    { label: 'Interstellar space', date: '2012-08-25' },
    { label: '2026 endpoint', date: data.end },
  ] },
  { id: 'voyager2', name: 'Voyager 2', color: '#e99bdb', events: [
    { label: 'Earth departure', date: '1977-08-21' },
    { label: 'Jupiter flyby', date: '1979-07-09' },
    { label: 'Saturn flyby', date: '1981-08-25' },
    { label: 'Uranus flyby', date: '1986-01-24' },
    { label: 'Neptune flyby', date: '1989-08-25' },
    { label: 'Interstellar space', date: '2018-11-05' },
    { label: '2026 endpoint', date: data.end },
  ] },
] as const
export function isVoyagerBodyAvailable(id: VoyagerBodyId, years: number) {
  return missionStart + years * 365.25 >= voyagerTracks[id][0]![0]!
}
export function dateToMissionYears(date: string) {
  return dateToYears(date, missionStart)
}
export function missionDate(years: number) {
  return formatMissionDate(missionStart, years)
}

export function sampleVoyagerBody(id: VoyagerBodyId, years: number) {
  return sampleTrack(voyagerTracks[id], missionStart + years * 365.25)
}
