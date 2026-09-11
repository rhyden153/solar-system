import { mkdir, writeFile } from 'node:fs/promises'
export const AU_KM = 149597870.7
export const julianDay = date => Date.parse(date.includes('T') ? date : date + 'T00:00:00Z') / 86400000 + 2440587.5
export async function horizons(command, center, start, end, step, plane = 'ECLIPTIC', { timeType = 'UT', precision = 15, referenceSystem = 'ICRF' } = {}) {
  const params = new URLSearchParams({ format: 'json', COMMAND: `'${command}'`, EPHEM_TYPE: 'VECTORS', CENTER: center, START_TIME: `'${start.replace('T', ' ').replace('Z', '')}'`, STOP_TIME: `'${end.replace('T', ' ').replace('Z', '')}'`, STEP_SIZE: `'${step}'`, OUT_UNITS: 'AU-D', VEC_TABLE: '2', CSV_FORMAT: 'YES', REF_PLANE: plane, VEC_CORR: 'NONE' })
  // null preserves the API default used by the original Voyager dataset.
  if (timeType) params.set('TIME_TYPE', timeType)
  if (referenceSystem) params.set('REF_SYSTEM', referenceSystem)
  const response = await fetch(`https://ssd.jpl.nasa.gov/api/horizons.api?${params}`, { signal: AbortSignal.timeout(120000) })
  if (!response.ok) throw new Error(`Horizons HTTP ${response.status}`)
  const data = await response.json()
  const csv = data.result?.split('$$SOE')[1]?.split('$$EOE')[0]?.trim()
  if (!csv) throw new Error(data.error ?? data.result ?? 'Missing states')
  const rows = csv.split('\n').map(line => {
    const fields = line.split(',')
    const row = [Number(fields[0]), ...fields.slice(2, 8).map(Number)]
    if (row.length !== 7 || !row.every(Number.isFinite)) throw new Error('Invalid state vector')
    return row.map(value => Number(value.toPrecision(precision)))
  })
  return { rows, header: data.result.split('$$SOE')[0] }
}
// Later, finer samples replace coarse samples at the same timestamp.
export const mergeStates = rows => [...new Map(rows.map(row => [row[0], row])).values()].sort((a, b) => a[0] - b[0])
export async function writeDataset(id, data, provenance) {
  await mkdir(new URL('../app/data/', import.meta.url), { recursive: true })
  await writeFile(new URL(`../app/data/${id}.json`, import.meta.url), JSON.stringify({ ...data, downloaded: new Date().toISOString().slice(0, 10) }))
  await writeFile(new URL(`../app/data/${id}-horizons.txt`, import.meta.url), provenance)
}
