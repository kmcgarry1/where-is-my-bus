import type { AtlasIncidentCollection, AtlasIncidentProvider } from '../../incident.types'
import { readJsonResponse } from '../../httpClient'

interface EpaBathingResponse {
  collection: AtlasIncidentCollection
}

export const epaBathingIncidentProvider: AtlasIncidentProvider = {
  id: 'epa-bathing-water',
  name: 'EPA Bathing Water',
  attribution: 'Environmental Protection Agency Bathing Water Open Data',
  refreshIntervalMs: 10 * 60 * 1000,
  async fetchIncidents() {
    const response = await fetch('/api/providers/epa/bathing-alerts')
    const payload = await readJsonResponse<EpaBathingResponse>(response, 'EPA Bathing Water')
    return payload.collection
  },
}
