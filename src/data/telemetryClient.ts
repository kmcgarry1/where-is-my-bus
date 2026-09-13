import type { AtlasPointFeature } from './atlas.types'
import { readJsonResponse } from './httpClient'
import type { TelemetryMetric, TelemetryRange, TelemetryReading } from './telemetry.types'

interface TelemetryResponse {
  metrics: TelemetryMetric[]
  readings: TelemetryReading[]
}

const cache = new Map<string, Promise<TelemetryResponse>>()
const defaultRanges: TelemetryRange[] = ['6h', '24h', '7d', '30d']

export function defaultMetricForFeature(feature: AtlasPointFeature): TelemetryMetric | null {
  if (feature.properties.assetType === 'water-gauge') return { id: 'water-level', label: 'Water level', unit: 'm', decimals: 3 }
  if (feature.properties.assetType === 'noise-monitor') return metricForId('noise-laeq')
  const current = feature.properties.latestTelemetry?.[0]
  if (!current) return null
  return metricForId(current.metric)
}

export function metricsForFeature(feature: AtlasPointFeature): TelemetryMetric[] {
  if (feature.properties.assetType === 'water-gauge') return [{ id: 'water-level', label: 'Water level', unit: 'm', decimals: 3 }]
  if (feature.properties.assetType === 'noise-monitor') return [metricForId('noise-laeq')]
  const seen = new Set<string>()
  return (feature.properties.latestTelemetry ?? []).flatMap((reading) => {
    if (seen.has(reading.metric)) return []
    seen.add(reading.metric)
    return [metricForId(reading.metric)]
  })
}

export function rangesForFeature(feature: AtlasPointFeature): TelemetryRange[] {
  if (feature.properties.provider === 'dcc-sonitus') return ['6h', '24h']
  return defaultRanges
}

export async function fetchTelemetry(feature: AtlasPointFeature, metric: string, range: TelemetryRange): Promise<TelemetryResponse> {
  const url = telemetryUrl(feature, metric, range)
  const key = `${feature.properties.provider}:${feature.properties.id}:${metric}:${range}`
  if (!cache.has(key)) {
    const request = fetch(url).then(async (response) => {
      return await readJsonResponse<TelemetryResponse>(response, 'Telemetry')
    }).catch((error) => {
      cache.delete(key)
      throw error
    })
    cache.set(key, request)
  }
  return cache.get(key) as Promise<TelemetryResponse>
}

function telemetryUrl(feature: AtlasPointFeature, metric: string, range: TelemetryRange) {
  const assetId = encodeURIComponent(feature.properties.id)
  const params = new URLSearchParams({ metric, range })
  if (feature.properties.provider === 'opw-water') return `/api/providers/opw/gauges/${assetId}/telemetry?${params}`
  if (feature.properties.provider === 'dcc-sonitus') return `/api/providers/sonitus/monitors/${assetId}/telemetry?${params}`
  throw new Error('Provider does not expose historical telemetry')
}

function metricForId(id: string): TelemetryMetric {
  const metrics: Record<string, TelemetryMetric> = {
    'noise-laeq': { id, label: 'Noise LAeq', unit: 'dB(A)', decimals: 1 },
    'noise-lafmax': { id, label: 'Noise LAFmax', unit: 'dB(A)', decimals: 1 },
    pm2_5: { id, label: 'PM2.5', unit: 'ug/m3', decimals: 1 },
    pm10: { id, label: 'PM10', unit: 'ug/m3', decimals: 1 },
    no2: { id, label: 'NO2', unit: 'ug/m3', decimals: 1 },
    o3: { id, label: 'O3', unit: 'ug/m3', decimals: 1 },
  }
  return metrics[id] ?? { id, label: id, decimals: 1 }
}
