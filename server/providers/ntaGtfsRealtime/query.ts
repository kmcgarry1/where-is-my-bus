export type Bounds = [number, number, number, number]

export function parseBounds(value: string | null): Bounds | undefined {
  if (!value) return undefined
  const parts = value.split(',').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part)))
    throw new Error('bounds must contain west,south,east,north')
  const [west, south, east, north] = parts as Bounds
  if (
    west < -180 ||
    east > 180 ||
    south < -90 ||
    north > 90 ||
    west > east ||
    south > north
  )
    throw new Error('Invalid bounds')
  return [west, south, east, north]
}

export function insideBounds(
  longitude: number,
  latitude: number,
  bounds?: Bounds,
): boolean {
  return (
    !bounds ||
    (longitude >= bounds[0] &&
      longitude <= bounds[2] &&
      latitude >= bounds[1] &&
      latitude <= bounds[3])
  )
}

export function matchesQuery(
  query: string,
  values: Array<string | undefined>,
): boolean {
  const normalized = values
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  return query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .every((word) => normalized.includes(word))
}

export function queryLimit(
  value: string | null,
  fallback = 30,
  maximum = 200,
): number {
  const parsed = value === null ? fallback : Number(value)
  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed, maximum)
    : fallback
}
