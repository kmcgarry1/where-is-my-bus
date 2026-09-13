import { readJsonResponse } from '../../httpClient'
import type { AtlasTripContext } from '../../movingAsset.types'

interface NtaTripContextResponse {
  context: AtlasTripContext
  syncedAt: string
}

export async function fetchNtaTripContext(tripId: string): Promise<NtaTripContextResponse> {
  const params = new URLSearchParams({ tripId })
  const response = await fetch(`/api/providers/nta/trip-context?${params}`)
  return await readJsonResponse<NtaTripContextResponse>(response, 'NTA trip context')
}
