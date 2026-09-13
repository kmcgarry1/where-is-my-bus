import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'

const dataDir = await mkdtemp(join(tmpdir(), 'atlasops-history-'))
process.env.ATLASOPS_DATA_DIR = dataDir

const {
  journeySegments,
  observedStopArrivals,
  recordVehicleSnapshot,
  vehicleObservationSummary,
} = await import('../server/transport/historyStore.ts')

test('vehicle snapshots persist observations without duplicating identical positions', async () => {
  const first = collection([vehicle({ observedAt: '2026-09-03T10:00:00.000Z', nextStopId: 'stop-a', sequence: 1 })])

  const firstRecord = await recordVehicleSnapshot(first, 'live', '2026-09-03T10:00:01.000Z')
  const duplicateRecord = await recordVehicleSnapshot(first, 'live', '2026-09-03T10:00:02.000Z')
  const summary = await vehicleObservationSummary()

  assert.equal(firstRecord.recordedObservationCount, 1)
  assert.equal(duplicateRecord.recordedObservationCount, 0)
  assert.equal(summary.observationCount, 1)
})

test('next-stop transitions derive observed arrivals and journey segments', async () => {
  await recordVehicleSnapshot(collection([vehicle({
    vehicleId: 'vehicle-2',
    featureId: 'nta-gtfs-realtime:vehicle-2',
    observedAt: '2026-09-03T10:00:00.000Z',
    nextStopId: 'stop-a',
    sequence: 1,
    scheduleDeviationSeconds: 60,
  })]), 'live', '2026-09-03T10:00:01.000Z')
  await recordVehicleSnapshot(collection([vehicle({
    vehicleId: 'vehicle-2',
    featureId: 'nta-gtfs-realtime:vehicle-2',
    observedAt: '2026-09-03T10:01:00.000Z',
    nextStopId: 'stop-b',
    sequence: 2,
    scheduleDeviationSeconds: 60,
    providerArrival: '2026-09-03T10:02:10.000Z',
  })]), 'live', '2026-09-03T10:01:01.000Z')
  await recordVehicleSnapshot(collection([vehicle({
    vehicleId: 'vehicle-2',
    featureId: 'nta-gtfs-realtime:vehicle-2',
    observedAt: '2026-09-03T10:04:00.000Z',
    nextStopId: 'stop-c',
    sequence: 3,
    scheduleDeviationSeconds: 90,
  })]), 'live', '2026-09-03T10:04:01.000Z')

  const arrivals = await observedStopArrivals({ tripId: 'trip-1' })
  const segments = await journeySegments({ tripId: 'trip-1' })

  assert.equal(arrivals.length, 2)
  assert.equal(arrivals[0].stopId, 'stop-a')
  assert.equal(arrivals[0].scheduledArrival, '2026-09-03T10:00:00.000Z')
  assert.equal(arrivals[1].stopId, 'stop-b')
  assert.equal(arrivals[1].providerPredictedArrival, '2026-09-03T10:02:10.000Z')
  assert.equal(segments.length, 1)
  assert.equal(segments[0].fromStopId, 'stop-a')
  assert.equal(segments[0].toStopId, 'stop-b')
  assert.equal(segments[0].durationSeconds, 180)
})

function collection(features) {
  return { type: 'FeatureCollection', features }
}

function vehicle(overrides) {
  return {
    type: 'Feature',
    id: overrides.featureId ?? 'nta-gtfs-realtime:vehicle-1',
    geometry: { type: 'Point', coordinates: [-6.26, 53.34] },
    properties: {
      id: overrides.featureId ?? 'nta-gtfs-realtime:vehicle-1',
      provider: 'nta-gtfs-realtime',
      providerName: 'NTA GTFS-Realtime',
      assetType: 'bus',
      name: 'Route 220',
      routeId: 'route-220',
      routeLabel: '220',
      tripId: 'trip-1',
      vehicleId: overrides.vehicleId ?? 'vehicle-1',
      bearing: 90,
      speed: 6,
      scheduleStatus: 'late',
      scheduleDeviationSeconds: overrides.scheduleDeviationSeconds,
      observedAt: overrides.observedAt,
      status: 'normal',
      sourceProperties: {
        nextStopId: overrides.nextStopId,
        currentStopSequence: overrides.sequence,
        providerArrival: overrides.providerArrival,
      },
    },
  }
}
