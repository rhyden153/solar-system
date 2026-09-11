export const AU_KM = 149597870.7
export const DAYS_PER_YEAR = 365.25
export const SECONDS_PER_DAY = 86400
export const DISPLAY_VALUE_SCALE = 10000
export const toDisplayValue = (value: number) => value * DISPLAY_VALUE_SCALE
export const toPhysicsValue = (value: number) => Number(value) / DISPLAY_VALUE_SCALE
