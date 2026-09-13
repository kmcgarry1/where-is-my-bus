export type TelemetryValue = number | null
export type TelemetryQuality = 'valid' | 'suspect' | 'invalid' | 'unknown'
export type MeasurementCondition = 'normal' | 'elevated' | 'high' | 'unknown'
export type TelemetryRange = '6h' | '24h' | '7d' | '30d'
export type TelemetryQueryStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error'

export interface TelemetryReading {
  assetId: string
  metric: string
  value: TelemetryValue
  unit?: string
  observedAt: string
  provider: string
  quality?: TelemetryQuality
  condition?: MeasurementCondition
}

export interface TelemetryMetric {
  id: string
  label: string
  unit?: string
  description?: string
  decimals?: number
}

export interface TelemetrySeries {
  metric: TelemetryMetric
  readings: TelemetryReading[]
}

export interface TelemetryQueryState {
  assetId: string
  metric: string
  range: TelemetryRange
  status: TelemetryQueryStatus
  readings: TelemetryReading[]
  error?: string
}
