import type { AtlasMovingAssetCollection, AtlasMovingAssetFeature } from '../movingAsset.types'

export function deriveMissingMovingBearings(
  from: AtlasMovingAssetCollection,
  to: AtlasMovingAssetCollection,
): AtlasMovingAssetCollection {
  const previousById = new Map(from.features.map((feature) => [feature.properties.id, feature]))

  return {
    type: 'FeatureCollection',
    features: to.features.map((feature) => {
      if (Number.isFinite(feature.properties.bearing)) return feature
      const previous = previousById.get(feature.properties.id)
      if (!previous) return feature
      const bearing = calculateBearing(
        previous.geometry.coordinates as [number, number],
        feature.geometry.coordinates as [number, number],
      )
      if (bearing === undefined) return feature

      return {
        ...feature,
        properties: {
          ...feature.properties,
          bearing,
          sourceProperties: {
            ...feature.properties.sourceProperties,
            bearingSource: 'derived-from-previous-position',
          },
        },
      }
    }),
  }
}

export function interpolateMovingCollection(
  from: AtlasMovingAssetCollection,
  to: AtlasMovingAssetCollection,
  ratio: number,
): AtlasMovingAssetCollection {
  const boundedRatio = Math.min(Math.max(ratio, 0), 1)
  const previousById = new Map(from.features.map((feature) => [feature.properties.id, feature]))

  return {
    type: 'FeatureCollection',
    features: to.features.map((feature) => interpolateFeature(previousById.get(feature.properties.id), feature, boundedRatio)),
  }
}

function calculateBearing(from: [number, number], to: [number, number]) {
  if (from[0] === to[0] && from[1] === to[1]) return undefined

  const fromLon = degreesToRadians(from[0])
  const fromLat = degreesToRadians(from[1])
  const toLon = degreesToRadians(to[0])
  const toLat = degreesToRadians(to[1])
  const deltaLon = toLon - fromLon
  const y = Math.sin(deltaLon) * Math.cos(toLat)
  const x = Math.cos(fromLat) * Math.sin(toLat)
    - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLon)
  return (radiansToDegrees(Math.atan2(y, x)) + 360) % 360
}

function degreesToRadians(value: number) {
  return value * Math.PI / 180
}

function radiansToDegrees(value: number) {
  return value * 180 / Math.PI
}

function interpolateFeature(
  previous: AtlasMovingAssetFeature | undefined,
  next: AtlasMovingAssetFeature,
  ratio: number,
): AtlasMovingAssetFeature {
  if (!previous || ratio >= 1) {
    return {
      ...next,
      properties: {
        ...next.properties,
        interpolated: false,
        sourceProperties: {
          ...next.properties.sourceProperties,
          movementInterpolation: 'measured',
        },
      },
    }
  }

  const from = previous.geometry.coordinates as [number, number]
  const to = next.geometry.coordinates as [number, number]
  return {
    ...next,
    geometry: {
      ...next.geometry,
      coordinates: [
        from[0] + (to[0] - from[0]) * ratio,
        from[1] + (to[1] - from[1]) * ratio,
      ],
    },
    properties: {
      ...next.properties,
      interpolated: true,
      sourceProperties: {
        ...next.properties.sourceProperties,
        movementInterpolation: 'visual-transition',
        previousRenderedCoordinates: from,
        measuredCoordinates: to,
      },
    },
  }
}
