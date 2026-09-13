import type { AtlasIncidentCollection, AtlasIncidentProvider, IncidentProviderState } from '../incident.types'
import { epaBathingIncidentProvider } from './epaBathing/epaBathingIncidentProvider'
import { ntaIncidentProvider } from './ntaGtfsRealtime/ntaIncidentProvider'

export const incidentProviders: AtlasIncidentProvider[] = [
  epaBathingIncidentProvider,
  ntaIncidentProvider,
]

export function emptyIncidentCollection(): AtlasIncidentCollection {
  return { type: 'FeatureCollection', features: [] }
}

export function emptyIncidentProviderState(provider: AtlasIncidentProvider): IncidentProviderState {
  return {
    id: provider.id,
    name: provider.name,
    attribution: provider.attribution,
    collection: emptyIncidentCollection(),
    health: { status: 'degraded' },
    loading: false,
  }
}
