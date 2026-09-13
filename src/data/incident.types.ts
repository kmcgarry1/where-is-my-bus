import type { Feature, FeatureCollection, Geometry } from 'geojson'

export type AtlasIncidentProviderId = 'epa-bathing-water' | 'nta-gtfs-realtime' | 'atlas-derived'
export type AtlasIncidentSource = 'provider' | 'derived' | 'atlas'
export type AtlasIncidentSeverity = 'info' | 'minor' | 'major' | 'critical'
export type AtlasIncidentStatus = 'active' | 'monitoring' | 'resolved'
export type AtlasIncidentType = 'bathing-water-restriction' | 'service-alert' | 'sensor-health'

export interface AtlasIncidentProperties {
  id: string
  provider: AtlasIncidentProviderId
  providerName: string
  source: AtlasIncidentSource
  type: AtlasIncidentType
  severity: AtlasIncidentSeverity
  status: AtlasIncidentStatus
  title: string
  description?: string
  startedAt: string
  endedAt?: string
  lastUpdatedAt?: string
  relatedAssetIds?: string[]
  sourceProperties: Record<string, unknown>
}

export type AtlasIncidentFeature = Feature<Geometry, AtlasIncidentProperties>
export type AtlasIncidentCollection = FeatureCollection<Geometry, AtlasIncidentProperties>

export interface AtlasIncidentProvider {
  id: AtlasIncidentProviderId
  name: string
  attribution: string
  refreshIntervalMs: number
  fetchIncidents(): Promise<AtlasIncidentCollection>
}

export interface AtlasIncidentFilters {
  providers: AtlasIncidentProviderId[]
  severities: AtlasIncidentSeverity[]
  statuses: AtlasIncidentStatus[]
}

export interface IncidentProviderState {
  id: AtlasIncidentProviderId
  name: string
  attribution: string
  collection: AtlasIncidentCollection
  health: {
    status: 'healthy' | 'degraded' | 'unavailable'
    lastSuccessfulSync?: string
    lastAttempt?: string
    featureCount?: number
    error?: string
  }
  loading: boolean
}
