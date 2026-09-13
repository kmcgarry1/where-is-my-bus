import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { AtlasEtaPrediction, AtlasMovingAssetCollection } from '../../src/data/movingAsset.types.ts'

export interface VehicleObservationRecord {
  observationId: string
  provider: 'nta-gtfs-realtime'
  source: 'live' | 'fixture'
  vehicleId: string
  featureId: string
  tripId?: string
  routeId?: string
  routeLabel?: string
  longitude: number
  latitude: number
  bearing?: number
  speed?: number
  observedAt: string
  recordedAt: string
  scheduleStatus?: string
  scheduleDeviationSeconds?: number
  nextStopId?: string
  currentStopSequence?: number
  scheduleRelationship?: string
  providerArrival?: string
}

export interface ObservedStopArrivalRecord {
  arrivalId: string
  source: 'next-stop-transition'
  vehicleId: string
  featureId: string
  tripId: string
  routeId?: string
  routeLabel?: string
  stopId: string
  stopSequence?: number
  scheduledArrival?: string
  providerPredictedArrival?: string
  observedArrival: string
  recordedAt: string
  scheduleDeviationSeconds?: number
  confidence: 'medium' | 'low'
}

export interface JourneySegmentRecord {
  segmentId: string
  vehicleId: string
  tripId: string
  routeId?: string
  routeLabel?: string
  fromStopId: string
  toStopId: string
  fromStopSequence?: number
  toStopSequence?: number
  departedAt: string
  arrivedAt: string
  durationSeconds: number
  recordedAt: string
  scheduleDeviationSeconds?: number
}

export interface EtaPredictionRecord {
  predictionId: string
  predictorVersion: string
  status: AtlasEtaPrediction['status']
  method: AtlasEtaPrediction['method']
  confidence: AtlasEtaPrediction['confidence']
  createdAt: string
  vehicleId: string
  tripId?: string
  routeId?: string
  targetStopId?: string
  predictedArrival?: string
  scheduledArrival?: string
  providerArrival?: string
  estimatedTravelSeconds?: number
  distanceRemainingMeters?: number
  scheduleDeviationSeconds?: number
  evidence: AtlasEtaPrediction['evidence']
}

export interface VehicleObservationQuery {
  vehicleId?: string
  routeId?: string
  tripId?: string
  since?: string
  until?: string
  limit?: number
}

export interface PredictionQuery {
  vehicleId?: string
  routeId?: string
  tripId?: string
  targetStopId?: string
  since?: string
  until?: string
  limit?: number
}

export interface StopArrivalQuery extends VehicleObservationQuery {
  stopId?: string
}

export interface JourneySegmentQuery extends VehicleObservationQuery {
  fromStopId?: string
  toStopId?: string
}

const observationFileName = 'vehicle-observations.jsonl'
const predictionFileName = 'eta-predictions.jsonl'
const stopArrivalFileName = 'observed-stop-arrivals.jsonl'
const journeySegmentFileName = 'journey-segments.jsonl'
const defaultLimit = 500
const maxLimit = 5000
const recentObservationKeys = new Map<string, string>()
const previousObservationByVehicleId = new Map<string, VehicleObservationRecord>()
const previousArrivalByTripVehicle = new Map<string, ObservedStopArrivalRecord>()
let writeQueue = Promise.resolve()

export async function recordVehicleSnapshot(
  collection: AtlasMovingAssetCollection,
  source: 'live' | 'fixture',
  recordedAt = new Date().toISOString(),
) {
  const records = collection.features.flatMap((feature): VehicleObservationRecord[] => {
    const [longitude, latitude] = feature.geometry.coordinates
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return []
    const vehicleId = feature.properties.vehicleId ?? feature.properties.id
    const duplicateKey = [
      feature.properties.observedAt,
      longitude.toFixed(6),
      latitude.toFixed(6),
      feature.properties.tripId ?? '',
      feature.properties.routeId ?? '',
    ].join('|')
    if (recentObservationKeys.get(vehicleId) === duplicateKey) return []
    recentObservationKeys.set(vehicleId, duplicateKey)

    return [{
      observationId: `${feature.properties.provider}:${vehicleId}:${feature.properties.observedAt}`,
      provider: feature.properties.provider,
      source,
      vehicleId,
      featureId: feature.properties.id,
      tripId: feature.properties.tripId,
      routeId: feature.properties.routeId,
      routeLabel: feature.properties.routeLabel,
      longitude,
      latitude,
      bearing: feature.properties.bearing,
      speed: feature.properties.speed,
      observedAt: feature.properties.observedAt,
      recordedAt,
      scheduleStatus: feature.properties.scheduleStatus,
      scheduleDeviationSeconds: feature.properties.scheduleDeviationSeconds,
      nextStopId: stringValue(feature.properties.sourceProperties.nextStopId),
      currentStopSequence: numberValue(feature.properties.sourceProperties.currentStopSequence),
      scheduleRelationship: stringValue(feature.properties.sourceProperties.scheduleRelationship),
      providerArrival: stringValue(feature.properties.sourceProperties.providerArrival),
    }]
  })

  await appendJsonl(observationPath(), records)
  const derived = deriveStopArrivals(records, recordedAt)
  await appendJsonl(stopArrivalPath(), derived.arrivals)
  await appendJsonl(journeySegmentPath(), derived.segments)
  return {
    recordedObservationCount: records.length,
    recordedStopArrivalCount: derived.arrivals.length,
    recordedJourneySegmentCount: derived.segments.length,
    recordedAt,
  }
}

export async function recordEtaPrediction(prediction: AtlasEtaPrediction, predictorVersion = 'baseline-v1') {
  const record: EtaPredictionRecord = {
    predictionId: crypto.randomUUID(),
    predictorVersion,
    status: prediction.status,
    method: prediction.method,
    confidence: prediction.confidence,
    createdAt: prediction.calculatedAt,
    vehicleId: prediction.vehicleId,
    tripId: prediction.tripId,
    routeId: prediction.routeId,
    targetStopId: prediction.stopId,
    predictedArrival: prediction.predictedArrival,
    scheduledArrival: prediction.scheduledArrival,
    providerArrival: prediction.providerArrival,
    estimatedTravelSeconds: prediction.estimatedTravelSeconds,
    distanceRemainingMeters: prediction.distanceRemainingMeters,
    scheduleDeviationSeconds: prediction.scheduleDeviationSeconds,
    evidence: prediction.evidence,
  }
  await appendJsonl(predictionPath(), [record])
  return record
}

export async function vehicleObservations(query: VehicleObservationQuery = {}) {
  return filterByTimeAndLimit(await readJsonl<VehicleObservationRecord>(observationPath()), query, (record) => {
    return (!query.vehicleId || record.vehicleId === query.vehicleId || record.featureId === query.vehicleId)
      && (!query.routeId || record.routeId === query.routeId || record.routeLabel === query.routeId)
      && (!query.tripId || record.tripId === query.tripId)
  }, (record) => record.observedAt)
}

export async function etaPredictions(query: PredictionQuery = {}) {
  return filterByTimeAndLimit(await readJsonl<EtaPredictionRecord>(predictionPath()), query, (record) => {
    return (!query.vehicleId || record.vehicleId === query.vehicleId)
      && (!query.routeId || record.routeId === query.routeId)
      && (!query.tripId || record.tripId === query.tripId)
      && (!query.targetStopId || record.targetStopId === query.targetStopId)
  }, (record) => record.createdAt)
}

export async function observedStopArrivals(query: StopArrivalQuery = {}) {
  return filterByTimeAndLimit(await readJsonl<ObservedStopArrivalRecord>(stopArrivalPath()), query, (record) => {
    return (!query.vehicleId || record.vehicleId === query.vehicleId || record.featureId === query.vehicleId)
      && (!query.routeId || record.routeId === query.routeId || record.routeLabel === query.routeId)
      && (!query.tripId || record.tripId === query.tripId)
      && (!query.stopId || record.stopId === query.stopId)
  }, (record) => record.observedArrival)
}

export async function journeySegments(query: JourneySegmentQuery = {}) {
  return filterByTimeAndLimit(await readJsonl<JourneySegmentRecord>(journeySegmentPath()), query, (record) => {
    return (!query.vehicleId || record.vehicleId === query.vehicleId)
      && (!query.routeId || record.routeId === query.routeId || record.routeLabel === query.routeId)
      && (!query.tripId || record.tripId === query.tripId)
      && (!query.fromStopId || record.fromStopId === query.fromStopId)
      && (!query.toStopId || record.toStopId === query.toStopId)
  }, (record) => record.arrivedAt)
}

export async function vehicleObservationSummary(query: VehicleObservationQuery = {}) {
  const records = await vehicleObservations({ ...query, limit: maxLimit })
  const vehicles = new Set(records.map((record) => record.vehicleId))
  const routes = new Set(records.flatMap((record) => record.routeId ? [record.routeId] : []))
  const trips = new Set(records.flatMap((record) => record.tripId ? [record.tripId] : []))
  const delays = records.flatMap((record) => typeof record.scheduleDeviationSeconds === 'number' ? [record.scheduleDeviationSeconds] : [])
  return {
    observationCount: records.length,
    vehicleCount: vehicles.size,
    routeCount: routes.size,
    tripCount: trips.size,
    firstObservedAt: records.at(0)?.observedAt,
    lastObservedAt: records.at(-1)?.observedAt,
    averageScheduleDeviationSeconds: delays.length
      ? Math.round(delays.reduce((total, value) => total + value, 0) / delays.length)
      : undefined,
  }
}

export async function stopArrivalSummary(query: StopArrivalQuery = {}) {
  const records = await observedStopArrivals({ ...query, limit: maxLimit })
  const vehicles = new Set(records.map((record) => record.vehicleId))
  const routes = new Set(records.flatMap((record) => record.routeId ? [record.routeId] : []))
  const trips = new Set(records.map((record) => record.tripId))
  const stops = new Set(records.map((record) => record.stopId))
  const deviations = records.flatMap((record) => typeof record.scheduleDeviationSeconds === 'number' ? [record.scheduleDeviationSeconds] : [])
  return {
    arrivalCount: records.length,
    vehicleCount: vehicles.size,
    routeCount: routes.size,
    tripCount: trips.size,
    stopCount: stops.size,
    firstObservedArrival: records.at(0)?.observedArrival,
    lastObservedArrival: records.at(-1)?.observedArrival,
    averageScheduleDeviationSeconds: deviations.length
      ? Math.round(deviations.reduce((total, value) => total + value, 0) / deviations.length)
      : undefined,
  }
}

export async function journeySegmentSummary(query: JourneySegmentQuery = {}) {
  const records = await journeySegments({ ...query, limit: maxLimit })
  const durations = records.map((record) => record.durationSeconds).filter(Number.isFinite)
  return {
    segmentCount: records.length,
    firstArrivedAt: records.at(0)?.arrivedAt,
    lastArrivedAt: records.at(-1)?.arrivedAt,
    medianDurationSeconds: median(durations),
    p10DurationSeconds: percentile(durations, 0.1),
    p90DurationSeconds: percentile(durations, 0.9),
  }
}

function deriveStopArrivals(records: VehicleObservationRecord[], recordedAt: string) {
  const arrivals: ObservedStopArrivalRecord[] = []
  const segments: JourneySegmentRecord[] = []
  for (const current of [...records].sort((left, right) => Date.parse(left.observedAt) - Date.parse(right.observedAt))) {
    const previous = previousObservationByVehicleId.get(current.vehicleId)
    previousObservationByVehicleId.set(current.vehicleId, current)
    if (!previous || !previous.tripId || !current.tripId || previous.tripId !== current.tripId) continue
    if (!previous.nextStopId || previous.nextStopId === current.nextStopId) continue

    const sequenceAdvanced = previous.currentStopSequence === undefined
      || current.currentStopSequence === undefined
      || current.currentStopSequence >= previous.currentStopSequence
    if (!sequenceAdvanced) continue

    const observedArrival = current.observedAt
    const arrival: ObservedStopArrivalRecord = {
      arrivalId: `${current.vehicleId}:${current.tripId}:${previous.nextStopId}:${observedArrival}`,
      source: 'next-stop-transition',
      vehicleId: current.vehicleId,
      featureId: current.featureId,
      tripId: current.tripId,
      routeId: current.routeId ?? previous.routeId,
      routeLabel: current.routeLabel ?? previous.routeLabel,
      stopId: previous.nextStopId,
      stopSequence: previous.currentStopSequence,
      scheduledArrival: scheduledArrivalFromDeviation(observedArrival, previous.scheduleDeviationSeconds),
      providerPredictedArrival: previous.providerArrival,
      observedArrival,
      recordedAt,
      scheduleDeviationSeconds: previous.scheduleDeviationSeconds,
      confidence: previous.currentStopSequence !== undefined && current.currentStopSequence !== undefined ? 'medium' : 'low',
    }
    arrivals.push(arrival)

    const previousArrivalKey = `${arrival.vehicleId}:${arrival.tripId}`
    const previousArrival = previousArrivalByTripVehicle.get(previousArrivalKey)
    previousArrivalByTripVehicle.set(previousArrivalKey, arrival)
    const segment = previousArrival ? journeySegmentFromArrivals(previousArrival, arrival, recordedAt) : undefined
    if (segment) segments.push(segment)
  }
  return { arrivals, segments }
}

function journeySegmentFromArrivals(
  from: ObservedStopArrivalRecord,
  to: ObservedStopArrivalRecord,
  recordedAt: string,
): JourneySegmentRecord | undefined {
  if (from.stopId === to.stopId) return undefined
  if (from.stopSequence !== undefined && to.stopSequence !== undefined && to.stopSequence <= from.stopSequence) return undefined
  const durationSeconds = Math.round((Date.parse(to.observedArrival) - Date.parse(from.observedArrival)) / 1000)
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 3 * 3600) return undefined
  return {
    segmentId: `${to.vehicleId}:${to.tripId}:${from.stopId}:${to.stopId}:${to.observedArrival}`,
    vehicleId: to.vehicleId,
    tripId: to.tripId,
    routeId: to.routeId ?? from.routeId,
    routeLabel: to.routeLabel ?? from.routeLabel,
    fromStopId: from.stopId,
    toStopId: to.stopId,
    fromStopSequence: from.stopSequence,
    toStopSequence: to.stopSequence,
    departedAt: from.observedArrival,
    arrivedAt: to.observedArrival,
    durationSeconds,
    recordedAt,
    scheduleDeviationSeconds: to.scheduleDeviationSeconds,
  }
}

function filterByTimeAndLimit<T>(
  records: T[],
  query: { since?: string; until?: string; limit?: number },
  predicate: (record: T) => boolean,
  timestamp: (record: T) => string,
) {
  const sinceMs = query.since ? Date.parse(query.since) : Number.NEGATIVE_INFINITY
  const untilMs = query.until ? Date.parse(query.until) : Number.POSITIVE_INFINITY
  const limit = Math.max(1, Math.min(maxLimit, query.limit ?? defaultLimit))
  return records
    .filter((record) => {
      const time = Date.parse(timestamp(record))
      return Number.isFinite(time) && time >= sinceMs && time <= untilMs && predicate(record)
    })
    .sort((left, right) => Date.parse(timestamp(left)) - Date.parse(timestamp(right)))
    .slice(-limit)
}

function appendJsonl<T>(path: string, records: T[]) {
  if (!records.length) return Promise.resolve()
  writeQueue = writeQueue.then(async () => {
    await mkdir(dataDirectory(), { recursive: true })
    await writeFile(path, `${records.map((record) => JSON.stringify(record)).join('\n')}\n`, { flag: 'a' })
  })
  return writeQueue
}

async function readJsonl<T>(path: string): Promise<T[]> {
  try {
    const text = await readFile(path, 'utf8')
    return text.split(/\r?\n/).flatMap((line) => {
      if (!line.trim()) return []
      try {
        return [JSON.parse(line) as T]
      } catch {
        return []
      }
    })
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'ENOENT') return []
    throw error
  }
}

function dataDirectory() {
  return process.env.ATLASOPS_DATA_DIR?.trim() || join(process.cwd(), '.atlasops-data')
}

function observationPath() {
  return join(dataDirectory(), observationFileName)
}

function predictionPath() {
  return join(dataDirectory(), predictionFileName)
}

function stopArrivalPath() {
  return join(dataDirectory(), stopArrivalFileName)
}

function journeySegmentPath() {
  return join(dataDirectory(), journeySegmentFileName)
}

function scheduledArrivalFromDeviation(observedArrival: string, deviationSeconds: number | undefined) {
  if (deviationSeconds === undefined) return undefined
  return new Date(Date.parse(observedArrival) - deviationSeconds * 1000).toISOString()
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value ? value : undefined
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function median(values: number[]) {
  return percentile(values, 0.5)
}

function percentile(values: number[], ratio: number) {
  if (!values.length) return undefined
  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.max(0, Math.min(sorted.length - 1, Math.round((sorted.length - 1) * ratio)))
  return sorted[index]
}
