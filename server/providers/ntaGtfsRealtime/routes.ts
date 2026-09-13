import type { Connect } from 'vite'
import { sendJson } from '../http.ts'
import { adaptNtaVehicles } from './adapter.ts'
import { adaptNtaServiceAlerts } from './alertsAdapter.ts'
import { fetchNtaServiceAlerts, fetchNtaVehiclePositions, ntaDiagnostics } from './client.ts'
import { fetchStaticGtfsRouteOptions, fetchStaticGtfsStopOptions, fetchStaticGtfsStopServices, fetchStaticGtfsTripContext } from './staticGtfs.ts'
import { recordVehicleSnapshot } from '../../transport/historyStore.ts'
import { insideBounds, matchesQuery, parseBounds, queryLimit } from './query.ts'

export function ntaGtfsRealtimeRoutes(): Connect.NextHandleFunction {
  return async (request, response, next) => {
    const url = new URL(request.url ?? '/', 'http://atlasops.local')
    if (!url.pathname.startsWith('/api/providers/nta/')) return next()
    let bounds
    try {
      bounds = parseBounds(url.searchParams.get('bounds'))
    } catch (error) {
      sendJson(response, 400, { error: (error as Error).message })
      return
    }
    const query = url.searchParams.get('q')?.trim() ?? ''
    if (url.pathname === '/api/providers/nta/diagnostics') {
      try {
        sendJson(response, 200, {
          diagnostics: await ntaDiagnostics(),
          checkedAt: new Date().toISOString(),
        })
      } catch (error) {
        sendJson(response, 500, { error: error instanceof Error ? error.message : 'NTA diagnostics failed' })
      }
      return
    }

    if (url.pathname === '/api/providers/nta/alerts') {
      try {
        const snapshot = await fetchNtaServiceAlerts()
        sendJson(response, 200, {
          collection: adaptNtaServiceAlerts(snapshot.alerts.filter((alert) => {
            const routeIds = url.searchParams.getAll('routeId')
            const tripId = url.searchParams.get('tripId')
            const stopId = url.searchParams.get('stopId')
            return routeIds.some((id) => alert.routeIds.includes(id)) || Boolean(tripId && alert.tripIds.includes(tripId)) || Boolean(stopId && alert.stopIds.includes(stopId))
          }), snapshot.source),
          source: snapshot.source,
          syncedAt: snapshot.fetchedAt,
        })
      } catch (error) {
        sendJson(response, 502, { error: error instanceof Error ? error.message : 'NTA GTFS-Realtime alerts request failed' })
      }
      return
    }

    if (url.pathname === '/api/providers/nta/routes') {
      try {
        const routes = query ? await fetchStaticGtfsRouteOptions(bounds) : { source: 'unavailable', routes: [] }
        sendJson(response, 200, {
          ...routes,
          routes: query ? routes.routes.filter((route) => matchesQuery(query, [route.routeId, route.shortName, route.longName, route.operator, ...route.headsigns])).slice(0, queryLimit(url.searchParams.get('limit'))) : [],
          syncedAt: new Date().toISOString(),
        })
      } catch (error) {
        sendJson(response, 502, { error: error instanceof Error ? error.message : 'NTA static GTFS route index request failed' })
      }
      return
    }

    if (url.pathname === '/api/providers/nta/stops') {
      try {
        const stops = query || bounds ? await fetchStaticGtfsStopOptions() : { source: 'unavailable', stops: [] }
        sendJson(response, 200, {
          source: stops.source,
          syncedAt: new Date().toISOString(),
          collection: {
            type: 'FeatureCollection',
            features: stops.stops.filter((stop) => (query || bounds) && insideBounds(stop.longitude, stop.latitude, bounds) && matchesQuery(query, [stop.stopId, stop.name])).slice(0, queryLimit(url.searchParams.get('limit'), query ? 30 : 200)).map((stop) => ({
              type: 'Feature',
              id: `nta-stop:${stop.stopId}`,
              geometry: {
                type: 'Point',
                coordinates: [stop.longitude, stop.latitude],
              },
              properties: {
                id: `nta-stop:${stop.stopId}`,
                provider: 'nta-gtfs-realtime',
                providerName: 'NTA GTFS Static',
                stopId: stop.stopId,
                name: stop.name || `Stop ${stop.stopId}`,
                sourceProperties: {
                  source: stops.source,
                },
              },
            })),
          },
        })
      } catch (error) {
        sendJson(response, 502, { error: error instanceof Error ? error.message : 'NTA static GTFS stops request failed' })
      }
      return
    }

    if (url.pathname === '/api/providers/nta/trip-context') {
      const tripId = url.searchParams.get('tripId')?.trim()
      if (!tripId) {
        sendJson(response, 400, { error: 'tripId is required' })
        return
      }
      try {
        sendJson(response, 200, {
          context: await fetchStaticGtfsTripContext(tripId),
          syncedAt: new Date().toISOString(),
        })
      } catch (error) {
        sendJson(response, 502, { error: error instanceof Error ? error.message : 'NTA static GTFS trip context request failed' })
      }
      return
    }

    if (url.pathname === '/api/providers/nta/stop-services') {
      const stopId = url.searchParams.get('stopId')?.trim()
      const routeIds = url.searchParams.getAll('routeId').flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean)
      if (!stopId) {
        sendJson(response, 400, { error: 'stopId is required' })
        return
      }
      try {
        const services = await fetchStaticGtfsStopServices(stopId, routeIds)
        sendJson(response, 200, {
          ...services,
          syncedAt: new Date().toISOString(),
        })
      } catch (error) {
        sendJson(response, 502, { error: error instanceof Error ? error.message : 'NTA static GTFS stop service request failed' })
      }
      return
    }

    if (url.pathname !== '/api/providers/nta/vehicles') {
      next()
      return
    }

    try {
      const snapshot = await fetchNtaVehiclePositions()
      const collection = adaptNtaVehicles(snapshot.vehicles, snapshot.source)
      const stopId = url.searchParams.get('stopId')
      const stopTrips = stopId ? new Set((await fetchStaticGtfsStopServices(stopId, [])).services.flatMap((service) => service.tripIds)) : undefined
      let history
      try {
        history = await recordVehicleSnapshot(collection, snapshot.source, snapshot.fetchedAt)
      } catch (error) {
        history = { error: error instanceof Error ? error.message : 'Vehicle observation recording failed' }
      }
      sendJson(response, 200, {
        collection: {
          ...collection,
          features: collection.features.filter((vehicle) => vehicle.properties.assetType === 'bus'
            && (!stopTrips || stopTrips.has(vehicle.properties.tripId ?? ''))
            && insideBounds(vehicle.geometry.coordinates[0]!, vehicle.geometry.coordinates[1]!, bounds)
            && (!url.searchParams.has('routeId') || url.searchParams.getAll('routeId').includes(vehicle.properties.routeId ?? ''))),
        },
        source: snapshot.source,
        syncedAt: snapshot.fetchedAt,
        history,
      })
    } catch (error) {
      sendJson(response, 502, { error: error instanceof Error ? error.message : 'NTA GTFS-Realtime request failed' })
    }
  }
}
