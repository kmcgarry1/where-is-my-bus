/** Browser requests to the local NTA middleware; upstream credentials stay on the server. */
export interface RouteResult {
  routeId: string
  shortName?: string
  longName?: string
  operator?: string
  headsigns: string[]
}

const REALTIME_TIMEOUT_MS = 20_000
const STATIC_LOOKUP_TIMEOUT_MS = 120_000

export async function requestTransit<T>(
  path: string,
  params = new URLSearchParams(),
  signal?: AbortSignal,
): Promise<T> {
  // Stop-scoped vehicles and searches can require a cold national GTFS index.
  const usesRealtimeSnapshot = (path === 'vehicles' && !params.has('stopId')) || path === 'alerts'
  const timeout = AbortSignal.timeout(
    usesRealtimeSnapshot ? REALTIME_TIMEOUT_MS : STATIC_LOOKUP_TIMEOUT_MS,
  )
  let response: Response
  try {
    response = await fetch(`/api/providers/nta/${path}?${params}`, {
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    })
  } catch (cause) {
    if (signal?.aborted) throw cause
    throw new Error('Bus information is taking longer than expected. Please try again.')
  }
  if (!response.ok) throw new Error('Bus data could not be loaded. Please try again.')
  return response.json()
}
