import type { AtlasPointFeature } from '../atlas.types'
import type { AtlasIncidentCollection, AtlasIncidentFeature } from '../incident.types'

export function deriveAssetHealthIncidents(features: AtlasPointFeature[]): AtlasIncidentCollection {
  const incidents: AtlasIncidentFeature[] = features.flatMap((feature) => {
    if (!['critical', 'offline'].includes(feature.properties.status)) return []
    const severity = feature.properties.status === 'critical' ? 'major' : 'minor'
    const id = `atlas-derived:asset-health:${feature.properties.id}`
    return [{
      type: 'Feature',
      id,
      geometry: feature.geometry,
      properties: {
        id,
        provider: 'atlas-derived',
        providerName: 'AtlasOps derived',
        source: 'derived',
        type: 'sensor-health',
        severity,
        status: 'active',
        title: `${feature.properties.name} ${feature.properties.status}`,
        description: `Derived from provider-normalised asset health: ${feature.properties.status}. This does not classify the measurement itself.`,
        startedAt: feature.properties.observedAt ?? new Date().toISOString(),
        lastUpdatedAt: feature.properties.observedAt,
        relatedAssetIds: [feature.properties.id],
        sourceProperties: {
          rule: 'asset-status-critical-or-offline',
          assetProvider: feature.properties.provider,
          assetType: feature.properties.assetType,
          observedAt: feature.properties.observedAt,
        },
      },
    }]
  })

  return { type: 'FeatureCollection', features: incidents }
}
