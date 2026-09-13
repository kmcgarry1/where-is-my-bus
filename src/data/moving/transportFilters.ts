import type { AtlasMovingAssetCollection, AtlasMovingAssetFeature, AtlasSpatialFilter, AtlasTransportRegion, AtlasTransportRouteOption } from '../movingAsset.types'

export const transportRegions: AtlasTransportRegion[] = [
  { id: 'dublin', label: 'Dublin City', west: -6.42, south: 53.24, east: -6.05, north: 53.43 },
  { id: 'cork', label: 'Cork City', west: -8.62, south: 51.82, east: -8.33, north: 51.98 },
  { id: 'galway', label: 'Galway City', west: -9.18, south: 53.23, east: -8.91, north: 53.34 },
  { id: 'limerick', label: 'Limerick City', west: -8.75, south: 52.59, east: -8.52, north: 52.72 },
  { id: 'waterford', label: 'Waterford City', west: -7.18, south: 52.21, east: -6.98, north: 52.31 },
]

export function searchRouteOptions(routes: AtlasTransportRouteOption[], query: string, limit = 8) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return routes.slice(0, limit)
  return routes
    .map((route) => ({ route, score: routeMatchScore(route, normalized) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.route.label.localeCompare(right.route.label, 'en', { numeric: true }))
    .slice(0, limit)
    .map((entry) => entry.route)
}

type Bounds = {
  west: number
  south: number
  east: number
  north: number
}

export function filterMovingCollectionBySpatialFilter(collection: AtlasMovingAssetCollection, spatialFilter?: AtlasSpatialFilter, viewportBounds?: Bounds): AtlasMovingAssetCollection {
  if (!spatialFilter) return collection
  const bounds = spatialBounds(spatialFilter, viewportBounds)
  if (!bounds) return collection
  return {
    type: 'FeatureCollection',
    features: collection.features.filter((feature) => featureInsideBounds(feature, bounds)),
  }
}

export function featureMatchesTransportFilters(feature: AtlasMovingAssetFeature, routeIds: string[]) {
  return !routeIds.length || routeIds.includes(feature.properties.routeId ?? '')
}

export function spatialBounds(filter: AtlasSpatialFilter, viewportBounds?: Bounds) {
  if (filter.type === 'viewport') return viewportBounds
  return {
    west: filter.west,
    south: filter.south,
    east: filter.east,
    north: filter.north,
  }
}

function featureInsideBounds(feature: AtlasMovingAssetFeature, bounds: Bounds) {
  const [longitude, latitude] = feature.geometry.coordinates
  return longitude >= bounds.west && longitude <= bounds.east && latitude >= bounds.south && latitude <= bounds.north
}

function routeMatchScore(route: AtlasTransportRouteOption, query: string) {
  const label = route.label.toLowerCase()
  if (label === query) return 100
  if (label.startsWith(query)) return 80
  if (route.searchText.includes(` ${query}`)) return 55
  if (route.searchText.includes(query)) return 35
  return 0
}
