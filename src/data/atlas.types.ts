import type { Feature, FeatureCollection, Point } from 'geojson'
import type { AtlasIncidentProviderId } from './incident.types.ts'
import type { AtlasMovingProviderId } from './movingAsset.types.ts'
import type { TelemetryReading } from './telemetry.types.ts'

export type AtlasStatus = 'normal' | 'warning' | 'critical' | 'offline' | 'unknown'
export type ProviderHealth = 'healthy' | 'degraded' | 'unavailable'
export type AtlasProviderId = 'opw-water' | 'dublin-bikes' | 'dcc-sonitus'
export type AtlasAssetType = 'water-gauge' | 'bike-station' | 'noise-monitor' | 'air-quality-monitor'

export interface AtlasFeatureProperties {
  id: string
  provider: AtlasProviderId
  providerName: string
  assetType: AtlasAssetType
  name: string
  status: AtlasStatus
  observedAt?: string
  value?: number
  unit?: string
  stale: boolean
  latestTelemetry?: TelemetryReading[]
  sourceProperties: Record<string, unknown>
}

export type AtlasPointFeature = Feature<Point, AtlasFeatureProperties>
export type AtlasFeatureCollection = FeatureCollection<Point, AtlasFeatureProperties>

export interface ProviderHealthState {
  status: ProviderHealth
  lastSuccessfulSync?: string
  lastAttempt?: string
  featureCount?: number
  error?: string
}

export interface ProviderState {
  id: AtlasProviderId
  name: string
  attribution: string
  collection: AtlasFeatureCollection
  health: ProviderHealthState
  loading: boolean
}

export interface AtlasProvider {
  id: AtlasProviderId
  name: string
  attribution: string
  refreshIntervalMs: number
  fetchAssets(): Promise<AtlasFeatureCollection>
}

export interface AtlasAssetSelection {
  kind: 'asset'
  provider: AtlasProviderId
  featureId: string
}

export interface AtlasIncidentSelection {
  kind: 'incident'
  provider: AtlasIncidentProviderId
  featureId: string
}

export interface AtlasMovingSelection {
  kind: 'moving'
  provider: AtlasMovingProviderId
  featureId: string
}

export interface AtlasTransitStopSelection {
  kind: 'transit-stop'
  provider: 'nta-gtfs-realtime'
  featureId: string
}

export type AtlasSelection = AtlasAssetSelection | AtlasIncidentSelection | AtlasMovingSelection | AtlasTransitStopSelection

export interface AtlasFilters {
  providers: AtlasProviderId[]
  assetTypes: AtlasAssetType[]
  statuses: AtlasStatus[]
}
