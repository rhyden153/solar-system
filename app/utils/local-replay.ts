import { sampleTrack } from './ephemeris'
import type { MissionReplay } from '../missions/types'

import { toDay, dateToYears, formatMissionDate } from './time'
export type MissionData = { start: string; end: string; states: Record<string, number[][]> }
type ViewSeed = Omit<NonNullable<MissionReplay['views']>[number], 'tracks'>
export function createLocalReplay(data: MissionData, options: {
  body: string
  name: string
  color: string
  bodies: NonNullable<MissionReplay['bodies']>
  views: ViewSeed[]
  events: { label: string; date: string }[]
  note: string
  inspectorNote: string
  distanceLabel: string
  trailDays?: number
  routeDays?: number
  source?: MissionReplay['source']
  markerEvents?: string[]
}): MissionReplay {
  const start = toDay(data.start)
  const years = (toDay(data.end) - start) / 365.25
  const projected = new Map<ViewSeed['project'], Record<string, { x: number; y: number }[]>>()
  return {
    ...options, start, years, tracks: data.states, selectedBody: options.body, showTime: true,
    date: value => formatMissionDate(start, value, true),
    dateToYears: date => dateToYears(date, start),
    // Horizons rounds Julian days; tolerate sub-millisecond boundary differences.
    available: (id, value) => !data.states[id] || start + value * 365.25 + 1e-8 >= data.states[id]![0]![0]!,
    sample: (id, value) => sampleTrack(data.states[id]!, start + value * 365.25),
    missions: [{ id: options.body, name: options.name, color: options.color, events: options.events.map(event => ({ label: event.label, date: event.date.replace('T', ' ').replace('Z', ' UTC'), years: (toDay(event.date) - start) / 365.25 })) }],
    views: options.views.map(view => ({
      ...view,
      get tracks() {
        let tracks = projected.get(view.project)
        if (!tracks) {
          tracks = Object.fromEntries(Object.entries(data.states).map(([id, rows]) => [
            id, rows.map(row => view.project(row.slice(1, 4), row[0]!)),
          ]))
          projected.set(view.project, tracks)
        }
        return tracks
      },
    })),
  }
}
