import type { Feature, FeatureCollection, LineString, Point } from 'geojson'
import type { AtlasStatus, ProviderHealth } from './atlas.types.ts'

export type AtlasMovingProviderId = 'nta-gtfs-realtime'
export type AtlasMovingAssetType = 'bus' | 'tram' | 'rail' | 'vehicle'
export type AtlasScheduleStatus = 'early' | 'on-time' | 'late' | 'unknown'

export type AtlasSpatialFilter =
  | { type: 'viewport' }
  | { type: 'bounds'; west: number; south: number; east: number; north: number }
  | { type: 'region'; id: string; label: string; west: number; south: number; east: number; north: number }

export interface AtlasTransportRouteOption {
  routeId: string
  label: string
  description?: string
  operator?: string
  searchText: string
}

export interface AtlasTransportRouteIndex {
  source: 'configured' | 'recommended' | 'unavailable'
  routes: AtlasTransportRouteOption[]
  syncedAt?: string
}

export interface AtlasTransportRegion {
  id: string
  label: string
  west: number
  south: number
  east: number
  north: number
}

export interface AtlasTransportFilterState {
  routeIds: string[]
  spatialFilter?: AtlasSpatialFilter
}

export interface AtlasTransitStopProperties {
  id: string
  provider: AtlasMovingProviderId
  providerName: string
  stopId: string
  name: string
  routeStopRole?: 'ordinary' | 'next-stop'
  sourceProperties: Record<string, unknown>
}

export type AtlasTransitStopFeature = Feature<Point, AtlasTransitStopProperties>
export type AtlasTransitStopCollection = FeatureCollection<Point, AtlasTransitStopProperties>

export type AtlasEtaPredictionConfidence = 'high' | 'medium' | 'low'
export type AtlasEtaPredictionStatus = 'available' | 'unavailable'
export type AtlasEtaPredictionMethod = 'route-progress-blend' | 'provider-trip-update' | 'schedule-baseline' | 'unavailable'

export interface AtlasEtaPredictionEvidence {
  realtimePositionAgeSeconds?: number
  recentObservationCount: number
  recentSpeedMps?: number
  scheduledSegmentSeconds?: number
  scheduleRemainingSeconds?: number
  movementEstimateSeconds?: number
  remainingDistanceMeters?: number
  providerDelaySeconds?: number
  providerArrival?: string
  vehicleProgressMeters?: number
  nextStopProgressMeters?: number
  shapeMatchDistanceMeters?: number
  reason?: string
}

export interface AtlasEtaPrediction {
  status: AtlasEtaPredictionStatus
  vehicleId: string
  tripId?: string
  routeId?: string
  stopId?: string
  stopName?: string
  predictedArrival?: string
  scheduledArrival?: string
  providerArrival?: string
  distanceRemainingMeters?: number
  estimatedTravelSeconds?: number
  scheduleDeviationSeconds?: number
  confidence: AtlasEtaPredictionConfidence
  calculatedAt: string
  method: AtlasEtaPredictionMethod
  evidence: AtlasEtaPredictionEvidence
  remainingRoute?: Feature<LineString, { id: string }>
  routeFeature?: Feature<LineString, { id: string; routeId?: string; routeLabel?: string; directionLabel?: string }>
  routeStops?: AtlasTransitStopCollection
  nextStopFeature?: AtlasTransitStopFeature
}

export interface AtlasStopService {
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

export type AtlasStopArrivalPredictionSource = 'atlas' | 'provider' | 'schedule'

export interface AtlasStopArrival {
  stopId: string
  vehicleFeatureId?: string
  vehicleId?: string
  routeId: string
  routeShortName?: string
  tripId: string
  directionId?: string
  headsign?: string
  scheduledArrival?: string
  providerArrival?: string
  predictedArrival?: string
  displayArrival?: string
  confidence?: AtlasEtaPredictionConfidence
  predictionSource: AtlasStopArrivalPredictionSource
}

export interface AtlasStopArrivalsState {
  stopId?: string
  services: AtlasStopService[]
  arrivals: AtlasStopArrival[]
  loading: boolean
  error?: string
  calculatedAt?: string
}

export interface AtlasVehiclePositionObservation {
  vehicleId: string
  longitude: number
  latitude: number
  observedAt: string
  shapeProgressMeters?: number
}

export interface AtlasTripContextStop {
  tripId: string
  stopId: string
  name?: string
  latitude?: number
  longitude?: number
  arrivalSeconds?: number
  departureSeconds?: number
  stopSequence?: number
}

export interface AtlasTripContextShapePoint {
  latitude: number
  longitude: number
  sequence: number
}

export interface AtlasTripContext {
  source: 'configured' | 'recommended' | 'unavailable'
  trip?: {
    tripId: string
    routeId: string
    headsign?: string
    directionId?: string
    shapeId?: string
  }
  route?: {
    routeId: string
    agencyId?: string
    shortName?: string
    longName?: string
    routeType?: string
  }
  stops: AtlasTripContextStop[]
  shape: AtlasTripContextShapePoint[]
}

export interface AtlasMovingAssetProperties {
  id: string
  provider: AtlasMovingProviderId
  providerName: string
  assetType: AtlasMovingAssetType
  name: string
  routeId?: string
  routeLabel?: string
  tripId?: string
  vehicleId?: string
  bearing?: number
  speed?: number
  scheduleStatus?: AtlasScheduleStatus
  scheduleDeviationSeconds?: number
  nextStopName?: string
  observedAt: string
  status: AtlasStatus
  interpolated?: boolean
  sourceProperties: Record<string, unknown>
}

export type AtlasMovingAssetFeature = Feature<Point, AtlasMovingAssetProperties>
export type AtlasMovingAssetCollection = FeatureCollection<Point, AtlasMovingAssetProperties>

export interface AtlasMovingFilters {
  providers: AtlasMovingProviderId[]
  assetTypes: AtlasMovingAssetType[]
  statuses: AtlasStatus[]
}

export interface AtlasVehicleTrailProperties {
  id: string
  vehicleId: string
  provider: AtlasMovingProviderId
}

export type AtlasVehicleTrailFeature = Feature<LineString, AtlasVehicleTrailProperties>
export type AtlasVehicleTrailCollection = FeatureCollection<LineString, AtlasVehicleTrailProperties>

export interface MovingProviderHealthState {
  status: ProviderHealth
  lastSuccessfulSync?: string
  lastAttempt?: string
  featureCount?: number
  error?: string
}

export interface MovingProviderState {
  id: AtlasMovingProviderId
  name: string
  attribution: string
  collection: AtlasMovingAssetCollection
  health: MovingProviderHealthState
  loading: boolean
}

export interface AtlasMovingAssetProvider {
  id: AtlasMovingProviderId
  name: string
  attribution: string
  refreshIntervalMs: number
  fetchMovingAssets(): Promise<AtlasMovingAssetCollection>
}
