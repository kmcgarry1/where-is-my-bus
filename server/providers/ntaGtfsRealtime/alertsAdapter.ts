import type { AtlasIncidentCollection, AtlasIncidentFeature, AtlasIncidentSeverity } from '../../../src/data/incident.types.ts'
import type { NtaServiceAlertEntity } from './client.ts'

export function adaptNtaServiceAlerts(alerts: NtaServiceAlertEntity[], source: 'live' | 'fixture'): AtlasIncidentCollection {
  const features: AtlasIncidentFeature[] = alerts.map((alert) => {
    const activePeriod = currentOrFirstPeriod(alert.activePeriods)
    const startedAt = activePeriod.start ? new Date(activePeriod.start * 1000).toISOString() : new Date().toISOString()
    const endedAt = activePeriod.end ? new Date(activePeriod.end * 1000).toISOString() : undefined
    const id = `nta-gtfs-realtime:alert:${alert.id}`
    const coordinates = alert.latitude !== undefined && alert.longitude !== undefined
      ? [alert.longitude, alert.latitude]
      : [-6.2603, 53.3498]
    return {
      type: 'Feature',
      id,
      geometry: { type: 'Point', coordinates },
      properties: {
        id,
        provider: 'nta-gtfs-realtime',
        providerName: 'NTA GTFS-Realtime',
        source: source === 'live' ? 'provider' : 'atlas',
        type: 'service-alert',
        severity: severityForEffect(alert.effect),
        status: endedAt && Date.parse(endedAt) < Date.now() ? 'resolved' : 'active',
        title: alert.header ?? `Transport service alert ${alert.id}`,
        description: alert.description,
        startedAt,
        endedAt,
        lastUpdatedAt: new Date().toISOString(),
        relatedAssetIds: relatedAssets(alert),
        sourceProperties: {
          source,
          cause: alert.cause,
          effect: alert.effect,
          url: alert.url,
          routeIds: alert.routeIds,
          stopIds: alert.stopIds,
          tripIds: alert.tripIds,
          stopName: alert.stopName,
          staticGtfsSource: alert.staticGtfsSource,
          geometrySource: alert.latitude !== undefined && alert.longitude !== undefined ? 'static-gtfs-stop' : 'dublin-centroid',
        },
      },
    }
  })

  return { type: 'FeatureCollection', features }
}

function currentOrFirstPeriod(periods: Array<{ start?: number; end?: number }>) {
  const now = Date.now() / 1000
  return periods.find((period) => (period.start ?? 0) <= now && (period.end ?? Number.POSITIVE_INFINITY) >= now)
    ?? periods[0]
    ?? {}
}

function severityForEffect(effect?: string): AtlasIncidentSeverity {
  const value = effect?.toLowerCase() ?? ''
  if (value.includes('no_service') || value.includes('stop_moved')) return 'critical'
  if (value.includes('significant') || value.includes('detour') || value.includes('reduced')) return 'major'
  if (value.includes('delay')) return 'minor'
  return 'info'
}

function relatedAssets(alert: NtaServiceAlertEntity) {
  return [...alert.tripIds, ...alert.routeIds.map((routeId) => `route:${routeId}`)]
}
