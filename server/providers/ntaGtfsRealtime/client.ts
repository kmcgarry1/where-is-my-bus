import gtfsRealtimeBindings from 'gtfs-realtime-bindings'
import { cached } from '../cache.ts'
import { fetchStaticGtfsIndex, fetchStaticGtfsStopTimes, probeRecommendedStaticGtfs, recommendedStaticGtfsUrl, staticGtfsUrl, type StaticGtfsIndex, type StaticGtfsStopTime } from './staticGtfs.ts'

const { transit_realtime } = gtfsRealtimeBindings

const ttlMs = 25 * 1000
const candidateEndpoints = [
  'https://api.nationaltransport.ie/gtfsr/v2/Vehicles',
  'https://api.nationaltransport.ie/gtfsr/v2/VehiclePositions',
  'https://gtfsr.transportforireland.ie/v2/Vehicles',
  'https://gtfsr.transportforireland.ie/v2/VehiclePositions',
]
const candidateAlertEndpoints = [
  'https://api.nationaltransport.ie/gtfsr/v2/gtfsr?format=json',
  'https://api.nationaltransport.ie/gtfsr/v2/ServiceAlerts',
  'https://api.nationaltransport.ie/gtfsr/v2/Alerts',
  'https://gtfsr.transportforireland.ie/v2/ServiceAlerts',
  'https://gtfsr.transportforireland.ie/v2/Alerts',
]
const candidateTripUpdateEndpoints = [
  'https://api.nationaltransport.ie/gtfsr/v2/TripUpdates',
  'https://api.nationaltransport.ie/gtfsr/v2/TripUpdate',
  'https://gtfsr.transportforireland.ie/v2/TripUpdates',
  'https://gtfsr.transportforireland.ie/v2/TripUpdate',
]
const retryableStatuses = new Set([429, 502, 503, 504])
const scheduleEarlyThresholdSeconds = -90
const scheduleLateThresholdSeconds = 300

export interface NtaVehicleEntity {
  id: string
  vehicleId?: string
  label?: string
  licensePlate?: string
  tripId?: string
  routeId?: string
  startTime?: string
  startDate?: string
  latitude: number
  longitude: number
  bearing?: number
  speed?: number
  timestamp?: number
  currentStopSequence?: number
  stopId?: string
  currentStatus?: string
  congestionLevel?: string
  occupancyStatus?: string
  scheduleStatus?: 'early' | 'on-time' | 'late' | 'unknown'
  scheduleDeviationSeconds?: number
  scheduleSource?: 'gtfs-realtime-trip-update' | 'static-gtfs-estimate' | 'unavailable'
  providerArrival?: string
  nextStopId?: string
  nextStopName?: string
  routeShortName?: string
  routeType?: string
  routeLongName?: string
  agencyName?: string
  tripHeadsign?: string
  directionId?: string
  staticGtfsSource?: StaticGtfsIndex['source']
}

export interface NtaTripUpdateEntity {
  id: string
  tripId?: string
  routeId?: string
  vehicleId?: string
  timestamp?: number
  delay?: number
  arrivalTime?: number
  departureTime?: number
  stopId?: string
  stopSequence?: number
}

export interface NtaServiceAlertEntity {
  id: string
  cause?: string
  effect?: string
  header?: string
  description?: string
  url?: string
  activePeriods: Array<{ start?: number; end?: number }>
  routeIds: string[]
  stopIds: string[]
  tripIds: string[]
  stopName?: string
  latitude?: number
  longitude?: number
  staticGtfsSource?: StaticGtfsIndex['source']
}

export async function fetchNtaVehiclePositions(): Promise<{ vehicles: NtaVehicleEntity[]; source: 'live' | 'fixture'; fetchedAt: string }> {
  return cached('nta-gtfs-realtime-vehicles', ttlMs, async () => {
    const key = ntaApiKey()
    if (!key) return fixtureSnapshot()

    const errors: string[] = []
    for (const endpoint of endpointsFromEnv()) {
      try {
        const vehicles = await enrichVehicles(await fetchVehicleEndpoint(endpoint, key), await fetchTripUpdatesBestEffort(key))
        return { vehicles, source: 'live', fetchedAt: new Date().toISOString() }
      } catch (error) {
        errors.push(`${endpoint}: ${errorSummary(error)}`)
      }
    }
    throw new Error(`NTA GTFS-Realtime vehicle feed failed. ${errors.join(' | ')}`)
  })
}

export async function fetchNtaServiceAlerts(): Promise<{ alerts: NtaServiceAlertEntity[]; source: 'live' | 'fixture'; fetchedAt: string }> {
  return cached('nta-gtfs-realtime-alerts', 60 * 1000, async () => {
    const key = ntaApiKey()
    if (!key) return fixtureAlertSnapshot()

    const errors: string[] = []
    for (const endpoint of alertEndpointsFromEnv()) {
      try {
        const alerts = await enrichAlerts(await fetchAlertEndpoint(endpoint, key))
        return { alerts, source: 'live', fetchedAt: new Date().toISOString() }
      } catch (error) {
        errors.push(`${endpoint}: ${errorSummary(error)}`)
      }
    }
    throw new Error(`NTA GTFS-Realtime alerts feed failed. ${errors.join(' | ')}`)
  })
}

export async function ntaDiagnostics() {
  const keyInfo = ntaApiKeyInfo()
  const effectiveStaticGtfsUrl = staticGtfsUrl()
  let staticGtfs
  let recommendedStaticGtfs
  try {
    const index = await fetchStaticGtfsIndex()
    staticGtfs = {
      configured: Boolean(process.env.NTA_GTFS_STATIC_URL?.trim()),
      defaultRecommended: !process.env.NTA_GTFS_STATIC_URL?.trim() && effectiveStaticGtfsUrl === recommendedStaticGtfsUrl,
      source: index.source,
      routeCount: index.routesById.size,
      tripCount: index.tripsById.size,
      agencyCount: index.agenciesById.size,
      stopCount: index.stopsById.size,
    }
  } catch (error) {
    staticGtfs = {
      configured: Boolean(process.env.NTA_GTFS_STATIC_URL?.trim()),
      defaultRecommended: !process.env.NTA_GTFS_STATIC_URL?.trim() && effectiveStaticGtfsUrl === recommendedStaticGtfsUrl,
      source: 'unavailable' as const,
      error: error instanceof Error ? error.message : 'Static GTFS check failed',
    }
  }
  try {
    recommendedStaticGtfs = await probeRecommendedStaticGtfs()
  } catch (error) {
    recommendedStaticGtfs = {
      url: recommendedStaticGtfsUrl,
      reachable: false,
      error: error instanceof Error ? error.message : 'Recommended static GTFS probe failed',
    }
  }

  return {
    realtime: {
      keyConfigured: keyInfo.configured,
      keyEnvName: keyInfo.envName,
      mode: keyInfo.configured ? 'live' : 'fixture',
      vehicleEndpointOverride: Boolean(process.env.NTA_VEHICLE_POSITIONS_URL?.trim()),
      serviceAlertEndpointOverride: Boolean(process.env.NTA_SERVICE_ALERTS_URL?.trim()),
      tripUpdateEndpointOverride: Boolean(process.env.NTA_TRIP_UPDATES_URL?.trim()),
      vehicleEndpoints: endpointsFromEnv(),
      serviceAlertEndpoints: alertEndpointsFromEnv(),
      tripUpdateEndpoints: tripUpdateEndpointsFromEnv(),
    },
    staticGtfs,
    recommendedStaticGtfs,
  }
}

function endpointsFromEnv() {
  const configured = process.env.NTA_VEHICLE_POSITIONS_URL?.trim()
  return configured ? [configured] : candidateEndpoints
}

function alertEndpointsFromEnv() {
  const configured = process.env.NTA_SERVICE_ALERTS_URL?.trim()
  return configured ? [configured] : candidateAlertEndpoints
}

function tripUpdateEndpointsFromEnv() {
  const configured = process.env.NTA_TRIP_UPDATES_URL?.trim()
  return configured ? [configured] : candidateTripUpdateEndpoints
}

function ntaApiKey() {
  return ntaApiKeyInfo().value
}

function ntaApiKeyInfo() {
  const candidates = [
    ['NTA_API_KEY', process.env.NTA_API_KEY],
    ['NTA_GTFSR_API_KEY', process.env.NTA_GTFSR_API_KEY],
    ['TFI_API_KEY', process.env.TFI_API_KEY],
  ] as const
  const match = candidates.find(([, value]) => value?.trim())
  return {
    configured: Boolean(match),
    envName: match?.[0],
    value: match?.[1]?.trim(),
  }
}

async function fetchVehicleEndpoint(endpoint: string, key: string) {
  const response = await fetchWithRetry(endpoint, {
    headers: {
      'Cache-Control': 'no-cache',
      'Ocp-Apim-Subscription-Key': key,
      'x-api-key': key,
    },
  })
  if (!response.ok) throw new Error(`responded ${response.status}`)
  const buffer = new Uint8Array(await response.arrayBuffer())
  const feed = transit_realtime.FeedMessage.decode(buffer)
  return feed.entity.flatMap((entity): NtaVehicleEntity[] => {
    const vehicle = entity.vehicle
    const position = vehicle?.position
    if (!vehicle || !position || !Number.isFinite(position.latitude) || !Number.isFinite(position.longitude)) return []
    return [{
      id: entity.id,
      vehicleId: optionalString(vehicle.vehicle?.id),
      label: optionalString(vehicle.vehicle?.label),
      licensePlate: optionalString(vehicle.vehicle?.licensePlate),
      tripId: optionalString(vehicle.trip?.tripId),
      routeId: optionalString(vehicle.trip?.routeId),
      startTime: optionalString(vehicle.trip?.startTime),
      startDate: optionalString(vehicle.trip?.startDate),
      latitude: position.latitude,
      longitude: position.longitude,
      bearing: finiteNumber(position.bearing),
      speed: finiteNumber(position.speed),
      timestamp: finiteNumber(vehicle.timestamp),
      currentStopSequence: finiteNumber(vehicle.currentStopSequence),
      stopId: optionalString(vehicle.stopId),
      currentStatus: vehicle.currentStatus === undefined ? undefined : String(vehicle.currentStatus),
      congestionLevel: vehicle.congestionLevel === undefined ? undefined : String(vehicle.congestionLevel),
      occupancyStatus: vehicle.occupancyStatus === undefined ? undefined : String(vehicle.occupancyStatus),
    }]
  })
}

async function fetchAlertEndpoint(endpoint: string, key: string) {
  const response = await fetchWithRetry(endpoint, {
    headers: {
      'Cache-Control': 'no-cache',
      'Ocp-Apim-Subscription-Key': key,
      'x-api-key': key,
    },
  })
  if (!response.ok) throw new Error(`responded ${response.status}`)
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return normalizeJsonAlerts(await response.json())
  }
  const buffer = new Uint8Array(await response.arrayBuffer())
  const feed = transit_realtime.FeedMessage.decode(buffer)
  return feed.entity.flatMap((entity): NtaServiceAlertEntity[] => {
    const alert = entity.alert
    if (!alert) return []
    return [{
      id: entity.id,
      cause: alert.cause === undefined ? undefined : String(alert.cause),
      effect: alert.effect === undefined ? undefined : String(alert.effect),
      header: translatedText(alert.headerText),
      description: translatedText(alert.descriptionText),
      url: translatedText(alert.url),
      activePeriods: (alert.activePeriod ?? []).map((period) => ({
        start: finiteNumber(period.start),
        end: finiteNumber(period.end),
      })),
      routeIds: (alert.informedEntity ?? []).flatMap((entity) => presentString(entity.routeId)),
      stopIds: (alert.informedEntity ?? []).flatMap((entity) => presentString(entity.stopId)),
      tripIds: (alert.informedEntity ?? []).flatMap((entity) => presentString(entity.trip?.tripId)),
    }]
  })
}

async function fetchTripUpdatesBestEffort(key: string) {
  const errors: string[] = []
  for (const endpoint of tripUpdateEndpointsFromEnv()) {
    try {
      return await fetchTripUpdateEndpoint(endpoint, key)
    } catch (error) {
      errors.push(`${endpoint}: ${errorSummary(error)}`)
    }
  }
  return []
}

async function fetchTripUpdateEndpoint(endpoint: string, key: string) {
  const response = await fetchWithRetry(endpoint, {
    headers: {
      'Cache-Control': 'no-cache',
      'Ocp-Apim-Subscription-Key': key,
      'x-api-key': key,
    },
  })
  if (!response.ok) throw new Error(`responded ${response.status}`)
  const buffer = new Uint8Array(await response.arrayBuffer())
  const feed = transit_realtime.FeedMessage.decode(buffer)
  return feed.entity.flatMap((entity): NtaTripUpdateEntity[] => {
    const tripUpdate = entity.tripUpdate
    if (!tripUpdate) return []
    const stopUpdate = (tripUpdate.stopTimeUpdate ?? []).find((update) => {
      const delay = finiteNumber(update.arrival?.delay) ?? finiteNumber(update.departure?.delay)
      return delay !== undefined
    }) ?? tripUpdate.stopTimeUpdate?.[0]
    return [{
      id: entity.id,
      tripId: optionalString(tripUpdate.trip?.tripId),
      routeId: optionalString(tripUpdate.trip?.routeId),
      vehicleId: optionalString(tripUpdate.vehicle?.id),
      timestamp: finiteNumber(tripUpdate.timestamp),
      delay: finiteNumber(stopUpdate?.arrival?.delay) ?? finiteNumber(stopUpdate?.departure?.delay),
      arrivalTime: finiteNumber(stopUpdate?.arrival?.time),
      departureTime: finiteNumber(stopUpdate?.departure?.time),
      stopId: optionalString(stopUpdate?.stopId),
      stopSequence: finiteNumber(stopUpdate?.stopSequence),
    }]
  })
}

async function fetchWithRetry(endpoint: string, init: RequestInit, attempts = 2) {
  let latest: Response | undefined
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    latest = await fetch(endpoint, init)
    if (!retryableStatuses.has(latest.status) || attempt === attempts - 1) return latest
    await sleep(retryDelayMs(latest))
  }
  return latest as Response
}

function retryDelayMs(response: Response) {
  const retryAfter = response.headers.get('retry-after')
  const seconds = retryAfter ? Number(retryAfter) : NaN
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, 5000)
  return 5000
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function normalizeJsonAlerts(feed: unknown): NtaServiceAlertEntity[] {
  if (!isRecord(feed) || !Array.isArray(feed.entity)) return []
  return feed.entity.flatMap((entity): NtaServiceAlertEntity[] => {
    if (!isRecord(entity)) return []
    const alert = recordValue(entity, 'alert')
    if (!isRecord(alert)) return []
    const activePeriods = arrayValue(alert, 'activePeriod', 'active_period').map((period) => isRecord(period) ? {
      start: finiteNumber(recordValue(period, 'start')),
      end: finiteNumber(recordValue(period, 'end')),
    } : {})
    const informedEntities = arrayValue(alert, 'informedEntity', 'informed_entity')
    return [{
      id: stringValue(recordValue(entity, 'id')) ?? crypto.randomUUID(),
      cause: stringValue(recordValue(alert, 'cause')),
      effect: stringValue(recordValue(alert, 'effect')),
      header: translatedJsonText(recordValue(alert, 'headerText', 'header_text')),
      description: translatedJsonText(recordValue(alert, 'descriptionText', 'description_text')),
      url: translatedJsonText(recordValue(alert, 'url')),
      activePeriods,
      routeIds: informedEntities.flatMap((item) => isRecord(item) ? presentString(stringValue(recordValue(item, 'routeId', 'route_id'))) : []),
      stopIds: informedEntities.flatMap((item) => isRecord(item) ? presentString(stringValue(recordValue(item, 'stopId', 'stop_id'))) : []),
      tripIds: informedEntities.flatMap((item) => {
        if (!isRecord(item)) return []
        const trip = recordValue(item, 'trip')
        return isRecord(trip) ? presentString(stringValue(recordValue(trip, 'tripId', 'trip_id'))) : []
      }),
    }]
  })
}

function finiteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function optionalString(value: string | null | undefined) {
  return value?.trim() ? value : undefined
}

function translatedText(value: { translation?: Array<{ text?: string | null }> | null } | null | undefined) {
  return value?.translation?.find((translation) => translation.text)?.text ?? undefined
}

function presentString(value: string | null | undefined) {
  return value ? [value] : []
}

function errorSummary(error: unknown) {
  if (!(error instanceof Error)) return 'unknown error'
  const cause = error.cause
  if (isRecord(cause)) {
    const code = stringValue(recordValue(cause, 'code'))
    const hostname = stringValue(recordValue(cause, 'hostname'))
    if (code && hostname) return `${error.message} (${code} ${hostname})`
    if (code) return `${error.message} (${code})`
  }
  return error.message
}

function translatedJsonText(value: unknown) {
  if (!isRecord(value)) return undefined
  const translations = arrayValue(value, 'translation')
  for (const translation of translations) {
    if (!isRecord(translation)) continue
    const text = stringValue(recordValue(translation, 'text'))
    if (text) return text
  }
  return undefined
}

function recordValue(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (key in record) return record[key]
  }
  return undefined
}

function arrayValue(record: Record<string, unknown>, ...keys: string[]) {
  const value = recordValue(record, ...keys)
  return Array.isArray(value) ? value : []
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function fixtureSnapshot() {
  const now = new Date()
  const timestamp = Math.floor(now.getTime() / 1000)
  const vehicles: NtaVehicleEntity[] = [
    { id: 'fixture-46a-1', vehicleId: 'TFI-FIX-46A-1', label: '46A', routeId: '46A', routeShortName: '46A', routeLongName: 'Dun Laoghaire - Phoenix Park', agencyName: 'Fixture Transit', tripId: 'fixture-trip-46a', tripHeadsign: 'Phoenix Park', latitude: 53.3438, longitude: -6.2546, bearing: 320, speed: 7.2, timestamp, scheduleStatus: 'late', scheduleDeviationSeconds: 420, scheduleSource: 'gtfs-realtime-trip-update', nextStopName: 'Leeson Street Lower', staticGtfsSource: 'unavailable' },
    { id: 'fixture-145-1', vehicleId: 'TFI-FIX-145-1', label: '145', routeId: '145', routeShortName: '145', routeLongName: 'Heuston Station - Kilmacanogue', agencyName: 'Fixture Transit', tripId: 'fixture-trip-145', tripHeadsign: 'Heuston Station', latitude: 53.3337, longitude: -6.2488, bearing: 28, speed: 6.4, timestamp, scheduleStatus: 'on-time', scheduleDeviationSeconds: 45, scheduleSource: 'gtfs-realtime-trip-update', nextStopName: 'Dawson Street', staticGtfsSource: 'unavailable' },
    { id: 'fixture-g1-1', vehicleId: 'TFI-FIX-G1-1', label: 'G1', routeId: 'G1', routeShortName: 'G1', routeLongName: 'Spencer Dock - Red Cow Luas', agencyName: 'Fixture Transit', tripId: 'fixture-trip-g1', tripHeadsign: 'Spencer Dock', latitude: 53.3489, longitude: -6.3037, bearing: 92, speed: 8.1, timestamp, scheduleStatus: 'early', scheduleDeviationSeconds: -180, scheduleSource: 'gtfs-realtime-trip-update', nextStopName: 'Inchicore', staticGtfsSource: 'unavailable' },
    { id: 'fixture-15-1', vehicleId: 'TFI-FIX-15-1', label: '15', routeId: '15', routeShortName: '15', routeLongName: 'Clongriffin - Ballycullen Road', agencyName: 'Fixture Transit', tripId: 'fixture-trip-15', tripHeadsign: 'Clongriffin', latitude: 53.3172, longitude: -6.2658, bearing: 354, speed: 5.8, timestamp, scheduleStatus: 'unknown', scheduleSource: 'unavailable', staticGtfsSource: 'unavailable' },
  ]
  return { vehicles, source: 'fixture' as const, fetchedAt: now.toISOString() }
}

function fixtureAlertSnapshot() {
  const now = new Date()
  const start = Math.floor((now.getTime() - 30 * 60 * 1000) / 1000)
  const end = Math.floor((now.getTime() + 2 * 60 * 60 * 1000) / 1000)
  return {
    source: 'fixture' as const,
    fetchedAt: now.toISOString(),
    alerts: [{
      id: 'fixture-alert-route-46a',
      cause: 'UNKNOWN_CAUSE',
      effect: 'SIGNIFICANT_DELAYS',
      header: 'Fixture delay on route 46A',
      description: 'Fixture GTFS-Realtime alert used when no NTA API key is configured.',
      activePeriods: [{ start, end }],
      routeIds: ['46A'],
      stopIds: [],
      tripIds: ['fixture-trip-46a'],
      staticGtfsSource: 'unavailable' as const,
    }],
  }
}

async function enrichVehicles(vehicles: NtaVehicleEntity[], tripUpdates: NtaTripUpdateEntity[] = []): Promise<NtaVehicleEntity[]> {
  let staticIndex
  try {
    staticIndex = await fetchStaticGtfsIndex()
  } catch {
    return vehicles.map((vehicle) => enrichVehicleSchedule(vehicle, tripUpdates))
  }

  const staticFallbackStopTimes = await fetchStaticGtfsStopTimes(vehicles.flatMap((vehicle) => {
    if (!vehicle.tripId) return []
    return findTripUpdate(vehicle, tripUpdates)?.delay === undefined ? [vehicle.tripId] : []
  }))

  return vehicles.map((vehicle) => {
    const trip = vehicle.tripId ? staticIndex.tripsById.get(vehicle.tripId) : undefined
    const routeId = vehicle.routeId ?? trip?.routeId
    const route = routeId ? staticIndex.routesById.get(routeId) : undefined
    const agency = route?.agencyId ? staticIndex.agenciesById.get(route.agencyId) : staticIndex.agenciesById.get('default')
    return {
      ...vehicle,
      routeId,
      routeShortName: route?.shortName,
      routeType: route?.routeType,
      routeLongName: route?.longName,
      agencyName: agency?.name,
      tripHeadsign: trip?.headsign,
      directionId: trip?.directionId,
      staticGtfsSource: staticIndex.source,
      ...scheduleAdherence(vehicle, tripUpdates, staticIndex, staticFallbackStopTimes),
    }
  })
}

async function enrichAlerts(alerts: NtaServiceAlertEntity[]): Promise<NtaServiceAlertEntity[]> {
  let staticIndex
  try {
    staticIndex = await fetchStaticGtfsIndex()
  } catch {
    return alerts.map((alert) => ({ ...alert, staticGtfsSource: 'unavailable' }))
  }

  return alerts.map((alert) => {
    const stop = alert.stopIds.map((stopId) => staticIndex.stopsById.get(stopId)).find(Boolean)
    return {
      ...alert,
      stopName: stop?.name,
      latitude: stop?.latitude,
      longitude: stop?.longitude,
      staticGtfsSource: staticIndex.source,
    }
  })
}

function enrichVehicleSchedule(vehicle: NtaVehicleEntity, tripUpdates: NtaTripUpdateEntity[]) {
  return {
    ...vehicle,
    staticGtfsSource: 'unavailable' as const,
    ...scheduleAdherence(vehicle, tripUpdates),
  }
}

function scheduleAdherence(
  vehicle: NtaVehicleEntity,
  tripUpdates: NtaTripUpdateEntity[],
  staticIndex?: StaticGtfsIndex,
  staticStopTimes = new Map<string, StaticGtfsStopTime[]>(),
) {
  const tripUpdate = findTripUpdate(vehicle, tripUpdates)
  if (tripUpdate?.delay !== undefined) {
    return {
      scheduleStatus: scheduleStatusForDeviation(tripUpdate.delay),
      scheduleDeviationSeconds: Math.round(tripUpdate.delay),
      scheduleSource: 'gtfs-realtime-trip-update' as const,
      nextStopId: tripUpdate.stopId,
      nextStopName: tripUpdate.stopId ? staticIndex?.stopsById.get(tripUpdate.stopId)?.name : undefined,
      providerArrival: tripUpdate.arrivalTime ? new Date(tripUpdate.arrivalTime * 1000).toISOString() : undefined,
    }
  }

  const estimate = staticIndex ? estimateStaticScheduleAdherence(vehicle, staticIndex, staticStopTimes) : undefined
  if (estimate) return estimate

  return {
    scheduleStatus: 'unknown' as const,
    scheduleSource: 'unavailable' as const,
  }
}

function findTripUpdate(vehicle: NtaVehicleEntity, tripUpdates: NtaTripUpdateEntity[]) {
  if (!tripUpdates.length) return undefined
  return tripUpdates.find((update) => vehicle.tripId && update.tripId === vehicle.tripId)
    ?? tripUpdates.find((update) => vehicle.vehicleId && update.vehicleId === vehicle.vehicleId)
    ?? tripUpdates.find((update) => vehicle.routeId && vehicle.tripId && update.routeId === vehicle.routeId && update.tripId === vehicle.tripId)
}

function estimateStaticScheduleAdherence(vehicle: NtaVehicleEntity, staticIndex: StaticGtfsIndex, staticStopTimes: Map<string, StaticGtfsStopTime[]>) {
  if (!vehicle.tripId || vehicle.timestamp === undefined) return undefined
  const stopTimes = staticStopTimes.get(vehicle.tripId)
  if (!stopTimes?.length) return undefined

  const matchedStopTime = scheduledStopFromRealtimeVehicle(vehicle, stopTimes)
  const nearest = matchedStopTime
    ? scheduledStopWithDistance(vehicle, matchedStopTime, staticIndex)
    : nearestScheduledStop(vehicle, stopTimes, staticIndex)
  const maximumDistanceMeters = matchedStopTime ? 2500 : 450
  if (!nearest || nearest.distanceMeters > maximumDistanceMeters) return undefined

  const scheduledSeconds = nearest.stopTime.departureSeconds ?? nearest.stopTime.arrivalSeconds
  if (scheduledSeconds === undefined) return undefined

  const observedSeconds = serviceDaySeconds(vehicle.timestamp)
  const deviation = normalizeDeviationSeconds(observedSeconds - scheduledSeconds)
  return {
    scheduleStatus: scheduleStatusForDeviation(deviation),
    scheduleDeviationSeconds: Math.round(deviation),
    scheduleSource: 'static-gtfs-estimate' as const,
    nextStopId: nearest.stopTime.stopId,
    nextStopName: nearest.stop?.name,
  }
}

function scheduledStopFromRealtimeVehicle(vehicle: NtaVehicleEntity, stopTimes: StaticGtfsStopTime[]) {
  if (vehicle.stopId) {
    const byStopId = stopTimes.find((stopTime) => stopTime.stopId === vehicle.stopId)
    if (byStopId) return byStopId
  }
  if (vehicle.currentStopSequence !== undefined) {
    return stopTimes.find((stopTime) => stopTime.stopSequence === vehicle.currentStopSequence)
  }
  return undefined
}

function scheduledStopWithDistance(vehicle: NtaVehicleEntity, stopTime: StaticGtfsStopTime, staticIndex: StaticGtfsIndex) {
  const stop = staticIndex.stopsById.get(stopTime.stopId)
  const distanceMeters = stop
    ? haversineMeters(vehicle.latitude, vehicle.longitude, stop.latitude, stop.longitude)
    : 0
  return { stopTime, stop, distanceMeters }
}

function nearestScheduledStop(vehicle: NtaVehicleEntity, stopTimes: StaticGtfsStopTime[], staticIndex: StaticGtfsIndex) {
  let nearest: { stopTime: StaticGtfsStopTime; stop?: { name?: string; latitude: number; longitude: number }; distanceMeters: number } | undefined
  for (const stopTime of stopTimes) {
    const stop = staticIndex.stopsById.get(stopTime.stopId)
    if (!stop) continue
    const distanceMeters = haversineMeters(vehicle.latitude, vehicle.longitude, stop.latitude, stop.longitude)
    if (!nearest || distanceMeters < nearest.distanceMeters) {
      nearest = { stopTime, stop, distanceMeters }
    }
  }
  return nearest
}

function scheduleStatusForDeviation(seconds: number) {
  if (seconds <= scheduleEarlyThresholdSeconds) return 'early' as const
  if (seconds >= scheduleLateThresholdSeconds) return 'late' as const
  return 'on-time' as const
}

function serviceDaySeconds(timestamp: number) {
  const observed = new Date(timestamp * 1000)
  return observed.getHours() * 3600 + observed.getMinutes() * 60 + observed.getSeconds()
}

function normalizeDeviationSeconds(seconds: number) {
  if (seconds > 12 * 3600) return seconds - 24 * 3600
  if (seconds < -12 * 3600) return seconds + 24 * 3600
  return seconds
}

function haversineMeters(fromLatitude: number, fromLongitude: number, toLatitude: number, toLongitude: number) {
  const earthRadiusMeters = 6371000
  const deltaLatitude = degreesToRadians(toLatitude - fromLatitude)
  const deltaLongitude = degreesToRadians(toLongitude - fromLongitude)
  const fromRadians = degreesToRadians(fromLatitude)
  const toRadians = degreesToRadians(toLatitude)
  const a = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(fromRadians) * Math.cos(toRadians) * Math.sin(deltaLongitude / 2) ** 2
  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function degreesToRadians(value: number) {
  return value * Math.PI / 180
}
