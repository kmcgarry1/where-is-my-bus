import type { AtlasMovingAssetCollection, AtlasMovingAssetFeature } from '../../../src/data/movingAsset.types.ts'
import type { NtaVehicleEntity } from './client.ts'

export function adaptNtaVehicles(vehicles: NtaVehicleEntity[], source: 'live' | 'fixture'): AtlasMovingAssetCollection {
  const features: AtlasMovingAssetFeature[] = vehicles.flatMap((vehicle) => {
    if (!Number.isFinite(vehicle.latitude) || !Number.isFinite(vehicle.longitude)) return []
    const observedAt = vehicle.timestamp ? new Date(vehicle.timestamp * 1000).toISOString() : new Date().toISOString()
    const id = `nta-gtfs-realtime:${vehicle.vehicleId ?? vehicle.id}`
    const routeLabel = vehicle.routeShortName ?? vehicle.routeId ?? vehicle.label

    return [{
      type: 'Feature',
      id,
      geometry: { type: 'Point', coordinates: [vehicle.longitude, vehicle.latitude] },
      properties: {
        id,
        provider: 'nta-gtfs-realtime',
        providerName: 'NTA GTFS-Realtime',
        assetType: classifyVehicle(routeLabel, vehicle.routeType),
        name: routeLabel ? `Route ${routeLabel}` : `Vehicle ${vehicle.vehicleId ?? vehicle.id}`,
        routeId: vehicle.routeId,
        routeLabel,
        tripId: vehicle.tripId,
        vehicleId: vehicle.vehicleId,
        bearing: vehicle.bearing,
        speed: vehicle.speed,
        scheduleStatus: vehicle.scheduleStatus,
        scheduleDeviationSeconds: vehicle.scheduleDeviationSeconds,
        nextStopName: vehicle.nextStopName,
        observedAt,
        status: source === 'fixture' ? 'unknown' : 'normal',
        interpolated: false,
        sourceProperties: {
          source,
          staticGtfsSource: vehicle.staticGtfsSource,
          feedEntityId: vehicle.id,
          routeShortName: vehicle.routeShortName,
          routeLongName: vehicle.routeLongName,
          agencyName: vehicle.agencyName,
          tripHeadsign: vehicle.tripHeadsign,
          directionId: vehicle.directionId,
          startDate: vehicle.startDate,
          startTime: vehicle.startTime,
          stopId: vehicle.stopId,
          currentStopSequence: vehicle.currentStopSequence,
          label: vehicle.label,
          licensePlate: vehicle.licensePlate,
          currentStatus: vehicle.currentStatus,
          congestionLevel: vehicle.congestionLevel,
          occupancyStatus: vehicle.occupancyStatus,
          scheduleSource: vehicle.scheduleSource,
          providerArrival: vehicle.providerArrival,
          nextStopId: vehicle.nextStopId,
        },
      },
    }]
  })

  return { type: 'FeatureCollection', features }
}

function classifyVehicle(routeLabel?: string, routeType?: string) {
  if (routeType !== undefined) {
    if (routeType === '3' || (Number(routeType) >= 700 && Number(routeType) < 800)) return 'bus'
    if (routeType === '0' || (Number(routeType) >= 900 && Number(routeType) < 1000)) return 'tram'
    if (routeType === '2' || (Number(routeType) >= 100 && Number(routeType) < 200)) return 'rail'
    return 'vehicle'
  }
  const route = routeLabel?.toLowerCase() ?? ''
  if (route.includes('luas')) return 'tram'
  if (route.includes('rail') || route.includes('dart')) return 'rail'
  if (route) return 'bus'
  return 'vehicle'
}
