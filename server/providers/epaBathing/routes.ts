import type { Connect } from 'vite'
import { sendJson } from '../http.ts'
import { adaptEpaBathingAlerts } from './adapter.ts'
import { fetchEpaBathingAlerts, fetchEpaBathingLocations } from './client.ts'

export function epaBathingRoutes(): Connect.NextHandleFunction {
  return async (request, response, next) => {
    const url = new URL(request.url ?? '/', 'http://atlasops.local')
    if (url.pathname !== '/api/providers/epa/bathing-alerts') {
      next()
      return
    }

    try {
      const [alerts, locations] = await Promise.all([fetchEpaBathingAlerts(), fetchEpaBathingLocations()])
      sendJson(response, 200, {
        collection: adaptEpaBathingAlerts(alerts, locations),
        syncedAt: new Date().toISOString(),
      })
    } catch (error) {
      sendJson(response, 502, { error: error instanceof Error ? error.message : 'EPA Bathing Water request failed' })
    }
  }
}
