import { readJsonResponse } from '../../httpClient'
import type { AtlasStopService } from '../../movingAsset.types'

interface NtaStopServicesResponse {
  source: 'configured' | 'recommended' | 'unavailable'
  services: AtlasStopService[]
  syncedAt: string
}

export async function fetchNtaStopServices(stopId: string, routeIds: string[] = []): Promise<NtaStopServicesResponse> {
  const params = new URLSearchParams({ stopId })
  for (const routeId of routeIds) params.append('routeId', routeId)
  const response = await fetch(`/api/providers/nta/stop-services?${params}`)
  return await readJsonResponse<NtaStopServicesResponse>(response, 'NTA stop services')
}
