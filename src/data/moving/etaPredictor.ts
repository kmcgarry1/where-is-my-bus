import type { LineString } from 'geojson'
import type {
  AtlasEtaPrediction,
  AtlasEtaPredictionConfidence,
  AtlasEtaPredictionMethod,
  AtlasMovingAssetFeature,
  AtlasTransitStopFeature,
  AtlasTripContext,
  AtlasTripContextStop,
  AtlasVehiclePositionObservation,
} from '../movingAsset.types'

const minimumUsefulSpeedMps = 0.75
const maxUsefulSpeedMps = 38
const stalePositionSeconds = 5 * 60
const oldPositionSeconds = 90
const stopPassedToleranceMeters = 20

export interface EtaPredictionContext {
  vehicle: AtlasMovingAssetFeature
  tripContext?: AtlasTripContext
  targetStopId?: string
  recentPositions: AtlasVehiclePositionObservation[]
  now: string
}

interface ProjectedPoint {
  progressMeters: number
  distanceMeters: number
  segmentIndex: number
  coordinates: [number, number]
}

interface ShapeSegment {
  start: [number, number]
  end: [number, number]
  startMeters: number
  endMeters: number
}

interface StopWithProgress {
  stop: AtlasTripContextStop
  progressMeters: number
}

export function predictNextStopArrival(context: EtaPredictionContext): AtlasEtaPrediction {
  return predictArrivalAtStop(context)
}

export function predictArrivalAtStop(context: EtaPredictionContext): AtlasEtaPrediction {
  const { vehicle, tripContext, now } = context
  const calculatedAt = new Date(now).toISOString()
  const vehicleId = vehicle.properties.vehicleId ?? vehicle.properties.id
  const tripId = vehicle.properties.tripId
  const positionAgeSeconds = secondsBetween(vehicle.properties.observedAt, calculatedAt)
  const unavailable = (reason: string, method: AtlasEtaPredictionMethod = 'unavailable'): AtlasEtaPrediction => ({
    status: 'unavailable',
    vehicleId,
    tripId,
    routeId: vehicle.properties.routeId,
    confidence: 'low',
    calculatedAt,
    method,
    evidence: {
      realtimePositionAgeSeconds: positionAgeSeconds,
      recentObservationCount: usefulRecentPositions(context).length,
      reason,
    },
  })

  if (!tripId || !tripContext?.trip) return unavailable('Trip could not be joined to static GTFS.')
  if (positionAgeSeconds !== undefined && positionAgeSeconds > stalePositionSeconds) {
    return unavailable('Vehicle position is too stale for a realtime ETA.')
  }
  if (tripContext.shape.length < 2) return scheduleOnlyPrediction(context, 'Missing route shape.')
  if (!tripContext.stops.length) return unavailable('Trip stop sequence is unavailable.')

  const shape = shapeSegments(tripContext)
  const vehicleProjection = projectToShape(vehicle.geometry.coordinates as [number, number], shape)
  if (!vehicleProjection) return scheduleOnlyPrediction(context, 'Vehicle could not be projected onto route shape.')

  const stopProgress = sequenceStopProgress(tripContext.stops, shape)
  const nextStop = context.targetStopId
    ? targetStopFromProgress(context.targetStopId, stopProgress, vehicleProjection.progressMeters)
    : determineNextStop(vehicle, stopProgress, vehicleProjection.progressMeters)
  if (!nextStop) return unavailable('No scheduled stop remains ahead of the vehicle.')

  const distanceRemainingMeters = Math.max(0, nextStop.progressMeters - vehicleProjection.progressMeters)
  const scheduleBaseline = scheduledRemainingSeconds(vehicle, nextStop, stopProgress, vehicleProjection.progressMeters, calculatedAt)
  const providerArrival = providerArrivalTime(vehicle, nextStop.stop, calculatedAt)
  const providerDelaySeconds = numericSourceValue(vehicle, 'scheduleDeviationSeconds') ?? vehicle.properties.scheduleDeviationSeconds
  const speed = recentProgressSpeedMps(context.recentPositions, shape)
  const currentSpeed = typeof vehicle.properties.speed === 'number' && vehicle.properties.speed >= minimumUsefulSpeedMps && vehicle.properties.speed <= maxUsefulSpeedMps
    ? vehicle.properties.speed
    : undefined
  const effectiveSpeed = speed ?? currentSpeed
  const movementEstimateSeconds = effectiveSpeed ? distanceRemainingMeters / effectiveSpeed : undefined
  const estimatedTravelSeconds = blendedTravelSeconds(movementEstimateSeconds, scheduleBaseline?.remainingSeconds, context.recentPositions.length)

  if (estimatedTravelSeconds === undefined || !Number.isFinite(estimatedTravelSeconds)) {
    if (providerArrival) return scheduleOnlyPrediction(context, 'Movement estimate unavailable; using provider TripUpdate arrival.', 'provider-trip-update')
    return scheduleOnlyPrediction(context, 'Movement and schedule estimates are unavailable.')
  }

  const predictedArrival = new Date(Date.parse(calculatedAt) + Math.max(0, estimatedTravelSeconds) * 1000).toISOString()
  const scheduledArrival = scheduleBaseline?.scheduledArrival
  const confidence = confidenceFor({
    positionAgeSeconds,
    shapeDistanceMeters: vehicleProjection.distanceMeters,
    observations: usefulRecentPositions(context).length,
    speedMps: speed,
    scheduleRemainingSeconds: scheduleBaseline?.remainingSeconds,
    providerArrival,
  })

  return {
    status: 'available',
    vehicleId,
    tripId,
    routeId: vehicle.properties.routeId ?? tripContext.trip.routeId,
    stopId: nextStop.stop.stopId,
    stopName: nextStop.stop.name ?? `Stop ${nextStop.stop.stopId}`,
    predictedArrival,
    scheduledArrival,
    providerArrival,
    distanceRemainingMeters: Math.round(distanceRemainingMeters),
    estimatedTravelSeconds: Math.round(estimatedTravelSeconds),
    scheduleDeviationSeconds: scheduledArrival ? Math.round((Date.parse(predictedArrival) - Date.parse(scheduledArrival)) / 1000) : undefined,
    confidence,
    calculatedAt,
    method: 'route-progress-blend',
    evidence: {
      realtimePositionAgeSeconds: positionAgeSeconds,
      recentObservationCount: usefulRecentPositions(context).length,
      recentSpeedMps: speed,
      scheduledSegmentSeconds: scheduleBaseline?.segmentSeconds,
      scheduleRemainingSeconds: scheduleBaseline?.remainingSeconds,
      movementEstimateSeconds,
      remainingDistanceMeters: Math.round(distanceRemainingMeters),
      providerDelaySeconds,
      providerArrival,
      vehicleProgressMeters: Math.round(vehicleProjection.progressMeters),
      nextStopProgressMeters: Math.round(nextStop.progressMeters),
      shapeMatchDistanceMeters: Math.round(vehicleProjection.distanceMeters),
    },
    remainingRoute: remainingRouteFeature(vehicle.properties.id, vehicleProjection.progressMeters, nextStop.progressMeters, shape),
    routeFeature: routeFeature(vehicle, tripContext),
    routeStops: routeStopCollection(tripContext, nextStop.stop.stopId),
    nextStopFeature: stopFeature(nextStop.stop),
  }
}

function scheduleOnlyPrediction(context: EtaPredictionContext, reason: string, method: AtlasEtaPredictionMethod = 'schedule-baseline'): AtlasEtaPrediction {
  const { vehicle, tripContext, now } = context
  const calculatedAt = new Date(now).toISOString()
  const vehicleId = vehicle.properties.vehicleId ?? vehicle.properties.id
  const stop = nextStopFromSequence(vehicle, tripContext?.stops ?? [])
  const providerArrival = stop ? providerArrivalTime(vehicle, stop, calculatedAt) : undefined
  const scheduledArrival = stop?.arrivalSeconds !== undefined ? serviceDayIso(calculatedAt, stop.arrivalSeconds) : undefined
  const providerDelaySeconds = numericSourceValue(vehicle, 'scheduleDeviationSeconds') ?? vehicle.properties.scheduleDeviationSeconds
  const predictedArrival = providerArrival ?? (
    scheduledArrival && providerDelaySeconds !== undefined
      ? new Date(Date.parse(scheduledArrival) + providerDelaySeconds * 1000).toISOString()
      : scheduledArrival
  )
  const estimatedTravelSeconds = predictedArrival ? Math.max(0, (Date.parse(predictedArrival) - Date.parse(calculatedAt)) / 1000) : undefined
  return {
    status: predictedArrival && stop ? 'available' : 'unavailable',
    vehicleId,
    tripId: vehicle.properties.tripId,
    routeId: vehicle.properties.routeId ?? tripContext?.trip?.routeId,
    stopId: stop?.stopId,
    stopName: stop?.name ?? (stop ? `Stop ${stop.stopId}` : undefined),
    predictedArrival,
    scheduledArrival,
    providerArrival,
    distanceRemainingMeters: undefined,
    estimatedTravelSeconds: estimatedTravelSeconds === undefined ? undefined : Math.round(estimatedTravelSeconds),
    scheduleDeviationSeconds: scheduledArrival && predictedArrival ? Math.round((Date.parse(predictedArrival) - Date.parse(scheduledArrival)) / 1000) : undefined,
    confidence: predictedArrival ? 'low' : 'low',
    calculatedAt,
    method: providerArrival ? 'provider-trip-update' : method,
    evidence: {
      realtimePositionAgeSeconds: secondsBetween(vehicle.properties.observedAt, calculatedAt),
      recentObservationCount: usefulRecentPositions(context).length,
      providerDelaySeconds,
      providerArrival,
      reason,
    },
    nextStopFeature: stopFeature(stop),
  }
}

function shapeSegments(tripContext: AtlasTripContext) {
  const coordinates = tripContext.shape.map((point): [number, number] => [point.longitude, point.latitude])
  const segments: ShapeSegment[] = []
  let progress = 0
  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const start = coordinates[index]
    const end = coordinates[index + 1]
    const length = haversineMeters(start[1], start[0], end[1], end[0])
    segments.push({ start, end, startMeters: progress, endMeters: progress + length })
    progress += length
  }
  return segments
}

function projectToShape(coordinates: [number, number], segments: ShapeSegment[], minimumProgressMeters = 0): ProjectedPoint | undefined {
  let best: ProjectedPoint | undefined
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]
    if (segment.endMeters + 5 < minimumProgressMeters) continue
    const projected = projectToSegment(coordinates, segment)
    if (!best || projected.distanceMeters < best.distanceMeters) best = { ...projected, segmentIndex: index }
  }
  return best
}

function projectToSegment(point: [number, number], segment: ShapeSegment): Omit<ProjectedPoint, 'segmentIndex'> {
  const meanLatitude = degreesToRadians((point[1] + segment.start[1] + segment.end[1]) / 3)
  const metersPerDegreeLatitude = 111_320
  const metersPerDegreeLongitude = Math.cos(meanLatitude) * 111_320
  const px = (point[0] - segment.start[0]) * metersPerDegreeLongitude
  const py = (point[1] - segment.start[1]) * metersPerDegreeLatitude
  const sx = 0
  const sy = 0
  const ex = (segment.end[0] - segment.start[0]) * metersPerDegreeLongitude
  const ey = (segment.end[1] - segment.start[1]) * metersPerDegreeLatitude
  const lengthSquared = (ex - sx) ** 2 + (ey - sy) ** 2
  const ratio = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - sx) * (ex - sx) + (py - sy) * (ey - sy)) / lengthSquared))
  const longitude = segment.start[0] + (segment.end[0] - segment.start[0]) * ratio
  const latitude = segment.start[1] + (segment.end[1] - segment.start[1]) * ratio
  return {
    coordinates: [longitude, latitude],
    progressMeters: segment.startMeters + (segment.endMeters - segment.startMeters) * ratio,
    distanceMeters: haversineMeters(point[1], point[0], latitude, longitude),
  }
}

function sequenceStopProgress(stops: AtlasTripContextStop[], segments: ShapeSegment[]): StopWithProgress[] {
  const ordered = [...stops].sort((left, right) => (left.stopSequence ?? 0) - (right.stopSequence ?? 0))
  const projected: StopWithProgress[] = []
  let minimumProgressMeters = 0
  for (const stop of ordered) {
    if (stop.latitude === undefined || stop.longitude === undefined) continue
    const projection = projectToShape([stop.longitude, stop.latitude], segments, Math.max(0, minimumProgressMeters - 80))
    if (!projection) continue
    projected.push({ stop, progressMeters: projection.progressMeters })
    minimumProgressMeters = Math.max(minimumProgressMeters, projection.progressMeters)
  }
  return projected
}

function determineNextStop(vehicle: AtlasMovingAssetFeature, stops: StopWithProgress[], vehicleProgressMeters: number) {
  const providerNextStopId = stringSourceValue(vehicle, 'nextStopId')
  const providerStop = providerNextStopId ? stops.find((item) => item.stop.stopId === providerNextStopId) : undefined
  if (providerStop && providerStop.progressMeters >= vehicleProgressMeters - stopPassedToleranceMeters) return providerStop
  return stops.find((item) => item.progressMeters > vehicleProgressMeters + stopPassedToleranceMeters)
}

function targetStopFromProgress(stopId: string, stops: StopWithProgress[], vehicleProgressMeters: number) {
  const stop = stops.find((item) => item.stop.stopId === stopId)
  if (!stop || stop.progressMeters <= vehicleProgressMeters + stopPassedToleranceMeters) return undefined
  return stop
}

function nextStopFromSequence(vehicle: AtlasMovingAssetFeature, stops: AtlasTripContextStop[]) {
  const providerNextStopId = stringSourceValue(vehicle, 'nextStopId')
  if (providerNextStopId) {
    const providerStop = stops.find((stop) => stop.stopId === providerNextStopId)
    if (providerStop) return providerStop
  }
  const currentSequence = numericSourceValue(vehicle, 'currentStopSequence')
  const ordered = [...stops].sort((left, right) => (left.stopSequence ?? 0) - (right.stopSequence ?? 0))
  return currentSequence === undefined
    ? ordered[0]
    : ordered.find((stop) => (stop.stopSequence ?? 0) >= currentSequence) ?? ordered.find((stop) => (stop.stopSequence ?? 0) > currentSequence)
}

function recentProgressSpeedMps(observations: AtlasVehiclePositionObservation[], segments: ShapeSegment[]) {
  const useful = observations
    .map((observation) => ({
      ...observation,
      observedMs: Date.parse(observation.observedAt),
      progressMeters: observation.shapeProgressMeters ?? projectToShape([observation.longitude, observation.latitude], segments)?.progressMeters,
    }))
    .filter((observation) => Number.isFinite(observation.observedMs) && observation.progressMeters !== undefined)
    .sort((left, right) => left.observedMs - right.observedMs)
  const speeds: number[] = []
  for (let index = 1; index < useful.length; index += 1) {
    const previous = useful[index - 1]
    const current = useful[index]
    const seconds = (current.observedMs - previous.observedMs) / 1000
    const meters = (current.progressMeters ?? 0) - (previous.progressMeters ?? 0)
    if (seconds < 5 || meters < 8) continue
    const speed = meters / seconds
    if (speed >= minimumUsefulSpeedMps && speed <= maxUsefulSpeedMps) speeds.push(speed)
  }
  return median(speeds)
}

function scheduledRemainingSeconds(
  vehicle: AtlasMovingAssetFeature,
  nextStop: StopWithProgress,
  stops: StopWithProgress[],
  vehicleProgressMeters: number,
  now: string,
) {
  if (nextStop.stop.arrivalSeconds === undefined) return undefined
  const scheduledArrival = serviceDayIso(now, nextStop.stop.arrivalSeconds)
  const providerDelaySeconds = numericSourceValue(vehicle, 'scheduleDeviationSeconds') ?? vehicle.properties.scheduleDeviationSeconds ?? 0
  const scheduledRemainingByClock = Math.max(0, (Date.parse(scheduledArrival) + providerDelaySeconds * 1000 - Date.parse(now)) / 1000)
  const previous = [...stops].reverse().find((item) => item.progressMeters <= vehicleProgressMeters + stopPassedToleranceMeters)
  const previousDeparture = previous?.stop.departureSeconds ?? previous?.stop.arrivalSeconds
  if (!previous || previousDeparture === undefined) {
    return {
      scheduledArrival,
      remainingSeconds: scheduledRemainingByClock,
      segmentSeconds: undefined,
    }
  }
  const segmentSeconds = normalizePositiveSeconds(nextStop.stop.arrivalSeconds - previousDeparture)
  const segmentMeters = Math.max(1, nextStop.progressMeters - previous.progressMeters)
  const remainingFraction = Math.max(0, Math.min(1, (nextStop.progressMeters - vehicleProgressMeters) / segmentMeters))
  const remainingSeconds = Math.max(0, segmentSeconds * remainingFraction + providerDelaySeconds)
  return {
    scheduledArrival,
    remainingSeconds: Number.isFinite(remainingSeconds) ? remainingSeconds : scheduledRemainingByClock,
    segmentSeconds,
  }
}

function blendedTravelSeconds(movementEstimateSeconds: number | undefined, scheduleRemainingSeconds: number | undefined, observationCount: number) {
  if (movementEstimateSeconds !== undefined && scheduleRemainingSeconds !== undefined) {
    const movementWeight = observationCount >= 4 ? 0.7 : observationCount >= 2 ? 0.55 : 0.35
    return movementEstimateSeconds * movementWeight + scheduleRemainingSeconds * (1 - movementWeight)
  }
  if (movementEstimateSeconds !== undefined) return movementEstimateSeconds
  if (scheduleRemainingSeconds !== undefined) return scheduleRemainingSeconds
  return undefined
}

function providerArrivalTime(vehicle: AtlasMovingAssetFeature, stop: AtlasTripContextStop, now: string) {
  const explicit = stringSourceValue(vehicle, 'providerArrival')
  if (explicit) return explicit
  const delay = numericSourceValue(vehicle, 'scheduleDeviationSeconds') ?? vehicle.properties.scheduleDeviationSeconds
  if (delay === undefined || stop.arrivalSeconds === undefined) return undefined
  return new Date(Date.parse(serviceDayIso(now, stop.arrivalSeconds)) + delay * 1000).toISOString()
}

function remainingRouteFeature(vehicleId: string, fromMeters: number, toMeters: number, segments: ShapeSegment[]): AtlasEtaPrediction['remainingRoute'] {
  const coordinates = coordinatesBetweenProgress(fromMeters, toMeters, segments)
  if (coordinates.length < 2) return undefined
  return {
    type: 'Feature',
    id: `eta-route:${vehicleId}`,
    geometry: { type: 'LineString', coordinates } satisfies LineString,
    properties: { id: `eta-route:${vehicleId}` },
  }
}

function routeFeature(vehicle: AtlasMovingAssetFeature, tripContext: AtlasTripContext): AtlasEtaPrediction['routeFeature'] {
  const coordinates = tripContext.shape.map((point): [number, number] => [point.longitude, point.latitude])
  if (coordinates.length < 2) return undefined
  return {
    type: 'Feature',
    id: `selected-route:${vehicle.properties.tripId ?? vehicle.properties.id}`,
    geometry: { type: 'LineString', coordinates } satisfies LineString,
    properties: {
      id: `selected-route:${vehicle.properties.tripId ?? vehicle.properties.id}`,
      routeId: vehicle.properties.routeId ?? tripContext.trip?.routeId,
      routeLabel: vehicle.properties.routeLabel ?? tripContext.route?.shortName,
      directionLabel: directionLabel(tripContext),
    },
  }
}

function routeStopCollection(tripContext: AtlasTripContext, nextStopId?: string): AtlasEtaPrediction['routeStops'] {
  return {
    type: 'FeatureCollection',
    features: tripContext.stops.flatMap((stop): AtlasTransitStopFeature[] => {
      if (stop.latitude === undefined || stop.longitude === undefined) return []
      const id = `nta-stop:${stop.stopId}`
      return [{
        type: 'Feature',
        id,
        geometry: { type: 'Point', coordinates: [stop.longitude, stop.latitude] },
        properties: {
          id,
          provider: 'nta-gtfs-realtime',
          providerName: 'NTA GTFS Static',
          stopId: stop.stopId,
          name: stop.name ?? `Stop ${stop.stopId}`,
          routeStopRole: stop.stopId === nextStopId ? 'next-stop' : 'ordinary',
          sourceProperties: {
            source: 'selected-route',
            stopSequence: stop.stopSequence,
            scheduledArrival: stop.arrivalSeconds,
            scheduledDeparture: stop.departureSeconds,
            nextStop: stop.stopId === nextStopId,
          },
        },
      }]
    }),
  }
}

function coordinatesBetweenProgress(fromMeters: number, toMeters: number, segments: ShapeSegment[]) {
  const coordinates: [number, number][] = []
  for (const segment of segments) {
    if (segment.endMeters < fromMeters || segment.startMeters > toMeters) continue
    const startRatio = segment.endMeters === segment.startMeters ? 0 : Math.max(0, Math.min(1, (fromMeters - segment.startMeters) / (segment.endMeters - segment.startMeters)))
    const endRatio = segment.endMeters === segment.startMeters ? 1 : Math.max(0, Math.min(1, (toMeters - segment.startMeters) / (segment.endMeters - segment.startMeters)))
    const start: [number, number] = [
      segment.start[0] + (segment.end[0] - segment.start[0]) * startRatio,
      segment.start[1] + (segment.end[1] - segment.start[1]) * startRatio,
    ]
    const end: [number, number] = [
      segment.start[0] + (segment.end[0] - segment.start[0]) * endRatio,
      segment.start[1] + (segment.end[1] - segment.start[1]) * endRatio,
    ]
    if (!coordinates.length || !sameCoordinate(coordinates.at(-1), start)) coordinates.push(start)
    coordinates.push(end)
  }
  return coordinates
}

function stopFeature(stop: AtlasTripContextStop | undefined): AtlasTransitStopFeature | undefined {
  if (!stop || stop.latitude === undefined || stop.longitude === undefined) return undefined
  return {
    type: 'Feature',
    id: `nta-stop:${stop.stopId}`,
    geometry: { type: 'Point', coordinates: [stop.longitude, stop.latitude] },
    properties: {
      id: `nta-stop:${stop.stopId}`,
      provider: 'nta-gtfs-realtime',
      providerName: 'NTA GTFS Static',
      stopId: stop.stopId,
      name: stop.name ?? `Stop ${stop.stopId}`,
      sourceProperties: { source: 'prediction' },
    },
  }
}

function directionLabel(tripContext: AtlasTripContext) {
  const first = tripContext.stops.find((stop) => stop.name)?.name
  const last = [...tripContext.stops].reverse().find((stop) => stop.name)?.name
  if (first && last && first !== last) return `${first} to ${last}`
  return tripContext.trip?.headsign ?? tripContext.route?.longName
}

function confidenceFor(input: {
  positionAgeSeconds?: number
  shapeDistanceMeters: number
  observations: number
  speedMps?: number
  scheduleRemainingSeconds?: number
  providerArrival?: string
}): AtlasEtaPredictionConfidence {
  if ((input.positionAgeSeconds ?? Number.POSITIVE_INFINITY) > oldPositionSeconds) return 'low'
  if (input.shapeDistanceMeters > 160) return 'low'
  if (input.observations >= 3 && input.speedMps !== undefined && input.shapeDistanceMeters <= 80) return 'high'
  if (input.scheduleRemainingSeconds !== undefined || input.providerArrival) return 'medium'
  return 'low'
}

function usefulRecentPositions(context: EtaPredictionContext) {
  const nowMs = Date.parse(context.now)
  return context.recentPositions.filter((observation) => {
    const observedMs = Date.parse(observation.observedAt)
    return Number.isFinite(observedMs) && nowMs - observedMs <= 5 * 60 * 1000
  })
}

function serviceDayIso(now: string, seconds: number) {
  const date = new Date(now)
  date.setHours(0, 0, 0, 0)
  date.setSeconds(seconds)
  return date.toISOString()
}

function normalizePositiveSeconds(seconds: number) {
  if (seconds < 0) return seconds + 24 * 3600
  return seconds
}

function secondsBetween(from: string | undefined, to: string) {
  if (!from) return undefined
  const fromMs = Date.parse(from)
  const toMs = Date.parse(to)
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) return undefined
  return Math.max(0, (toMs - fromMs) / 1000)
}

function stringSourceValue(vehicle: AtlasMovingAssetFeature, key: string) {
  const value = vehicle.properties.sourceProperties[key]
  return typeof value === 'string' && value ? value : undefined
}

function numericSourceValue(vehicle: AtlasMovingAssetFeature, key: string) {
  const value = vehicle.properties.sourceProperties[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function median(values: number[]) {
  if (!values.length) return undefined
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.floor(sorted.length / 2)]
}

function sameCoordinate(left: [number, number] | undefined, right: [number, number]) {
  return Boolean(left && Math.abs(left[0] - right[0]) < 0.0000001 && Math.abs(left[1] - right[1]) < 0.0000001)
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
