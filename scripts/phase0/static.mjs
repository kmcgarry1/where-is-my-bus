import AdmZip from 'adm-zip'
import { parse } from 'csv-parse'
import { Readable } from 'node:stream'
import { readFile, writeFile, rename, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { cities, inside, hash, outputDirectory, boundedFetch } from './common.mjs'

export async function rows(zip, name, visit, required = true) {
  const entry = zip.getEntry(name)
  if (!entry) {
    if (required) throw new Error(`Missing ${name}`)
    return
  }
  const bytes = entry.getData()
  function* chunks() {
    for (let offset = 0; offset < bytes.length; offset += 65536)
      yield bytes.subarray(offset, offset + 65536)
  }
  const parser = Readable.from(chunks()).pipe(
    parse({ columns: true, bom: true, skip_empty_lines: true }),
  )
  for await (const row of parser) visit(row)
}
export async function downloadStatic(url) {
  if (!url) throw new Error('Static feed disabled')
  const start = performance.now()
  const response = await boundedFetch(url, {}, 180000)
  if (!response.ok) throw new Error(`Static HTTP ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  const checksum = hash(bytes)
  const path = join(outputDirectory, 'raw', `${checksum}.zip`)
  await writeFile(path, bytes)
  return { path, sha256: checksum, bytes: bytes.length, downloadMs: performance.now() - start }
}
const bus = (route) =>
  route && (route.type === '3' || (Number(route.type) >= 700 && Number(route.type) < 800))
const distance = (a, b) =>
  Math.hypot((a[0] - b[0]) * Math.cos((b[1] * Math.PI) / 180), a[1] - b[1]) * 111195
export async function inspectStatic(path) {
  const zip = new AdmZip(await readFile(path))
  const routes = {},
    trips = {},
    stops = {},
    agencies = {},
    calendars = {},
    exceptions = {}
  await rows(zip, 'agency.txt', (r) => {
    agencies[r.agency_id || 'default'] = { name: r.agency_name, timezone: r.agency_timezone }
  })
  await rows(zip, 'routes.txt', (r) => {
    routes[r.route_id] = {
      id: r.route_id,
      name: r.route_short_name || r.route_long_name,
      shortName: r.route_short_name,
      longName: r.route_long_name,
      agencyId: r.agency_id || 'default',
      type: r.route_type,
    }
  })
  await rows(zip, 'trips.txt', (r) => {
    trips[r.trip_id] = {
      id: r.trip_id,
      routeId: r.route_id,
      direction: r.direction_id,
      serviceId: r.service_id,
      shapeId: r.shape_id,
      headsign: r.trip_headsign,
    }
  })
  await rows(zip, 'stops.txt', (r) => {
    const latitude = Number(r.stop_lat),
      longitude = Number(r.stop_lon)
    if (r.stop_lat && r.stop_lon && Number.isFinite(latitude) && Number.isFinite(longitude))
      stops[r.stop_id] = {
        id: r.stop_id,
        name: r.stop_name,
        latitude,
        longitude,
        routes: [],
        directions: {},
      }
  })
  await rows(
    zip,
    'calendar.txt',
    (r) => {
      calendars[r.service_id] = r
    },
    false,
  )
  await rows(
    zip,
    'calendar_dates.txt',
    (r) => {
      ;(exceptions[r.service_id] ??= {})[r.date] = r.exception_type
    },
    false,
  )
  let stopTimeCount = 0
  await rows(zip, 'stop_times.txt', (r) => {
    stopTimeCount++
    const trip = trips[r.trip_id],
      stop = stops[r.stop_id]
    if (!stop || !trip || !bus(routes[trip.routeId])) return
    if (!stop.routes.includes(trip.routeId)) stop.routes.push(trip.routeId)
    if (['0', '1'].includes(trip.direction)) {
      const directions = (stop.directions[trip.routeId] ??= [])
      if (!directions.includes(trip.direction)) directions.push(trip.direction)
    }
  })
  if (!Object.keys(trips).length || !Object.keys(stops).length || !stopTimeCount)
    throw new Error('Empty static dataset')
  const samples = cities.map((city) => {
    const candidates = Object.values(stops).filter(
      (stop) => stop.routes.length && inside(stop, city),
    )
    const sorted = [...candidates].sort(
      (a, b) =>
        distance([a.longitude, a.latitude], city.center) -
          distance([b.longitude, b.latitude], city.center) || a.id.localeCompare(b.id),
    )
    const central =
      sorted
        .filter((s) => distance([s.longitude, s.latitude], city.center) <= 1200)
        .sort((a, b) => b.routes.length - a.routes.length || a.id.localeCompare(b.id))[0] ??
      sorted[0]
    const outer = [...sorted].reverse().find((s) => s.id !== central?.id)
    let pair
    for (const a of sorted) {
      if ([central?.id, outer?.id].includes(a.id)) continue
      const b = sorted.find(
        (b) =>
          b.id !== a.id &&
          ![central?.id, outer?.id].includes(b.id) &&
          distance([a.longitude, a.latitude], [b.longitude, b.latitude]) <= 250 &&
          a.routes.some(
            (route) =>
              a.directions[route]?.length === 1 &&
              b.directions[route]?.length === 1 &&
              a.directions[route][0] !== b.directions[route][0],
          ),
      )
      if (b) {
        pair = [a, b]
        break
      }
    }
    const selected = [
      central && { role: 'central-interchange-candidate', stop: central },
      outer && { role: 'outer-area', stop: outer },
      ...(pair ?? []).map((stop, i) => ({ role: `opposite-direction-${i + 1}`, stop })),
    ].filter(Boolean)
    return {
      city: city.id,
      busStopCount: candidates.length,
      selectionStatus: selected.length === 4 ? 'four-candidates-selected' : 'incomplete',
      rationale:
        'Central: most routes within 1.2 km of city centre. Outer: farthest in bounds. Pair: within 250 m with opposite single direction IDs on a shared route. Geographic/interchange suitability requires human review.',
      stops: selected.map(({ role, stop }) => ({
        ...stop,
        role,
        routeNames: stop.routes.map((id) => routes[id].name),
      })),
    }
  })
  const selectedIds = new Set(samples.flatMap((s) => s.stops.map((stop) => stop.id)))
  const stopTimes = {}
  await rows(zip, 'stop_times.txt', (r) => {
    if (selectedIds.has(r.stop_id) && bus(routes[trips[r.trip_id]?.routeId]))
      (stopTimes[r.stop_id] ??= []).push({
        tripId: r.trip_id,
        stopId: r.stop_id,
        arrival: r.arrival_time,
        departure: r.departure_time,
        sequence: Number(r.stop_sequence),
      })
  })
  return {
    routes,
    trips,
    stops,
    agencies,
    calendars,
    exceptions,
    samples,
    stopTimes,
    counts: {
      routes: Object.keys(routes).length,
      trips: Object.keys(trips).length,
      stops: Object.keys(stops).length,
      stopTimes: stopTimeCount,
      calendars: Object.keys(calendars).length,
      calendarExceptions: Object.values(exceptions).reduce((n, e) => n + Object.keys(e).length, 0),
    },
  }
}
export function activeService(data, trip, date) {
  const stamp = date.replaceAll('-', '')
  const exception = data.exceptions[trip.serviceId]?.[stamp]
  if (exception) return exception === '1'
  const calendar = data.calendars[trip.serviceId]
  if (!calendar) return null
  const day = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' })
    .format(new Date(`${date}T12:00:00Z`))
    .toLowerCase()
  return stamp >= calendar.start_date && stamp <= calendar.end_date && calendar[day] === '1'
}
export function validatePrepared(value) {
  if (
    value?.schemaVersion !== 1 ||
    !Array.isArray(value.boards) ||
    !value.boards.length ||
    !value.boards.every((b) => b.stop?.id && Array.isArray(b.services) && b.context?.trip)
  )
    throw new Error('Invalid prepared artifact')
  return value
}
export async function publishPrepared(path, candidate) {
  validatePrepared(candidate)
  const temporary = `${path}.${process.pid}.tmp`
  try {
    await writeFile(temporary, JSON.stringify(candidate))
    await rename(temporary, path)
  } finally {
    await unlink(temporary).catch(() => {})
  }
}

// Experimental bulk preparation for the selected stop set. Preserve the current
// service selection semantics (including their known calendar limitations).
export async function prepareBoards(path, data, now) {
  const zip = new AdmZip(await readFile(path))
  const seconds = (value) =>
    value ? value.split(':').reduce((n, v) => n * 60 + Number(v), 0) : undefined
  const clock = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Dublin',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(now)
  const currentSeconds = seconds(clock)
  const boards = data.samples.flatMap((sample) =>
    sample.stops.map((stop) => {
      const groups = new Map()
      for (const row of data.stopTimes[stop.id] ?? []) {
        const trip = data.trips[row.tripId],
          route = data.routes[trip.routeId],
          time = seconds(row.arrival)
        if (time === undefined) continue
        const key = [trip.routeId, trip.direction ?? '', trip.headsign ?? ''].join('|')
        const group = groups.get(key) ?? {
          stopId: stop.id,
          routeId: trip.routeId,
          routeShortName: route.shortName,
          routeLongName: route.longName,
          directionId: trip.direction,
          headsign: trip.headsign,
          tripIds: [],
          arrivals: [],
        }
        if (!group.tripIds.includes(trip.id)) group.tripIds.push(trip.id)
        group.arrivals.push({ seconds: time, tripId: trip.id, sequence: row.sequence })
        groups.set(key, group)
      }
      const services = [...groups.values()]
        .map(({ arrivals, ...group }) => {
          arrivals.sort((a, b) => a.seconds - b.seconds)
          const next = arrivals.find((a) => a.seconds >= currentSeconds) ?? arrivals[0]
          return {
            ...group,
            scheduledArrivalSeconds: next?.seconds,
            scheduledTripId: next?.tripId,
            stopSequence: next?.sequence,
          }
        })
        .sort(
          (a, b) =>
            (a.scheduledArrivalSeconds ?? Number.MAX_SAFE_INTEGER) -
            (b.scheduledArrivalSeconds ?? Number.MAX_SAFE_INTEGER),
        )
      return { stop, services, tripId: services[0]?.tripIds[0] }
    }),
  )
  const targets = new Set(boards.map((b) => b.tripId))
  const times = {},
    shapes = {}
  await rows(zip, 'stop_times.txt', (row) => {
    if (targets.has(row.trip_id))
      (times[row.trip_id] ??= []).push({
        tripId: row.trip_id,
        stopId: row.stop_id,
        arrivalSeconds: seconds(row.arrival_time),
        departureSeconds: seconds(row.departure_time),
        stopSequence: Number(row.stop_sequence),
        name: data.stops[row.stop_id]?.name,
        latitude: data.stops[row.stop_id]?.latitude,
        longitude: data.stops[row.stop_id]?.longitude,
      })
  })
  const shapeIds = new Set([...targets].map((id) => data.trips[id]?.shapeId).filter(Boolean))
  await rows(
    zip,
    'shapes.txt',
    (row) => {
      if (shapeIds.has(row.shape_id))
        (shapes[row.shape_id] ??= []).push({
          latitude: Number(row.shape_pt_lat),
          longitude: Number(row.shape_pt_lon),
          sequence: Number(row.shape_pt_sequence),
        })
    },
    false,
  )
  return boards.map(({ tripId, ...board }) => {
    const trip = data.trips[tripId],
      route = data.routes[trip?.routeId]
    if (!trip || !route) throw new Error('Selected board has no trip')
    return {
      ...board,
      context: {
        source: 'configured',
        trip: {
          tripId,
          routeId: trip.routeId,
          headsign: trip.headsign,
          directionId: trip.direction,
          shapeId: trip.shapeId,
        },
        route: {
          routeId: route.id,
          agencyId: route.agencyId,
          shortName: route.shortName,
          longName: route.longName,
          routeType: route.type,
        },
        stops: (times[tripId] ?? []).sort((a, b) => a.stopSequence - b.stopSequence),
        shape: (shapes[trip.shapeId] ?? []).sort((a, b) => a.sequence - b.sequence),
      },
    }
  })
}
