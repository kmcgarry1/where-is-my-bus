import type { AtlasFeatureCollection, AtlasPointFeature, AtlasStatus } from '../../atlas.types'
import { ageInMs, OPW_RECENT_MS, OPW_STALE_MS } from '../time'
import type { OpwLatestGeoJson, OpwReadingProperties } from './opw.types'

export function adaptOpwLatest(input: OpwLatestGeoJson): AtlasFeatureCollection {
  const features: AtlasPointFeature[] = []
  const seenStations = new Set<string>()

  for (const feature of input.features) {
    const properties = feature.properties ?? {}
    const stationRef = properties.station_ref
    if (!stationRef || properties.sensor_ref !== '0001' || seenStations.has(stationRef)) continue
    if (Number(stationRef) > 41000) continue
    if (feature.geometry?.type !== 'Point') continue

    seenStations.add(stationRef)
    const observedAt = properties.datetime
    const status = deriveOpwStatus(observedAt)
    const value = Number.parseFloat(properties.value ?? '')
    const validValue = Number.isFinite(value) ? value : undefined
    const id = `opw-water:${stationRef}`

    features.push({
      type: 'Feature',
      id,
      geometry: feature.geometry,
      properties: {
        id,
        provider: 'opw-water',
        providerName: 'Office of Public Works / WaterLevel.ie',
        assetType: 'water-gauge',
        name: properties.station_name || `Station ${stationRef}`,
        status,
        observedAt,
        value: validValue,
        unit: 'm',
        stale: status === 'warning' || status === 'offline',
        latestTelemetry: validValue === undefined || !observedAt ? [] : [{
          assetId: id,
          metric: 'water-level',
          value: validValue,
          unit: 'm',
          observedAt,
          provider: 'opw-water',
          quality: 'valid',
        }],
        sourceProperties: pickOpwDetails(properties),
      },
    })
  }

  return { type: 'FeatureCollection', features }
}

function deriveOpwStatus(observedAt?: string): AtlasStatus {
  const age = ageInMs(observedAt)
  if (age === null) return 'unknown'
  if (age <= OPW_RECENT_MS) return 'normal'
  if (age <= OPW_STALE_MS) return 'warning'
  return 'offline'
}

function pickOpwDetails(properties: OpwReadingProperties): Record<string, unknown> {
  return {
    stationRef: properties.station_ref,
    sensorRef: properties.sensor_ref,
    regionId: properties.region_id,
    url: properties.url,
    csvFile: properties.csv_file,
  }
}
