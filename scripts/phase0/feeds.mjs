import bindings from 'gtfs-realtime-bindings'
import { setTimeout as sleep } from 'node:timers/promises'
import { open, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import {
  boundedFetch,
  failure,
  identity,
  outputDirectory,
  readJson,
  jsonFile,
  distribution,
  cities,
  inside,
  samplingWindow,
} from './common.mjs'
import { activeService } from './static.mjs'

function camel(value) {
  if (Array.isArray(value)) return value.map(camel)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        camel(v),
      ]),
    )
  return value
}
export function decodeFeed(bytes, contentType) {
  const feed = contentType.includes('json')
    ? camel(JSON.parse(Buffer.from(bytes).toString('utf8')))
    : bindings.transit_realtime.FeedMessage.toObject(
        bindings.transit_realtime.FeedMessage.decode(bytes),
        { longs: Number, enums: String },
      )
  if (
    !feed.header?.gtfsRealtimeVersion ||
    (feed.entity !== undefined && !Array.isArray(feed.entity))
  )
    throw new Error('Invalid feed')
  return { ...feed, entity: feed.entity ?? [] }
}
export async function fetchFeed(url, key, fetcher = boundedFetch) {
  const startedAt = new Date().toISOString(),
    start = performance.now()
  const health = { endpoint: identity(url), startedAt, source: 'live' }
  try {
    const response = await fetcher(url, {
      headers: { 'Ocp-Apim-Subscription-Key': key, 'x-api-key': key },
    })
    health.httpStatus = response.status
    if (!response.ok)
      return {
        health: { ...health, status: 'upstream-failure', durationMs: performance.now() - start },
      }
    const feed = decodeFeed(
      new Uint8Array(await response.arrayBuffer()),
      response.headers.get('content-type') ?? '',
    )
    if (feed.source === 'fixture' || feed.source === 'demo')
      return {
        health: {
          ...health,
          source: 'fixture',
          status: 'demonstration-data',
          durationMs: performance.now() - start,
        },
      }
    return {
      feed,
      health: {
        ...health,
        status: feed.entity.length ? 'ok' : 'empty',
        entityCount: feed.entity.length,
        feedTimestamp: Number(feed.header.timestamp) || null,
        durationMs: performance.now() - start,
      },
    }
  } catch (error) {
    return { health: { ...health, status: failure(error), durationMs: performance.now() - start } }
  }
}
// Cross-process lock prevents overlapping evaluation runners; ledger enforces the
// published token-wide interval across invocations, including failed requests.
export async function fetchObservation(
  config,
  {
    live = false,
    directory = outputDirectory,
    now = Date.now,
    sleepFn = sleep,
    fetcher = fetchFeed,
  } = {},
) {
  if (!live || !config.key)
    return Object.fromEntries(
      Object.keys(config.endpoints).map((k) => [
        k,
        { health: { status: !config.key ? 'missing-credentials' : 'not-requested', source: null } },
      ]),
    )
  const lockPath = join(directory, 'realtime.lock')
  const lock = await open(lockPath, 'wx')
  try {
    const result = {}
    for (const [kind, endpoint] of Object.entries(config.endpoints)) {
      let last = 0
      try {
        last = (await readJson(join(directory, 'last-realtime-request.json'))).timestamp
      } catch {}
      const wait = Math.max(0, 61000 - (now() - last))
      if (wait) {
        process.stderr.write(
          `Waiting ${Math.ceil(wait / 1000)}s for the published token-wide request interval.\n`,
        )
        await sleepFn(wait)
      }
      await jsonFile(join(directory, 'last-realtime-request.json'), { timestamp: now() })
      result[kind] = await fetcher(endpoint, config.key)
      const expectedField = { vehicles: 'vehicle', tripUpdates: 'tripUpdate', alerts: 'alert' }[
        kind
      ]
      if (result[kind].feed) {
        result[kind].health.matchingEntityCount = result[kind].feed.entity.filter(
          (e) => e[expectedField],
        ).length
        if (
          kind !== 'alerts' &&
          result[kind].health.entityCount > 0 &&
          !result[kind].health.matchingEntityCount
        )
          result[kind].health.status = 'unexpected-feed-type'
        // The application's default alerts URL is a combined feed. No alert
        // entities in a valid combined feed is healthy empty alert coverage.
        if (kind === 'alerts' && !result[kind].health.matchingEntityCount)
          result[kind].health.status = 'empty'
        if (kind === 'alerts')
          result[kind].health.capability =
            result[kind].health.matchingEntityCount > 0
              ? 'alert-entities-observed'
              : 'alert-capability-unverified: no alert entities in this response'
      }
      process.stderr.write(`${kind}: ${result[kind].health.status}\n`)
    }
    return result
  } finally {
    await lock.close()
    await unlink(lockPath)
  }
}
export function coverage(data, observation, now = new Date()) {
  const vehicleNowMs = Date.parse(observation.vehicles?.health.startedAt) || now.getTime()
  const tripNowMs = Date.parse(observation.tripUpdates?.health.startedAt) || now.getTime()
  const entities = (kind) => observation[kind]?.feed?.entity ?? []
  const vehicles = entities('vehicles').flatMap((e) => (e.vehicle ? [e.vehicle] : []))
  const updates = entities('tripUpdates').flatMap((e) => (e.tripUpdate ? [e.tripUpdate] : []))
  const alerts = entities('alerts').flatMap((e) => (e.alert ? [e.alert] : []))
  const instance = (trip) =>
    `${trip?.tripId ?? ''}|${trip?.startDate ?? ''}|${trip?.startTime ?? ''}`
  const vehicleTrips = new Set(vehicles.map((v) => instance(v.trip)))
  const routeFor = (item) =>
    data.routes[item.trip?.routeId || data.trips[item.trip?.tripId]?.routeId]
  const bus = (item) => {
    const type = routeFor(item)?.type
    return type === '3' || (Number(type) >= 700 && Number(type) < 800)
  }
  const available = (kind) => ['ok', 'empty'].includes(observation[kind]?.health.status)
  const local = samplingWindow(now)
  const semantics = {
    tripUpdates: available('tripUpdates') ? updates.length : null,
    multiStopUpdates: available('tripUpdates')
      ? updates.filter((u) => u.stopTimeUpdate?.length > 1).length
      : null,
    cancelledTrips: available('tripUpdates')
      ? updates.filter((u) => ['CANCELED', 3].includes(u.trip?.scheduleRelationship)).length
      : null,
    skippedStopUpdates: available('tripUpdates')
      ? updates
          .flatMap((u) => u.stopTimeUpdate ?? [])
          .filter((s) => ['SKIPPED', 1].includes(s.scheduleRelationship)).length
      : null,
    datedTripUpdates: available('tripUpdates')
      ? updates.filter((u) => u.trip?.startDate).length
      : null,
    unmatchedVehicleInstances:
      available('tripUpdates') && available('vehicles')
        ? updates.filter((u) => !vehicleTrips.has(instance(u.trip))).length
        : null,
    alertCount: available('alerts') ? alerts.length : null,
    note: 'Instance join uses tripId/startDate/startTime exactly; descriptor omissions can produce unmatched records. This is not proof GPS is absent.',
  }
  return {
    window: local,
    ageReference: 'request-start timestamp of each corresponding feed',
    semantics,
    cities: cities.map((city) => {
      const sample = data.samples.find((s) => s.city === city.id)
      const scoped = vehicles.filter(
        (v) =>
          v.position &&
          inside({ longitude: v.position.longitude, latitude: v.position.latitude }, city) &&
          bus(v),
      )
      const cityRouteIds = new Set(
        Object.values(data.stops)
          .filter((stop) => inside(stop, city))
          .flatMap((stop) => stop.routes),
      )
      const scopedUpdates = updates.filter((u) => cityRouteIds.has(routeFor(u)?.id))
      const operatorFor = (item) => data.agencies[routeFor(item)?.agencyId]?.name || 'unknown'
      const operators = [...new Set([...scoped, ...scopedUpdates].map(operatorFor))]
      const summarize = (values) => ({
        vehicleCount: values.length,
        timestampAgeSeconds: distribution(
          values
            .filter((v) => Number(v.timestamp) > 0)
            .map((v) => vehicleNowMs / 1000 - Number(v.timestamp)),
        ),
        missingTimestampCount: values.filter((v) => !Number(v.timestamp)).length,
        staticTripMatchPercent: values.length
          ? (100 * values.filter((v) => data.trips[v.trip?.tripId]).length) / values.length
          : null,
      })
      const stopReports = (sample?.stops ?? []).map((stop) => {
        const scheduled = (data.stopTimes[stop.id] ?? []).filter(
          (row) => activeService(data, data.trips[row.tripId], local.date) === true,
        )
        const matching = updates.flatMap((u) =>
          (u.stopTimeUpdate ?? [])
            .filter(
              (s) =>
                s.stopId === stop.id ||
                (!s.stopId &&
                  data.stopTimes[stop.id]?.some(
                    (row) => row.tripId === u.trip?.tripId && row.sequence === s.stopSequence,
                  )),
            )
            .map((s) => ({
              trip: u.trip,
              update: s,
              timestamp: u.timestamp || observation.tripUpdates.feed.header.timestamp,
            })),
        )
        const usable = matching.filter(({ trip, update, timestamp }) => {
          const age = tripNowMs / 1000 - Number(timestamp)
          const eventTime = Number(update.arrival?.time || update.departure?.time)
          return (
            trip?.startDate === local.date.replaceAll('-', '') &&
            !['CANCELED', 3].includes(trip.scheduleRelationship) &&
            !['SKIPPED', 'NO_DATA', 1, 2].includes(update.scheduleRelationship) &&
            Number.isFinite(age) &&
            age >= -120 &&
            age <= 300 &&
            eventTime >= now.getTime() / 1000 &&
            eventTime <= now.getTime() / 1000 + 3600
          )
        })
        return {
          stopId: stop.id,
          scheduledTripsOnSampleDate: scheduled.length,
          calendarUnknownTrips: (data.stopTimes[stop.id] ?? []).filter(
            (r) => activeService(data, data.trips[r.tripId], local.date) === null,
          ).length,
          matchingStopUpdates: available('tripUpdates') ? matching.length : null,
          usableLiveEvidence: available('tripUpdates') ? usable.length : null,
          usableEvidenceDefinition:
            'Conservative: explicit event time in next hour, matching explicit service date, update age <=300s and >=-120s, not cancelled/skipped/no-data. Delay-only or undated updates excluded; not proof of no service.',
          scheduledButNoMatchingUpdates: available('tripUpdates')
            ? scheduled.length > 0 && matching.length === 0
            : null,
        }
      })
      return {
        city: city.id,
        status: available('vehicles') ? 'sampled' : 'live-unverified',
        staticBusStops: sample?.busStopCount ?? 0,
        vehicles: available('vehicles') ? summarize(scoped) : null,
        unknownStaticRouteVehicles: available('vehicles')
          ? vehicles.filter(
              (v) =>
                v.position &&
                inside({ longitude: v.position.longitude, latitude: v.position.latitude }, city) &&
                !routeFor(v),
            ).length
          : null,
        tripUpdates: available('tripUpdates') ? scopedUpdates.length : null,
        operators: operators.map((operator) => ({
          operator,
          vehicles: available('vehicles')
            ? summarize(scoped.filter((v) => operatorFor(v) === operator))
            : null,
          tripUpdates: available('tripUpdates')
            ? scopedUpdates.filter((u) => operatorFor(u) === operator).length
            : null,
          updatesWithoutExactVehicleInstance:
            available('vehicles') && available('tripUpdates')
              ? scopedUpdates.filter(
                  (u) => operatorFor(u) === operator && !vehicleTrips.has(instance(u.trip)),
                ).length
              : null,
        })),
        stops: stopReports,
      }
    }),
  }
}
