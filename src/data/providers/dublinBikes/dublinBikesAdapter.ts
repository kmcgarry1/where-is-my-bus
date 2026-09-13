import type { AtlasFeatureCollection, AtlasPointFeature, AtlasStatus } from '../../atlas.types'
import { ageInMs, BIKES_STALE_MS } from '../time'
import type { DublinBikesGeoJson, DublinBikesStationProperties } from './dublinBikes.types'

export function adaptDublinBikes(input: DublinBikesGeoJson): AtlasFeatureCollection {
  const features: AtlasPointFeature[] = input.features
    .filter((feature) => feature.geometry?.type === 'Point' && feature.properties?.station_id)
    .map((feature) => {
      const properties = feature.properties as DublinBikesStationProperties
      const observedAt = epochSecondsToIso(properties.last_reported ?? properties.last_updated)
      const status = deriveBikeStatus(properties)
      const stationId = properties.station_id as string

      return {
        type: 'Feature',
        id: `dublin-bikes:${stationId}`,
        geometry: feature.geometry,
        properties: {
          id: `dublin-bikes:${stationId}`,
          provider: 'dublin-bikes',
          providerName: 'Dublin City Council / DublinBikes',
          assetType: 'bike-station',
          name: titleCase(properties.name || properties.address || `Station ${stationId}`),
          status,
          observedAt,
          value: properties.num_bikes_available,
          unit: 'bikes',
          stale: isStale(observedAt),
          sourceProperties: {
            stationId,
            address: properties.address,
            availableBikes: properties.num_bikes_available,
            availableDocks: properties.num_docks_available,
            capacity: properties.capacity,
            renting: properties.is_renting,
            returning: properties.is_returning,
            installed: properties.is_installed,
          },
        },
      }
    })

  return { type: 'FeatureCollection', features }
}

function deriveBikeStatus(properties: DublinBikesStationProperties): AtlasStatus {
  if (
    properties.is_installed === undefined
    || properties.is_renting === undefined
    || properties.is_returning === undefined
    || properties.num_bikes_available === undefined
    || properties.num_docks_available === undefined
  ) return 'unknown'
  if (!properties.is_installed || !properties.is_renting || !properties.is_returning) return 'critical'
  if (properties.num_bikes_available === 0 || properties.num_docks_available === 0) return 'warning'
  return 'normal'
}

function isStale(observedAt?: string) {
  const age = ageInMs(observedAt)
  return age === null || age > BIKES_STALE_MS
}

function epochSecondsToIso(value?: number) {
  return value ? new Date(value * 1000).toISOString() : undefined
}

function titleCase(value: string) {
  return value.toLocaleLowerCase('en-IE').replace(/\b\w/g, (letter) => letter.toLocaleUpperCase('en-IE'))
}
