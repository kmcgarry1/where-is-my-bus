import type { AtlasFeatureCollection, AtlasProvider } from '../../atlas.types'
import { readJsonResponse } from '../../httpClient'

interface SonitusMonitorResponse {
  collection: AtlasFeatureCollection
}

export const sonitusProvider: AtlasProvider = {
  id: 'dcc-sonitus',
  name: 'DCC Sonitus',
  attribution: 'Dublin City Council / Sonitus Systems',
  refreshIntervalMs: 5 * 60 * 1000,
  async fetchAssets() {
    const response = await fetch('/api/providers/sonitus/monitors')
    const payload = await readJsonResponse<SonitusMonitorResponse>(response, 'Sonitus')
    return payload.collection
  },
}
