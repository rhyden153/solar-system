import type { sampleTrack } from '../utils/ephemeris'

export type MissionReplay = {
  tracks: Record<string, number[][]>
  bodies: { id: string; name: string; mass: number; color: string; role: string; radiusKm?: number; orbitParent?: string; referencePosition?: number[] }[]
  views?: { id: string; label: string; frame: string; extent: number; center: { x: number; y: number }; project: (position: number[], day: number) => { x: number; y: number }; tracks: Record<string, { x: number; y: number }[]> }[]
  source?: { label: string; url: string }
  distanceLabel?: string
  trailDays?: number
  routeDays?: number
  showTime?: boolean
  markerEvents?: string[]
  hiddenBodyLabels?: string[]
  start: number
  years: number
  date: (years: number) => string
  dateToYears: (date: string) => number
  sample: (id: string, years: number) => ReturnType<typeof sampleTrack>
  available: (id: string, years: number) => boolean
  selectedBody: string
  missions: { id: string; name: string; color: string; events: { label: string; date: string; years: number }[] }[]
  note: string
  inspectorNote: string
}
