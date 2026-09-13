import assert from 'node:assert/strict'
import test from 'node:test'
import { predictArrivalAtStop, predictNextStopArrival } from '../src/data/moving/etaPredictor.ts'

const now = '2026-09-02T12:00:00.000Z'

test('normal movement predicts the next sequenced stop from route progress', () => {
  const prediction = predictNextStopArrival({
    vehicle: vehicleAt(-6, 0.0108, { speed: 5, observedAt: now }),
    tripContext: tripContext(),
    recentPositions: [
      observation(-6, 0.0090, -60),
      observation(-6, 0.0100, -30),
      observation(-6, 0.0108, 0),
    ],
    now,
  })

  assert.equal(prediction.status, 'available')
  assert.equal(prediction.stopId, 'stop-b')
  assert.equal(prediction.confidence, 'high')
  assert.ok((prediction.distanceRemainingMeters ?? 0) > 900)
  assert.ok((prediction.estimatedTravelSeconds ?? 0) > 120)
  assert.ok(prediction.remainingRoute?.geometry.coordinates.length)
})

test('temporarily stationary vehicles still receive a finite ETA from recent progression', () => {
  const prediction = predictNextStopArrival({
    vehicle: vehicleAt(-6, 0.0108, { speed: 0, observedAt: now }),
    tripContext: tripContext(),
    recentPositions: [
      observation(-6, 0.0090, -60),
      observation(-6, 0.0100, -30),
      observation(-6, 0.0108, 0),
    ],
    now,
  })

  assert.equal(prediction.status, 'available')
  assert.equal(prediction.stopId, 'stop-b')
  assert.ok(Number.isFinite(prediction.estimatedTravelSeconds))
})

test('stale realtime position suppresses realtime ETA and lowers confidence', () => {
  const prediction = predictNextStopArrival({
    vehicle: vehicleAt(-6, 0.0108, { observedAt: '2026-09-02T11:51:00.000Z' }),
    tripContext: tripContext(),
    recentPositions: [],
    now,
  })

  assert.equal(prediction.status, 'unavailable')
  assert.equal(prediction.confidence, 'low')
  assert.match(prediction.evidence.reason ?? '', /stale/i)
})

test('passed stops advance to the following stop', () => {
  const prediction = predictNextStopArrival({
    vehicle: vehicleAt(-6, 0.021, { speed: 6, observedAt: now }),
    tripContext: tripContext(),
    recentPositions: [],
    now,
  })

  assert.equal(prediction.status, 'available')
  assert.equal(prediction.stopId, 'stop-c')
})

test('route loops use sequenced progress instead of nearest geographic stop', () => {
  const context = tripContext({
    shape: [
      shapePoint(-6, 0, 0),
      shapePoint(-6, 0.01, 1),
      shapePoint(-6.01, 0.01, 2),
      shapePoint(-6.01, 0, 3),
      shapePoint(-6, 0, 4),
      shapePoint(-6, 0.02, 5),
    ],
    stops: [
      stop('loop-start', -6, 0.001, 60, 1),
      stop('loop-near-but-earlier', -6.0001, 0.0004, 180, 2),
      stop('loop-next', -6, 0.016, 420, 3),
    ],
  })
  const prediction = predictNextStopArrival({
    vehicle: vehicleAt(-6, 0.012, { speed: 5, observedAt: now }),
    tripContext: context,
    recentPositions: [],
    now,
  })

  assert.equal(prediction.status, 'available')
  assert.equal(prediction.stopId, 'loop-next')
})

test('missing shape falls back to schedule or provider timing with low confidence', () => {
  const prediction = predictNextStopArrival({
    vehicle: vehicleAt(-6, 0.0108, { observedAt: now, nextStopId: 'stop-b', scheduleDeviationSeconds: 120 }),
    tripContext: tripContext({ shape: [] }),
    recentPositions: [],
    now,
  })

  assert.equal(prediction.status, 'available')
  assert.equal(prediction.method, 'provider-trip-update')
  assert.equal(prediction.confidence, 'low')
  assert.equal(prediction.stopId, 'stop-b')
})

test('missing realtime history uses schedule-weighted prediction with lower confidence', () => {
  const prediction = predictNextStopArrival({
    vehicle: vehicleAt(-6, 0.0108, { observedAt: now }),
    tripContext: tripContext(),
    recentPositions: [],
    now,
  })

  assert.equal(prediction.status, 'available')
  assert.equal(prediction.confidence, 'medium')
  assert.ok(prediction.evidence.scheduleRemainingSeconds !== undefined)
})

test('GPS outliers do not dominate recent progression speed', () => {
  const prediction = predictNextStopArrival({
    vehicle: vehicleAt(-6, 0.0108, { speed: 0, observedAt: now }),
    tripContext: tripContext(),
    recentPositions: [
      observation(-6, 0.0090, -90),
      observation(-6.5, 0.5, -60),
      observation(-6, 0.0100, -30),
      observation(-6, 0.0108, 0),
    ],
    now,
  })

  assert.equal(prediction.status, 'available')
  assert.ok((prediction.evidence.recentSpeedMps ?? 0) < 20)
  assert.ok((prediction.estimatedTravelSeconds ?? 0) < 600)
})

test('target-stop prediction can estimate arrivals beyond the immediate next stop', () => {
  const prediction = predictArrivalAtStop({
    vehicle: vehicleAt(-6, 0.0108, { speed: 5, observedAt: now }),
    tripContext: tripContext(),
    targetStopId: 'stop-c',
    recentPositions: [
      observation(-6, 0.0090, -60),
      observation(-6, 0.0100, -30),
      observation(-6, 0.0108, 0),
    ],
    now,
  })

  assert.equal(prediction.status, 'available')
  assert.equal(prediction.stopId, 'stop-c')
  assert.ok((prediction.estimatedTravelSeconds ?? 0) > 300)
})

test('target-stop prediction excludes vehicles that already passed the target stop', () => {
  const prediction = predictArrivalAtStop({
    vehicle: vehicleAt(-6, 0.033, { speed: 5, observedAt: now }),
    tripContext: tripContext(),
    targetStopId: 'stop-b',
    recentPositions: [],
    now,
  })

  assert.equal(prediction.status, 'unavailable')
  assert.match(prediction.evidence.reason ?? '', /ahead/i)
})

function tripContext(overrides = {}) {
  return {
    source: 'configured',
    trip: { tripId: 'trip-1', routeId: 'route-1', shapeId: 'shape-1' },
    route: { routeId: 'route-1', shortName: '220' },
    stops: [
      stop('stop-a', -6, 0.005, 60, 1),
      stop('stop-b', -6, 0.020, 420, 2),
      stop('stop-c', -6, 0.032, 720, 3),
    ],
    shape: [
      shapePoint(-6, 0, 0),
      shapePoint(-6, 0.012, 1),
      shapePoint(-6, 0.024, 2),
      shapePoint(-6, 0.036, 3),
    ],
    ...overrides,
  }
}

function vehicleAt(longitude, latitude, overrides = {}) {
  return {
    type: 'Feature',
    id: 'nta-gtfs-realtime:test',
    geometry: { type: 'Point', coordinates: [longitude, latitude] },
    properties: {
      id: 'nta-gtfs-realtime:test',
      provider: 'nta-gtfs-realtime',
      providerName: 'NTA GTFS-Realtime',
      assetType: 'bus',
      name: 'Route 220',
      routeId: 'route-1',
      routeLabel: '220',
      tripId: 'trip-1',
      vehicleId: 'bus-1',
      speed: overrides.speed,
      scheduleDeviationSeconds: overrides.scheduleDeviationSeconds,
      nextStopName: undefined,
      observedAt: overrides.observedAt ?? now,
      status: 'normal',
      sourceProperties: {
        source: 'test',
        nextStopId: overrides.nextStopId,
        scheduleDeviationSeconds: overrides.scheduleDeviationSeconds,
      },
    },
  }
}

function stop(stopId, longitude, latitude, arrivalSeconds, stopSequence) {
  return {
    tripId: 'trip-1',
    stopId,
    name: stopId,
    latitude,
    longitude,
    arrivalSeconds: 12 * 3600 + arrivalSeconds,
    departureSeconds: 12 * 3600 + arrivalSeconds,
    stopSequence,
  }
}

function shapePoint(longitude, latitude, sequence) {
  return { longitude, latitude, sequence }
}

function observation(longitude, latitude, offsetSeconds) {
  return {
    vehicleId: 'nta-gtfs-realtime:test',
    longitude,
    latitude,
    observedAt: new Date(Date.parse(now) + offsetSeconds * 1000).toISOString(),
  }
}
