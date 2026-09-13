import { readJsonResponse } from '../../httpClient'
import type { AtlasIncidentCollection, AtlasIncidentProvider } from '../../incident.types'

interface NtaAlertsResponse {
  collection: AtlasIncidentCollection
  source: 'live' | 'fixture'
  syncedAt: string
}

export const ntaIncidentProvider: AtlasIncidentProvider = {
  id: 'nta-gtfs-realtime',
  name: 'NTA GTFS-Realtime Alerts',
  attribution: 'National Transport Authority / Transport for Ireland GTFS-Realtime',
  refreshIntervalMs: 60 * 1000,
  async fetchIncidents() {
    const response = await fetch('/api/providers/nta/alerts')
    const payload = await readJsonResponse<NtaAlertsResponse>(response, 'NTA GTFS-Realtime alerts')
    return payload.collection
  },
}
