import type {
  AtlasMovingAssetFeature,
  AtlasEtaPrediction,
} from '../movingAsset.types.ts'
import type { AtlasIncidentFeature } from '../incident.types.ts'

export interface DelayAssessment {
  category:
    | 'Service alert'
    | 'Running late'
    | 'Slow traffic nearby'
    | 'Stopped or slow movement'
    | 'Position data stale'
    | 'No clear delay detected'
  explanation: string
  inferred: boolean
}

export function assessDelay(
  vehicle: AtlasMovingAssetFeature,
  alerts: AtlasIncidentFeature[],
  eta?: AtlasEtaPrediction,
  now = Date.now(),
  stopId?: string,
): DelayAssessment {
  const properties = vehicle.properties
  const age = (now - Date.parse(properties.observedAt)) / 1000
  if (!Number.isFinite(age) || age > 300)
    return {
      category: 'Position data stale',
      explanation:
        'The last location is too old to judge current progress or arrival time.',
      inferred: false,
    }
  const alert = alerts.find(({ properties: item }) => {
    if (
      item.status === 'resolved' ||
      Date.parse(item.startedAt) > now ||
      (item.endedAt && Date.parse(item.endedAt) < now)
    )
      return false
    const source = item.sourceProperties
    const includes = (key: string, value?: string) =>
      Boolean(
        value && Array.isArray(source[key]) && source[key].includes(value),
      )
    return (
      includes('tripIds', properties.tripId) ||
      includes('routeIds', properties.routeId) ||
      includes(
        'stopIds',
        stopId ?? String(properties.sourceProperties.nextStopId ?? ''),
      )
    )
  })
  if (alert)
    return {
      category: 'Service alert',
      explanation: `${alert.properties.title}${alert.properties.description ? `: ${alert.properties.description}` : ''}`,
      inferred: false,
    }
  const congestion = String(
    properties.sourceProperties.congestionLevel ?? '',
  ).toUpperCase()
  if (['CONGESTION', 'SEVERE_CONGESTION'].includes(congestion))
    return {
      category: 'Slow traffic nearby',
      explanation:
        'The vehicle feed reports congestion. It does not give a confirmed arrival impact.',
      inferred: false,
    }
  const speed = eta?.evidence.recentSpeedMps ?? properties.speed
  if (speed !== undefined && speed >= 0 && speed < 1)
    return {
      category: 'Stopped or slow movement',
      explanation:
        'Recent movement is slow. The bus may be serving a stop, waiting at lights or in traffic; the cause is not confirmed.',
      inferred: true,
    }
  const delay =
    eta?.evidence.providerDelaySeconds ?? properties.scheduleDeviationSeconds
  if (delay !== undefined && delay > 60) {
    const inferred =
      properties.sourceProperties.scheduleSource === 'static-gtfs-estimate'
    return {
      category: 'Running late',
      explanation: `${inferred ? 'Schedule comparison suggests' : 'The feed reports'} about ${Math.round(delay / 60)} minutes behind schedule. No specific cause is available.`,
      inferred,
    }
  }
  return {
    category: 'No clear delay detected',
    explanation:
      'Available data does not identify a delay cause. This does not guarantee the bus is on time.',
    inferred: true,
  }
}
