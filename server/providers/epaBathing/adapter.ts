import proj4 from 'proj4'
import type { AtlasIncidentCollection, AtlasIncidentFeature, AtlasIncidentSeverity, AtlasIncidentStatus } from '../../../src/data/incident.types.ts'
import type { EpaBathingAlert, EpaBathingLocation } from './schemas.ts'

proj4.defs('EPSG:29903', '+proj=tmerc +lat_0=53.5 +lon_0=-8 +k=1.000035 +x_0=200000 +y_0=250000 +a=6377340.189 +rf=299.3249646 +towgs84=482.530,-130.596,564.557,-1.042,-0.214,-0.631,8.150 +units=m +no_defs +type=crs')

export function adaptEpaBathingAlerts(alerts: EpaBathingAlert[], locations: EpaBathingLocation[]): AtlasIncidentCollection {
  const locationsByBeachId = new Map(locations.map((location) => [location.beach_id, location]))
  const features: AtlasIncidentFeature[] = alerts.flatMap((alert) => {
    const location = locationsByBeachId.get(alert.beach_id)
    if (!location || typeof location.easting !== 'number' || typeof location.northing !== 'number') return []
    const [longitude, latitude] = proj4('EPSG:29903', 'WGS84', [location.easting, location.northing])
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return []
    const endedAt = toIso(alert.incident_end_date)
    const id = `epa-bathing-water:${alert.incident_id}`

    return [{
      type: 'Feature',
      id,
      geometry: { type: 'Point', coordinates: [longitude, latitude] },
      properties: {
        id,
        provider: 'epa-bathing-water',
        providerName: 'EPA Bathing Water',
        source: 'provider',
        type: 'bathing-water-restriction',
        severity: severityForRestriction(alert.bathing_restriction_type),
        status: incidentStatus(endedAt),
        title: `${alert.beach_name} restriction`,
        description: alert.incident_description ?? alert.bathing_restriction_type ?? undefined,
        startedAt: toIso(alert.incident_start_date) ?? new Date().toISOString(),
        endedAt,
        lastUpdatedAt: toIso(alert.last_updated),
        relatedAssetIds: [],
        sourceProperties: {
          beachId: alert.beach_id,
          county: alert.county_name,
          localAuthority: alert.local_authority_name,
          restrictionType: alert.bathing_restriction_type,
          expectedDurationDays: alert.incident_expected_duration,
          noticePdf: alert.bathing_notice_pdf,
          annualClassification: location.current_annual_water_quality_classification,
        },
      },
    }]
  })

  return { type: 'FeatureCollection', features }
}

function toIso(value?: string | null) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? undefined : date.toISOString()
}

function incidentStatus(endedAt?: string): AtlasIncidentStatus {
  if (!endedAt) return 'active'
  return Date.parse(endedAt) > Date.now() ? 'monitoring' : 'resolved'
}

function severityForRestriction(type?: string | null): AtlasIncidentSeverity {
  const value = type?.toLowerCase() ?? ''
  if (value.includes('prohibited') || value.includes('do not swim')) return 'critical'
  if (value.includes('advice') || value.includes('not to swim')) return 'major'
  if (value.includes('prior warning')) return 'minor'
  return 'info'
}
