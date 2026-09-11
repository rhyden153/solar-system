import { DAYS_PER_YEAR, SECONDS_PER_DAY } from './units'
const UNIX_EPOCH_JULIAN_DAY = 2440587.5
export const toDay = (date: string) => Date.parse(date.includes('T') ? date : date + 'T00:00:00Z') / (SECONDS_PER_DAY * 1000) + UNIX_EPOCH_JULIAN_DAY
export const dateToYears = (date: string, start: number) => (toDay(date) - start) / DAYS_PER_YEAR
export function formatMissionDate(start: number, years: number, showTime = false) {
  const milliseconds = (start + years * DAYS_PER_YEAR - UNIX_EPOCH_JULIAN_DAY) * SECONDS_PER_DAY * 1000
  const iso = new Date(showTime ? Math.round(milliseconds / 1000) * 1000 : milliseconds).toISOString()
  return showTime ? iso.slice(0, 16).replace('T', ' ') + ' UTC' : iso.slice(0, 10)
}
