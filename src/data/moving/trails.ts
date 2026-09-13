import type { AtlasMovingAssetFeature, AtlasVehicleTrailCollection } from '../movingAsset.types'

const maxTrailPoints = 8

export function updateVehicleTrails(
  previous: Map<string, [number, number][]>,
  vehicles: AtlasMovingAssetFeature[],
): Map<string, [number, number][]> {
  const next = new Map(previous)
  for (const vehicle of vehicles) {
    const id = vehicle.properties.id
    const coordinates = vehicle.geometry.coordinates as [number, number]
    const existing = next.get(id) ?? []
    const latest = existing.at(-1)
    if (!latest || latest[0] !== coordinates[0] || latest[1] !== coordinates[1]) {
      next.set(id, [...existing, coordinates].slice(-maxTrailPoints))
    }
  }
  return next
}

export function trailCollectionForVehicle(vehicleId: string | undefined, trails: Map<string, [number, number][]>): AtlasVehicleTrailCollection {
  if (!vehicleId) return { type: 'FeatureCollection', features: [] }
  const coordinates = trails.get(vehicleId) ?? []
  if (coordinates.length < 2) return { type: 'FeatureCollection', features: [] }
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      id: `trail:${vehicleId}`,
      geometry: { type: 'LineString', coordinates },
      properties: {
        id: `trail:${vehicleId}`,
        vehicleId,
        provider: 'nta-gtfs-realtime',
      },
    }],
  }
}
