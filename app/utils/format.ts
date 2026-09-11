import { AU_KM, DAYS_PER_YEAR, SECONDS_PER_DAY, toDisplayValue } from './units'

export function formatReplaySpeed(speed: number) {
  const kmS = speed * AU_KM / (DAYS_PER_YEAR * SECONDS_PER_DAY)
  return kmS < 0.1 ? `${(kmS * 1000).toFixed(2)} m / s` : `${kmS.toFixed(2)} km / s`
}
export function formatYears(value: number) { return value < 1 ? `${value.toFixed(3)} yr` : `${value.toFixed(2)} yr` }
export function formatMass(value: number) {
  const displayValue = toDisplayValue(value)
  return displayValue >= 0.01 ? `${displayValue.toFixed(3)} M_sun` : `${displayValue.toExponential(2)} M_sun`
}
export function formatBodyListMass(value: number) {
  const displayValue = toDisplayValue(value)
  return displayValue >= 0.01 ? displayValue.toFixed(2) : displayValue.toExponential(1)
}
export function formatCoordinate(value: number) { return toDisplayValue(value).toFixed(4) }
export function formatDistance(value: number) { return value < 0.01 ? `${(value * AU_KM).toFixed(0)} km` : `${value.toFixed(3)} AU` }
