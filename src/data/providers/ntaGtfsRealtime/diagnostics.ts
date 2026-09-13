import { readJsonResponse } from '../../httpClient'

export interface NtaDiagnostics {
  realtime: {
    keyConfigured: boolean
    keyEnvName?: string
    mode: 'live' | 'fixture'
    vehicleEndpointOverride: boolean
    serviceAlertEndpointOverride: boolean
    tripUpdateEndpointOverride: boolean
    vehicleEndpoints: string[]
    serviceAlertEndpoints: string[]
    tripUpdateEndpoints: string[]
  }
  staticGtfs: {
    configured: boolean
    defaultRecommended?: boolean
    source: 'configured' | 'recommended' | 'unavailable'
    routeCount?: number
    tripCount?: number
    agencyCount?: number
    stopCount?: number
    error?: string
  }
  recommendedStaticGtfs: {
    url: string
    reachable: boolean
    contentType?: string
    contentLength?: number
    lastModified?: string
    error?: string
  }
}

export interface NtaDiagnosticsState {
  diagnostics: NtaDiagnostics | null
  loading: boolean
  checkedAt?: string
  error?: string
}

interface NtaDiagnosticsResponse {
  diagnostics: NtaDiagnostics
  checkedAt: string
}

export async function fetchNtaDiagnostics(): Promise<NtaDiagnosticsResponse> {
  const response = await fetch('/api/providers/nta/diagnostics')
  return await readJsonResponse<NtaDiagnosticsResponse>(response, 'NTA diagnostics')
}

export function emptyNtaDiagnosticsState(): NtaDiagnosticsState {
  return {
    diagnostics: null,
    loading: false,
  }
}
