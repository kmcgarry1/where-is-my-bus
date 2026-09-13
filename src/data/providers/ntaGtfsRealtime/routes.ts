import { readJsonResponse } from '../../httpClient'
import type { AtlasTransportRouteIndex, AtlasTransportRouteOption } from '../../movingAsset.types'

interface NtaRouteResponse {
  source: 'configured' | 'recommended' | 'unavailable'
  routes: Array<{
    routeId: string
    shortName?: string
    longName?: string
    operator?: string
    headsigns?: string[]
  }>
  syncedAt: string
}

export async function fetchNtaRouteIndex(): Promise<AtlasTransportRouteIndex> {
  const response = await fetch('/api/providers/nta/routes')
  const payload = await readJsonResponse<NtaRouteResponse>(response, 'NTA static routes')
  return {
    source: payload.source,
    syncedAt: payload.syncedAt,
    routes: payload.routes.map(toRouteOption),
  }
}

function toRouteOption(route: NtaRouteResponse['routes'][number]): AtlasTransportRouteOption {
  const label = route.shortName || route.routeId
  const descriptionParts = [route.longName, route.operator].filter(Boolean)
  const searchParts = [route.routeId, route.shortName, route.longName, route.operator, ...(route.headsigns ?? [])]
  return {
    routeId: route.routeId,
    label,
    description: descriptionParts.join(' - ') || undefined,
    operator: route.operator,
    searchText: searchParts.join(' ').toLowerCase(),
  }
}
