import { readJsonResponse } from '../../httpClient'
import type { AtlasMovingAssetCollection, AtlasMovingAssetProvider } from '../../movingAsset.types'

interface NtaVehicleResponse {
  collection: AtlasMovingAssetCollection
  source: 'live' | 'fixture'
  syncedAt: string
}

export const ntaMovingProvider: AtlasMovingAssetProvider = {
  id: 'nta-gtfs-realtime',
  name: 'NTA GTFS-Realtime',
  attribution: 'National Transport Authority / Transport for Ireland GTFS-Realtime',
  refreshIntervalMs: 25 * 1000,
  async fetchMovingAssets() {
    const response = await fetch('/api/providers/nta/vehicles')
    const payload = await readJsonResponse<NtaVehicleResponse>(response, 'NTA GTFS-Realtime')
    return payload.collection
  },
}
