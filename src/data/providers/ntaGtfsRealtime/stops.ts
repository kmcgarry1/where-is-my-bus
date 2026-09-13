import { readJsonResponse } from '../../httpClient'
import type { AtlasTransitStopCollection } from '../../movingAsset.types'

interface NtaStopsResponse {
  source: 'configured' | 'recommended' | 'unavailable'
  collection: AtlasTransitStopCollection
  syncedAt: string
}

export async function fetchNtaTransitStops(): Promise<NtaStopsResponse> {
  const response = await fetch('/api/providers/nta/stops')
  return await readJsonResponse<NtaStopsResponse>(response, 'NTA static stops')
}
