import type { AtlasMovingAssetCollection, AtlasMovingAssetFeature } from '../movingAsset.types'

type ReplayVehicleSeed = {
  id: string
  assetType: AtlasMovingAssetFeature['properties']['assetType']
  name: string
  routeId: string
  routeLabel: string
  tripId: string
  vehicleId: string
  routeName: string
  agencyName: string
  bearing: number
  speed: number
  points: [number, number][]
}

const replayStartOffsetMs = 4 * 60 * 60 * 1000
const replayStepMs = 30 * 60 * 1000
const maxReplayTrailPoints = 8

const vehicles: ReplayVehicleSeed[] = [
  {
    id: 'recorded-46a-1',
    assetType: 'bus',
    name: 'Route 46A',
    routeId: '46A',
    routeLabel: '46A',
    tripId: 'recorded-trip-46a',
    vehicleId: 'TFI-REC-46A-1',
    routeName: 'Dun Laoghaire - Phoenix Park',
    agencyName: 'National Transport Authority',
    bearing: 318,
    speed: 8.4,
    points: [
      [-6.1288, 53.2910],
      [-6.1739, 53.3022],
      [-6.2186, 53.3194],
      [-6.2603, 53.3438],
      [-6.2984, 53.3565],
    ],
  },
  {
    id: 'recorded-luas-red-1',
    assetType: 'tram',
    name: 'Luas Red Line',
    routeId: 'LUAS-RED',
    routeLabel: 'Red',
    tripId: 'recorded-trip-luas-red',
    vehicleId: 'TFI-REC-LUAS-R1',
    routeName: 'Tallaght - The Point',
    agencyName: 'Transport Infrastructure Ireland',
    bearing: 78,
    speed: 6.8,
    points: [
      [-6.3704, 53.2878],
      [-6.3230, 53.3106],
      [-6.2899, 53.3357],
      [-6.2469, 53.3494],
      [-6.2259, 53.3481],
    ],
  },
  {
    id: 'recorded-155-1',
    assetType: 'bus',
    name: 'Route 155',
    routeId: '155',
    routeLabel: '155',
    tripId: 'recorded-trip-155',
    vehicleId: 'TFI-REC-155-1',
    routeName: 'Ikea Ballymun - Bray Station',
    agencyName: 'National Transport Authority',
    bearing: 164,
    speed: 9.7,
    points: [
      [-6.2648, 53.4082],
      [-6.2624, 53.3828],
      [-6.2606, 53.3498],
      [-6.2540, 53.3192],
      [-6.2026, 53.2042],
    ],
  },
  {
    id: 'recorded-dart-1',
    assetType: 'rail',
    name: 'DART Northbound',
    routeId: 'DART',
    routeLabel: 'DART',
    tripId: 'recorded-trip-dart',
    vehicleId: 'TFI-REC-DART-1',
    routeName: 'Greystones - Howth',
    agencyName: 'Iarnrod Eireann',
    bearing: 18,
    speed: 14.2,
    points: [
      [-6.1135, 53.2550],
      [-6.1235, 53.2936],
      [-6.1518, 53.3340],
      [-6.1750, 53.3631],
      [-6.1514, 53.3916],
    ],
  },
]

const sessionBounds = createReplayBounds(Date.now())

export function recordedMovingReplayBounds() {
  return sessionBounds
}

export function recordedMovingCollectionForTime(timestamp: string): AtlasMovingAssetCollection {
  const time = Date.parse(timestamp)
  const bounds = recordedMovingReplayBounds()
  const bounded = Number.isFinite(time) ? Math.min(Math.max(time, bounds.min), bounds.max) : bounds.max
  const frame = (bounded - bounds.min) / replayStepMs
  const lowerIndex = Math.floor(frame)
  const upperIndex = Math.min(lowerIndex + 1, vehicles[0].points.length - 1)
  const ratio = upperIndex === lowerIndex ? 0 : frame - lowerIndex

  return {
    type: 'FeatureCollection',
    features: vehicles.map((vehicle) => replayFeature(vehicle, bounds.min, lowerIndex, upperIndex, ratio)),
  }
}

export function recordedMovingTrailMap(timestamp: string): Map<string, [number, number][]> {
  const time = Date.parse(timestamp)
  const bounds = recordedMovingReplayBounds()
  const bounded = Number.isFinite(time) ? Math.min(Math.max(time, bounds.min), bounds.max) : bounds.max
  const frame = (bounded - bounds.min) / replayStepMs
  const upperIndex = Math.min(Math.ceil(frame), vehicles[0].points.length - 1)
  const lowerIndex = Math.floor(frame)
  const ratio = upperIndex === lowerIndex ? 0 : frame - lowerIndex

  return new Map(vehicles.map((vehicle) => {
    const points = vehicle.points.slice(0, upperIndex + 1)
    if (ratio > 0) points.push(interpolatePoint(vehicle.points[lowerIndex], vehicle.points[upperIndex], ratio))
    return [replayId(vehicle.id), points.slice(-maxReplayTrailPoints)]
  }))
}

function replayFeature(
  vehicle: ReplayVehicleSeed,
  start: number,
  lowerIndex: number,
  upperIndex: number,
  ratio: number,
): AtlasMovingAssetFeature {
  const observedAt = new Date(start + lowerIndex * replayStepMs).toISOString()
  const nextObservationAt = new Date(start + upperIndex * replayStepMs).toISOString()
  const coordinates = interpolatePoint(vehicle.points[lowerIndex], vehicle.points[upperIndex], ratio)
  const interpolated = ratio > 0

  return {
    type: 'Feature',
    id: replayId(vehicle.id),
    geometry: { type: 'Point', coordinates },
    properties: {
      id: replayId(vehicle.id),
      provider: 'nta-gtfs-realtime',
      providerName: 'NTA GTFS-Realtime',
      assetType: vehicle.assetType,
      name: vehicle.name,
      routeId: vehicle.routeId,
      routeLabel: vehicle.routeLabel,
      tripId: vehicle.tripId,
      vehicleId: vehicle.vehicleId,
      bearing: vehicle.bearing,
      speed: vehicle.speed,
      observedAt,
      status: 'normal',
      interpolated,
      sourceProperties: {
        source: 'recorded-replay',
        staticGtfsSource: 'recorded',
        routeLongName: vehicle.routeName,
        agencyName: vehicle.agencyName,
        replayTimestamp: new Date(start + lowerIndex * replayStepMs + ratio * replayStepMs).toISOString(),
        previousObservationAt: observedAt,
        nextObservationAt,
      },
    },
  }
}

function interpolatePoint(from: [number, number], to: [number, number], ratio: number): [number, number] {
  return [
    from[0] + (to[0] - from[0]) * ratio,
    from[1] + (to[1] - from[1]) * ratio,
  ]
}

function floorToReplayStep(timestamp: number) {
  return Math.floor(timestamp / replayStepMs) * replayStepMs
}

function replayId(id: string) {
  return `nta-replay:${id}`
}

function createReplayBounds(now: number) {
  const start = floorToReplayStep(now - replayStartOffsetMs)
  return {
    min: start,
    max: start + replayStepMs * (vehicles[0].points.length - 1),
  }
}
