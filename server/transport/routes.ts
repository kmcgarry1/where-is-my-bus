import type { Connect } from 'vite'
import type { AtlasEtaPrediction } from '../../src/data/movingAsset.types.ts'
import { readRouteUrl, sendJson } from '../providers/http.ts'
import {
  etaPredictions,
  journeySegmentSummary,
  journeySegments,
  observedStopArrivals,
  recordEtaPrediction,
  stopArrivalSummary,
  vehicleObservationSummary,
  vehicleObservations,
  type JourneySegmentQuery,
  type PredictionQuery,
  type StopArrivalQuery,
  type VehicleObservationQuery,
} from './historyStore.ts'

export function transportRoutes(): Connect.NextHandleFunction {
  return async (request, response, next) => {
    const url = readRouteUrl(request)

    if (url.pathname === '/api/transport/vehicle-observations') {
      try {
        sendJson(response, 200, {
          observations: await vehicleObservations(vehicleQuery(url)),
          syncedAt: new Date().toISOString(),
        })
      } catch (error) {
        sendJson(response, 500, { error: error instanceof Error ? error.message : 'Vehicle observation history request failed' })
      }
      return
    }

    if (url.pathname === '/api/transport/vehicle-observations/summary') {
      try {
        sendJson(response, 200, {
          summary: await vehicleObservationSummary(vehicleQuery(url)),
          syncedAt: new Date().toISOString(),
        })
      } catch (error) {
        sendJson(response, 500, { error: error instanceof Error ? error.message : 'Vehicle observation summary request failed' })
      }
      return
    }

    if (url.pathname === '/api/transport/eta-predictions' && request.method === 'GET') {
      try {
        sendJson(response, 200, {
          predictions: await etaPredictions(predictionQuery(url)),
          syncedAt: new Date().toISOString(),
        })
      } catch (error) {
        sendJson(response, 500, { error: error instanceof Error ? error.message : 'ETA prediction history request failed' })
      }
      return
    }

    if (url.pathname === '/api/transport/stop-arrivals') {
      try {
        sendJson(response, 200, {
          arrivals: await observedStopArrivals(stopArrivalQuery(url)),
          syncedAt: new Date().toISOString(),
        })
      } catch (error) {
        sendJson(response, 500, { error: error instanceof Error ? error.message : 'Observed stop arrival request failed' })
      }
      return
    }

    if (url.pathname === '/api/transport/stop-arrivals/summary') {
      try {
        sendJson(response, 200, {
          summary: await stopArrivalSummary(stopArrivalQuery(url)),
          syncedAt: new Date().toISOString(),
        })
      } catch (error) {
        sendJson(response, 500, { error: error instanceof Error ? error.message : 'Observed stop arrival summary request failed' })
      }
      return
    }

    if (url.pathname === '/api/transport/journey-segments') {
      try {
        sendJson(response, 200, {
          segments: await journeySegments(journeySegmentQuery(url)),
          syncedAt: new Date().toISOString(),
        })
      } catch (error) {
        sendJson(response, 500, { error: error instanceof Error ? error.message : 'Journey segment request failed' })
      }
      return
    }

    if (url.pathname === '/api/transport/journey-segments/summary') {
      try {
        sendJson(response, 200, {
          summary: await journeySegmentSummary(journeySegmentQuery(url)),
          syncedAt: new Date().toISOString(),
        })
      } catch (error) {
        sendJson(response, 500, { error: error instanceof Error ? error.message : 'Journey segment summary request failed' })
      }
      return
    }

    if (url.pathname === '/api/transport/eta-predictions' && request.method === 'POST') {
      try {
        const body = await readJsonBody(request)
        if (!isRecord(body) || !isEtaPrediction(body.prediction)) {
          sendJson(response, 400, { error: 'prediction is required' })
          return
        }
        const record = await recordEtaPrediction(body.prediction, stringValue(body.predictorVersion) ?? 'baseline-v1')
        sendJson(response, 201, { record })
      } catch (error) {
        sendJson(response, 500, { error: error instanceof Error ? error.message : 'ETA prediction record request failed' })
      }
      return
    }

    next()
  }
}

function vehicleQuery(url: URL): VehicleObservationQuery {
  return {
    vehicleId: optionalParam(url, 'vehicleId'),
    routeId: optionalParam(url, 'routeId'),
    tripId: optionalParam(url, 'tripId'),
    since: optionalParam(url, 'since'),
    until: optionalParam(url, 'until'),
    limit: numberParam(url, 'limit'),
  }
}

function predictionQuery(url: URL): PredictionQuery {
  return {
    ...vehicleQuery(url),
    targetStopId: optionalParam(url, 'targetStopId'),
  }
}

function stopArrivalQuery(url: URL): StopArrivalQuery {
  return {
    ...vehicleQuery(url),
    stopId: optionalParam(url, 'stopId'),
  }
}

function journeySegmentQuery(url: URL): JourneySegmentQuery {
  return {
    ...vehicleQuery(url),
    fromStopId: optionalParam(url, 'fromStopId'),
    toStopId: optionalParam(url, 'toStopId'),
  }
}

function optionalParam(url: URL, key: string) {
  return url.searchParams.get(key)?.trim() || undefined
}

function numberParam(url: URL, key: string) {
  const value = Number(url.searchParams.get(key))
  return Number.isFinite(value) ? value : undefined
}

function readJsonBody(request: Connect.IncomingMessage) {
  return new Promise<unknown>((resolve, reject) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk) => {
      body += chunk
      if (body.length > 1_000_000) reject(new Error('Request body is too large'))
    })
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : undefined)
      } catch {
        reject(new Error('Request body is not valid JSON'))
      }
    })
    request.on('error', reject)
  })
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isEtaPrediction(value: unknown): value is AtlasEtaPrediction {
  return isRecord(value)
    && typeof value.status === 'string'
    && typeof value.vehicleId === 'string'
    && typeof value.confidence === 'string'
    && typeof value.calculatedAt === 'string'
    && typeof value.method === 'string'
    && isRecord(value.evidence)
}
