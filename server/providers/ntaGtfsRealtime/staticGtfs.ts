import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import AdmZip from 'adm-zip'
import { cached } from '../cache.ts'
import { insideBounds, type Bounds } from './query.ts'

export interface StaticGtfsRoute {
  routeId: string
  agencyId?: string
  shortName?: string
  longName?: string
  routeType?: string
}

export interface StaticGtfsTrip {
  tripId: string
  routeId: string
  headsign?: string
  directionId?: string
  shapeId?: string
}

export interface StaticGtfsAgency {
  agencyId?: string
  name: string
}

export interface StaticGtfsStop {
  stopId: string
  name?: string
  latitude: number
  longitude: number
}

export interface StaticGtfsStopTime {
  tripId: string
  stopId: string
  arrivalSeconds?: number
  departureSeconds?: number
  stopSequence?: number
}

export interface StaticGtfsShapePoint {
  latitude: number
  longitude: number
  sequence: number
}

export interface StaticGtfsTripStop extends StaticGtfsStopTime {
  name?: string
  latitude?: number
  longitude?: number
}

export interface StaticGtfsTripContext {
  source: StaticGtfsIndex['source']
  trip?: StaticGtfsTrip
  route?: StaticGtfsRoute
  stops: StaticGtfsTripStop[]
  shape: StaticGtfsShapePoint[]
}

export interface StaticGtfsIndex {
  source: 'configured' | 'recommended' | 'unavailable'
  routesById: Map<string, StaticGtfsRoute>
  tripsById: Map<string, StaticGtfsTrip>
  agenciesById: Map<string, StaticGtfsAgency>
  stopsById: Map<string, StaticGtfsStop>
}

export interface StaticGtfsRouteOption {
  routeId: string
  shortName?: string
  longName?: string
  operator?: string
  headsigns: string[]
}

export interface StaticGtfsStopOption {
  stopId: string
  name?: string
  latitude: number
  longitude: number
}

export interface StaticGtfsStopService {
  stopId: string
  routeId: string
  routeShortName?: string
  routeLongName?: string
  directionId?: string
  headsign?: string
  tripIds: string[]
  scheduledArrivalSeconds?: number
  scheduledTripId?: string
  stopSequence?: number
}

const ttlMs = 24 * 60 * 60 * 1000
function isBusRoute(type?: string) { return type === '3' || (Number(type) >= 700 && Number(type) < 800) }
const probeTtlMs = 6 * 60 * 60 * 1000
export const recommendedStaticGtfsUrl = 'https://www.transportforireland.ie/transitData/Data/GTFS_Realtime.zip'

export async function fetchStaticGtfsIndex(): Promise<StaticGtfsIndex> {
  return cached('nta-static-gtfs-index', ttlMs, async () => {
    const url = staticGtfsUrl()
    if (!url) return emptyIndex()
    const zip = new AdmZip(await readStaticGtfsZip(url))
    const routesById = new Map(parseCsv(zipText(zip, 'routes.txt')).flatMap((row): Array<[string, StaticGtfsRoute]> => {
      const routeId = row.route_id
      if (!routeId) return []
      return [[routeId, {
        routeId,
        agencyId: row.agency_id,
        shortName: row.route_short_name,
        longName: row.route_long_name,
        routeType: row.route_type,
      }]]
    }))
    const tripsById = new Map(parseCsv(zipText(zip, 'trips.txt')).flatMap((row): Array<[string, StaticGtfsTrip]> => {
      const tripId = row.trip_id
      const routeId = row.route_id
      if (!tripId || !routeId) return []
      return [[tripId, {
        tripId,
        routeId,
        headsign: row.trip_headsign,
        directionId: row.direction_id,
        shapeId: row.shape_id,
      }]]
    }))
    const agenciesById = new Map(parseCsv(zipText(zip, 'agency.txt')).flatMap((row): Array<[string, StaticGtfsAgency]> => {
      const name = row.agency_name
      if (!name) return []
      const agencyId = row.agency_id || 'default'
      return [[agencyId, { agencyId: row.agency_id, name }]]
    }))
    const stopsById = new Map(parseCsv(zipText(zip, 'stops.txt')).flatMap((row): Array<[string, StaticGtfsStop]> => {
      const stopId = row.stop_id
      const latitude = parseOptionalNumber(row.stop_lat)
      const longitude = parseOptionalNumber(row.stop_lon)
      if (!stopId || latitude === undefined || longitude === undefined) return []
      return [[stopId, {
        stopId,
        name: row.stop_name,
        latitude,
        longitude,
      }]]
    }))
    return { source: staticGtfsSource(), routesById, tripsById, agenciesById, stopsById }
  })
}

export async function fetchStaticGtfsRouteOptions(bounds?: Bounds): Promise<{ source: StaticGtfsIndex['source']; routes: StaticGtfsRouteOption[] }> {
  const index = await fetchStaticGtfsIndex()
  let areaRoutes: Set<string> | undefined
  if (bounds) {
    const services = await fetchStaticGtfsStopServiceIndex()
    areaRoutes = new Set([...index.stopsById.values()].filter((stop) => insideBounds(stop.longitude, stop.latitude, bounds)).flatMap((stop) => (services.get(stop.stopId) ?? []).map((service) => service.routeId)))
  }
  const headsignsByRouteId = new Map<string, Set<string>>()
  for (const trip of index.tripsById.values()) {
    if (!trip.headsign) continue
    const headsigns = headsignsByRouteId.get(trip.routeId) ?? new Set<string>()
    if (headsigns.size < 8) headsigns.add(trip.headsign)
    headsignsByRouteId.set(trip.routeId, headsigns)
  }

  return {
    source: index.source,
    routes: [...index.routesById.values()]
      .filter((route) => !areaRoutes || areaRoutes.has(route.routeId))
      .filter((route) => route.routeType === '3' || (Number(route.routeType) >= 700 && Number(route.routeType) < 800))
      .map((route) => ({
        routeId: route.routeId,
        shortName: route.shortName,
        longName: route.longName,
        operator: route.agencyId ? index.agenciesById.get(route.agencyId)?.name : index.agenciesById.get('default')?.name,
        headsigns: [...(headsignsByRouteId.get(route.routeId) ?? [])],
      }))
      .sort((left, right) => routeSortLabel(left).localeCompare(routeSortLabel(right), 'en', { numeric: true })),
  }
}

export async function fetchStaticGtfsStopOptions(): Promise<{ source: StaticGtfsIndex['source']; stops: StaticGtfsStopOption[] }> {
  const index = await fetchStaticGtfsIndex()
  const services = await fetchStaticGtfsStopServiceIndex()
  return {
    source: index.source,
    stops: [...index.stopsById.values()]
      .filter((stop) => (services.get(stop.stopId) ?? []).some((service) => isBusRoute(index.routesById.get(service.routeId)?.routeType)))
      .map((stop) => ({
        stopId: stop.stopId,
        name: stop.name,
        latitude: stop.latitude,
        longitude: stop.longitude,
      }))
      .sort((left, right) => (left.name || left.stopId).localeCompare(right.name || right.stopId, 'en', { numeric: true })),
  }
}

export async function fetchStaticGtfsStopServices(stopId: string, routeIds: string[] = [], now = new Date()): Promise<{ source: StaticGtfsIndex['source']; services: StaticGtfsStopService[] }> {
  const index = await fetchStaticGtfsIndex()
  if (!stopId || index.source === 'unavailable') return { source: index.source, services: [] }
  const routeFilter = new Set(routeIds.filter(Boolean))
  const services = await fetchStaticGtfsStopServiceIndex()
  const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
  return {
    source: index.source,
    services: (services.get(stopId) ?? [])
      .filter((service) => !routeFilter.size || routeFilter.has(service.routeId))
      .filter((service) => isBusRoute(index.routesById.get(service.routeId)?.routeType))
      .map((service) => nextScheduledStopService(service, nowSeconds))
      .sort((left, right) => (left.scheduledArrivalSeconds ?? Number.MAX_SAFE_INTEGER) - (right.scheduledArrivalSeconds ?? Number.MAX_SAFE_INTEGER)),
  }
}

export async function fetchStaticGtfsStopTimes(tripIds: Iterable<string>): Promise<Map<string, StaticGtfsStopTime[]>> {
  const targets = [...new Set([...tripIds].filter(Boolean))].sort()
  if (!targets.length) return new Map()
  const url = staticGtfsUrl()
  if (!url) return new Map()
  return cached(`nta-static-gtfs-stop-times:${createHash('sha256').update(targets.join('\n')).digest('hex').slice(0, 16)}`, ttlMs, async () => {
    const zip = new AdmZip(await readStaticGtfsZip(url))
    const stopTimesByTripId = parseStopTimesForTrips(zipText(zip, 'stop_times.txt'), new Set(targets))
    for (const stopTimes of stopTimesByTripId.values()) {
      stopTimes.sort((left, right) => (left.stopSequence ?? 0) - (right.stopSequence ?? 0))
    }
    return stopTimesByTripId
  })
}

async function fetchStaticGtfsStopServiceIndex(): Promise<Map<string, StaticGtfsStopService[]>> {
  const index = await fetchStaticGtfsIndex()
  const url = staticGtfsUrl()
  if (!url || index.source === 'unavailable') return new Map()
  return cached('nta-static-gtfs-stop-service-index:v2', ttlMs, async () => {
    const zip = new AdmZip(await readStaticGtfsZip(url))
    return parseStopServices(zipText(zip, 'stop_times.txt'), index)
  })
}

export async function fetchStaticGtfsTripContext(tripId: string): Promise<StaticGtfsTripContext> {
  const index = await fetchStaticGtfsIndex()
  const trip = index.tripsById.get(tripId)
  const route = trip?.routeId ? index.routesById.get(trip.routeId) : undefined
  const stopTimes = (await fetchStaticGtfsStopTimes([tripId])).get(tripId) ?? []
  const stops = stopTimes.map((stopTime) => {
    const stop = index.stopsById.get(stopTime.stopId)
    return {
      ...stopTime,
      name: stop?.name,
      latitude: stop?.latitude,
      longitude: stop?.longitude,
    }
  })
  const shape = trip?.shapeId ? await fetchStaticGtfsShape(trip.shapeId) : []
  return { source: index.source, trip, route, stops, shape }
}

export async function fetchStaticGtfsShape(shapeId: string): Promise<StaticGtfsShapePoint[]> {
  const url = staticGtfsUrl()
  if (!url || !shapeId) return []
  return cached(`nta-static-gtfs-shape:${createHash('sha256').update(shapeId).digest('hex').slice(0, 16)}`, ttlMs, async () => {
    const zip = new AdmZip(await readStaticGtfsZip(url))
    return parseShapesForShapeId(zipText(zip, 'shapes.txt'), shapeId)
      .sort((left, right) => left.sequence - right.sequence)
  })
}

export async function probeRecommendedStaticGtfs() {
  return cached('nta-static-gtfs-recommended-probe', probeTtlMs, async () => {
    const response = await fetch(recommendedStaticGtfsUrl, { method: 'HEAD' })
    if (!response.ok) throw new Error(`recommended NTA static GTFS responded ${response.status}`)
    return {
      url: recommendedStaticGtfsUrl,
      reachable: true,
      contentType: response.headers.get('content-type') ?? undefined,
      contentLength: parseOptionalNumber(response.headers.get('content-length') ?? undefined),
      lastModified: response.headers.get('last-modified') ?? undefined,
    }
  })
}

function emptyIndex(): StaticGtfsIndex {
  return {
    source: 'unavailable',
    routesById: new Map(),
    tripsById: new Map(),
    agenciesById: new Map(),
    stopsById: new Map(),
  }
}

export function staticGtfsUrl() {
  return process.env.NTA_GTFS_STATIC_URL?.trim()
    || (process.env.NTA_DISABLE_RECOMMENDED_STATIC_GTFS?.trim() === '1' ? undefined : recommendedStaticGtfsUrl)
}

function staticGtfsSource(): StaticGtfsIndex['source'] {
  return process.env.NTA_GTFS_STATIC_URL?.trim() ? 'configured' : 'recommended'
}

async function readStaticGtfsZip(url: string) {
  const cachePath = staticGtfsCachePath(url)
  if (await isFreshCacheEntry(cachePath)) return await readFile(cachePath)

  const response = await fetch(url, { headers: { accept: 'application/zip, application/octet-stream' } })
  if (!response.ok) throw new Error(`NTA static GTFS responded ${response.status}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  await mkdir(cacheDirectory(), { recursive: true })
  const temporaryPath = `${cachePath}.${process.pid}.tmp`
  await writeFile(temporaryPath, buffer)
  await rename(temporaryPath, cachePath)
  return buffer
}

async function isFreshCacheEntry(path: string) {
  try {
    const details = await stat(path)
    return Date.now() - details.mtimeMs < ttlMs
  } catch {
    return false
  }
}

function staticGtfsCachePath(url: string) {
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 16)
  return join(cacheDirectory(), `nta-static-gtfs-${hash}.zip`)
}

function cacheDirectory() {
  return process.env.ATLASOPS_CACHE_DIR?.trim() || join(process.cwd(), '.atlasops-cache')
}

function zipText(zip: AdmZip, name: string) {
  const entry = zip.getEntry(name)
  if (!entry) return ''
  return entry.getData().toString('utf8')
}

function parseCsv(text: string): Array<Record<string, string>> {
  const rows = parseCsvRows(text)
  const headers = rows.shift()
  if (!headers) return []
  return rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])))
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let value = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]
    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        value += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(value)
      value = ''
    } else if (char === '\n') {
      row.push(value)
      rows.push(row)
      row = []
      value = ''
    } else if (char !== '\r') {
      value += char
    }
  }

  if (value || row.length) {
    row.push(value)
    rows.push(row)
  }
  return rows
}

function parseOptionalNumber(value: string | undefined) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseGtfsTime(value: string | undefined) {
  if (!value) return undefined
  const [hours, minutes, seconds] = value.split(':').map(Number)
  if (![hours, minutes, seconds].every(Number.isFinite)) return undefined
  return hours * 3600 + minutes * 60 + seconds
}

function routeSortLabel(route: StaticGtfsRouteOption) {
  return route.shortName || route.longName || route.routeId
}

function parseStopTimesForTrips(text: string, targetTripIds: Set<string>) {
  const stopTimesByTripId = new Map<string, StaticGtfsStopTime[]>()
  const lines = text.split(/\r?\n/)
  const headers = lines.shift()?.split(',') ?? []
  const tripIdIndex = headers.indexOf('trip_id')
  const arrivalIndex = headers.indexOf('arrival_time')
  const departureIndex = headers.indexOf('departure_time')
  const stopIdIndex = headers.indexOf('stop_id')
  const stopSequenceIndex = headers.indexOf('stop_sequence')
  if (tripIdIndex < 0 || stopIdIndex < 0) return stopTimesByTripId

  for (const line of lines) {
    if (!line) continue
    const columns = line.split(',')
    const tripId = columns[tripIdIndex]
    if (!targetTripIds.has(tripId)) continue
    const stopId = columns[stopIdIndex]
    if (!stopId) continue
    const stopTimes = stopTimesByTripId.get(tripId) ?? []
    stopTimes.push({
      tripId,
      stopId,
      arrivalSeconds: parseGtfsTime(columns[arrivalIndex]),
      departureSeconds: parseGtfsTime(columns[departureIndex]),
      stopSequence: parseOptionalNumber(columns[stopSequenceIndex]),
    })
    stopTimesByTripId.set(tripId, stopTimes)
  }
  return stopTimesByTripId
}

function parseStopServices(text: string, index: StaticGtfsIndex) {
  const byStopId = new Map<string, Map<string, StaticGtfsStopService & { arrivals: Array<{ seconds: number; tripId: string; stopSequence?: number }> }>>()
  const lines = text.split(/\r?\n/)
  const headers = lines.shift()?.split(',') ?? []
  const tripIdIndex = headers.indexOf('trip_id')
  const arrivalIndex = headers.indexOf('arrival_time')
  const stopIdIndex = headers.indexOf('stop_id')
  const stopSequenceIndex = headers.indexOf('stop_sequence')
  if (tripIdIndex < 0 || arrivalIndex < 0 || stopIdIndex < 0) return new Map<string, StaticGtfsStopService[]>()

  for (const line of lines) {
    if (!line) continue
    const columns = line.split(',')
    const tripId = columns[tripIdIndex]
    const stopId = columns[stopIdIndex]
    const arrivalSeconds = parseGtfsTime(columns[arrivalIndex])
    if (!tripId || !stopId || arrivalSeconds === undefined) continue
    const trip = index.tripsById.get(tripId)
    if (!trip) continue
    const route = index.routesById.get(trip.routeId)
    const key = [trip.routeId, trip.directionId ?? '', trip.headsign ?? ''].join('|')
    const stopServices = byStopId.get(stopId) ?? new Map()
    const service = stopServices.get(key) ?? {
      stopId,
      routeId: trip.routeId,
      routeShortName: route?.shortName,
      routeLongName: route?.longName,
      directionId: trip.directionId,
      headsign: trip.headsign,
      tripIds: [],
      arrivals: [],
    }
    if (!service.tripIds.includes(tripId)) service.tripIds.push(tripId)
    service.arrivals.push({
      seconds: arrivalSeconds,
      tripId,
      stopSequence: parseOptionalNumber(columns[stopSequenceIndex]),
    })
    stopServices.set(key, service)
    byStopId.set(stopId, stopServices)
  }

  const result = new Map<string, StaticGtfsStopService[]>()
  for (const [stopId, services] of byStopId.entries()) {
    result.set(stopId, [...services.values()].map((service) => {
      service.arrivals.sort((left, right) => left.seconds - right.seconds)
      return service
    }))
  }
  return result
}

function nextScheduledStopService(
  service: StaticGtfsStopService & { arrivals?: Array<{ seconds: number; tripId: string; stopSequence?: number }> },
  nowSeconds: number,
): StaticGtfsStopService {
  const arrivals = service.arrivals ?? []
  const nextArrival = arrivals.find((arrival) => arrival.seconds >= nowSeconds) ?? arrivals[0]
  return {
    stopId: service.stopId,
    routeId: service.routeId,
    routeShortName: service.routeShortName,
    routeLongName: service.routeLongName,
    directionId: service.directionId,
    headsign: service.headsign,
    tripIds: service.tripIds,
    scheduledArrivalSeconds: nextArrival?.seconds,
    scheduledTripId: nextArrival?.tripId,
    stopSequence: nextArrival?.stopSequence,
  }
}

function parseShapesForShapeId(text: string, targetShapeId: string): StaticGtfsShapePoint[] {
  const points: StaticGtfsShapePoint[] = []
  const lines = text.split(/\r?\n/)
  const headers = lines.shift()?.split(',') ?? []
  const shapeIdIndex = headers.indexOf('shape_id')
  const latitudeIndex = headers.indexOf('shape_pt_lat')
  const longitudeIndex = headers.indexOf('shape_pt_lon')
  const sequenceIndex = headers.indexOf('shape_pt_sequence')
  if (shapeIdIndex < 0 || latitudeIndex < 0 || longitudeIndex < 0 || sequenceIndex < 0) return points

  for (const line of lines) {
    if (!line) continue
    const columns = line.split(',')
    if (columns[shapeIdIndex] !== targetShapeId) continue
    const latitude = parseOptionalNumber(columns[latitudeIndex])
    const longitude = parseOptionalNumber(columns[longitudeIndex])
    const sequence = parseOptionalNumber(columns[sequenceIndex])
    if (latitude === undefined || longitude === undefined || sequence === undefined) continue
    points.push({ latitude, longitude, sequence })
  }
  return points
}
