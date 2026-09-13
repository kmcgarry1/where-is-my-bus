import type { AtlasFeatureCollection, AtlasFeatureProperties, AtlasPointFeature, AtlasStatus } from '../../../src/data/atlas.types.ts'
import type { MeasurementCondition, TelemetryMetric, TelemetryReading } from '../../../src/data/telemetry.types.ts'
import { SONITUS_STALE_MS, ageInMs, toIsoFromDublinLocal } from '../../../src/data/providers/time.ts'
import type { SonitusMonitor } from './schemas.ts'

const metricDefinitions: TelemetryMetric[] = [
  { id: 'noise-laeq', label: 'Noise LAeq', unit: 'dB(A)', decimals: 1 },
  { id: 'noise-lafmax', label: 'Noise LAFmax', unit: 'dB(A)', decimals: 1 },
  { id: 'pm2_5', label: 'PM2.5', unit: 'ug/m3', decimals: 1 },
  { id: 'pm10', label: 'PM10', unit: 'ug/m3', decimals: 1 },
  { id: 'no2', label: 'NO2', unit: 'ug/m3', decimals: 1 },
  { id: 'o3', label: 'O3', unit: 'ug/m3', decimals: 1 },
]

export function adaptSonitusMonitors(monitors: SonitusMonitor[]): AtlasFeatureCollection {
  const features: AtlasPointFeature[] = monitors.flatMap((monitor) => {
    const latitude = Number.parseFloat(monitor.latitude)
    const longitude = Number.parseFloat(monitor.longitude)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return []

    const latestReadings = latestTelemetryForMonitor(monitor)
    const observedAt = latestReadings[0]?.observedAt
    const status = deriveSensorHealth(observedAt, monitor.frozen)

    const properties: AtlasFeatureProperties = {
      id: `dcc-sonitus:${monitor.code}`,
      provider: 'dcc-sonitus',
      providerName: 'Dublin City Council / Sonitus',
      assetType: monitor.monitor_type.category === 'noise' ? 'noise-monitor' : 'air-quality-monitor',
      name: `${monitor.label} - ${monitor.location}`,
      status,
      observedAt,
      value: latestReadings[0]?.value ?? undefined,
      unit: latestReadings[0]?.unit,
      stale: status === 'warning' || status === 'offline',
      latestTelemetry: latestReadings,
      sourceProperties: {
        monitorId: monitor.monitor_id,
        code: monitor.code,
        serialNumber: monitor.serial_number,
        monitorType: monitor.monitor_type.name,
        category: monitor.monitor_type.category,
        manufacturer: monitor.monitor_type.manufacturer,
        currentRating: monitor.current_rating,
        description: monitor.description,
      },
    }

    return [{
      type: 'Feature',
      id: properties.id,
      geometry: { type: 'Point', coordinates: [longitude, latitude] },
      properties,
    }]
  })

  return { type: 'FeatureCollection', features }
}

export function latestTelemetryForMonitor(monitor: SonitusMonitor): TelemetryReading[] {
  const reading = monitor.latest_reading
  if (!reading?.recorded_at) return []
  const observedAt = toIsoFromDublinLocal(reading.recorded_at)
  if (!observedAt) return []
  const condition = measurementCondition(monitor.current_rating)

  const source: Array<[string, number | null | undefined]> = [
    ['noise-laeq', reading.laeq],
    ['noise-lafmax', reading.lafmax],
    ['pm2_5', reading.pm2_5],
    ['pm10', reading.pm10],
    ['no2', reading.no2],
    ['o3', reading.o3],
  ]

  return source.flatMap(([metric, value]) => {
    const definition = metricDefinitions.find((item) => item.id === metric)
    if (!definition || typeof value !== 'number' || !Number.isFinite(value)) return []
    return [{
      assetId: `dcc-sonitus:${monitor.code}`,
      metric,
      value,
      unit: definition.unit,
      observedAt,
      provider: 'dcc-sonitus',
      quality: reading.status === 'red' ? 'suspect' : 'valid',
      condition,
    } satisfies TelemetryReading]
  })
}

export function sonitusMetricsForCategory(category: 'noise' | 'air'): TelemetryMetric[] {
  return metricDefinitions.filter((metric) => category === 'noise'
    ? metric.id === 'noise-laeq'
    : !metric.id.startsWith('noise-'))
}

export function normaliseHistoricalReadings(assetId: string, metric: string, points: Array<[string, number | null]>): TelemetryReading[] {
  const definition = metricDefinitions.find((item) => item.id === metric)
  if (!definition) return []

  const deduped = new Map<string, TelemetryReading>()
  for (const [observedAt, value] of points) {
    if (!Date.parse(observedAt) || typeof value !== 'number' || !Number.isFinite(value)) continue
    deduped.set(observedAt, {
      assetId,
      metric,
      value,
      unit: definition.unit,
      observedAt,
      provider: 'dcc-sonitus',
      quality: 'valid',
    })
  }

  return [...deduped.values()].sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt))
}

function deriveSensorHealth(observedAt?: string, frozen?: boolean): AtlasStatus {
  if (frozen) return 'offline'
  const age = ageInMs(observedAt)
  if (age === null) return 'unknown'
  if (age <= SONITUS_STALE_MS.warning) return 'normal'
  if (age <= SONITUS_STALE_MS.offline) return 'warning'
  return 'offline'
}

function measurementCondition(rating?: number | null): MeasurementCondition {
  if (rating === null || rating === undefined) return 'unknown'
  if (rating <= 2) return 'normal'
  if (rating <= 4) return 'elevated'
  return 'high'
}
