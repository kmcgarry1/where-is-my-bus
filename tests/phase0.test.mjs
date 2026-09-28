import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:http'
import AdmZip from 'adm-zip'
import bindings from 'gtfs-realtime-bindings'
import { identity, samplingWindow, cities } from '../scripts/phase0/common.mjs'
import { decodeFeed, fetchFeed, fetchObservation, coverage } from '../scripts/phase0/feeds.mjs'
import {
  inspectStatic,
  activeService,
  publishPrepared,
  prepareBoards,
} from '../scripts/phase0/static.mjs'

test('endpoint identity excludes query, fragment and userinfo secrets', () => {
  assert.equal(
    JSON.stringify(identity('https://user:password@example.org/feeds?key=secret#secret')).includes(
      'secret',
    ),
    false,
  )
  assert.equal(identity('https://user:password@example.org/feeds').origin, 'https://example.org')
})
test('sampling windows use Dublin DST and exclude weekends', () => {
  assert.equal(samplingWindow(new Date('2026-09-15T06:30:00Z')).window, 'morning-peak')
  assert.equal(samplingWindow(new Date('2026-09-15T11:30:00Z')).window, 'midday')
  assert.equal(samplingWindow(new Date('2026-09-19T06:30:00Z')).window, 'outside-planned-window')
  assert.equal(samplingWindow(new Date('2026-01-15T06:30:00Z')).window, 'outside-planned-window')
})
test('protobuf preserves cancelled trips, multiple updates and skipped stops', () => {
  const type = bindings.transit_realtime.FeedMessage
  const bytes = type
    .encode(
      type.fromObject({
        header: { gtfsRealtimeVersion: '2.0' },
        entity: [
          {
            id: 'x',
            tripUpdate: {
              trip: { tripId: 't', startDate: '20260915', scheduleRelationship: 'CANCELED' },
              stopTimeUpdate: [
                { stopId: 's1', scheduleRelationship: 'SKIPPED' },
                { stopId: 's2', arrival: { time: 100 } },
              ],
            },
          },
        ],
      }),
    )
    .finish()
  const trip = decodeFeed(bytes, 'application/x-protobuf').entity[0].tripUpdate
  assert.equal(trip.trip.scheduleRelationship, 'CANCELED')
  assert.equal(trip.stopTimeUpdate.length, 2)
  assert.equal(trip.stopTimeUpdate[0].scheduleRelationship, 'SKIPPED')
  const json = decodeFeed(
    Buffer.from('{"header":{"gtfs_realtime_version":"2.0"},"entity":[]}'),
    'application/json',
  )
  assert.deepEqual(json.entity, [])
})
test('healthy empty feed differs from upstream failure, timeout and malformed content', async () => {
  const empty = await fetchFeed(
    'https://example.org',
    'secret',
    async () =>
      new Response('{"header":{"gtfsRealtimeVersion":"2.0"}}', {
        headers: { 'content-type': 'application/json' },
      }),
  )
  assert.equal(empty.health.status, 'empty')
  const failed = await fetchFeed(
    'https://example.org',
    'secret',
    async () => new Response('secret', { status: 403 }),
  )
  assert.equal(failed.health.status, 'upstream-failure')
  assert.equal(JSON.stringify(failed).includes('secret'), false)
  const timeout = await fetchFeed('https://example.org', 'secret', async () => {
    throw new DOMException('secret', 'TimeoutError')
  })
  assert.equal(timeout.health.status, 'timeout')
  const invalid = await fetchFeed(
    'https://example.org',
    'secret',
    async () => new Response('{}', { headers: { 'content-type': 'application/json' } }),
  )
  assert.equal(invalid.health.status, 'network-or-parse-error')
  const fixture = await fetchFeed(
    'https://example.org',
    'secret',
    async () =>
      new Response('{"source":"fixture","header":{"gtfsRealtimeVersion":"2.0"},"entity":[]}', {
        headers: { 'content-type': 'application/json' },
      }),
  )
  assert.equal(fixture.health.status, 'demonstration-data')
})
test('calendar exceptions override weekly schedules; unknown calendar stays unknown', () => {
  const data = {
    calendars: { daily: { start_date: '20260101', end_date: '20261231', tuesday: '1' } },
    exceptions: { daily: { 20260915: '2', 20260916: '1' } },
  }
  assert.equal(activeService(data, { serviceId: 'daily' }, '2026-09-15'), false)
  assert.equal(activeService(data, { serviceId: 'daily' }, '2026-09-16'), true)
  assert.equal(activeService(data, { serviceId: 'missing' }, '2026-09-15'), null)
})
test('token interval spans feeds and runs; missing credentials never issue requests', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bustime-phase0-rate-'))
  try {
    let clock = 1000000
    const calls = []
    const config = { key: 'test', endpoints: { vehicles: 'v', tripUpdates: 't', alerts: 'a' } }
    const options = {
      live: true,
      directory: dir,
      now: () => clock,
      sleepFn: async (ms) => {
        clock += ms
      },
      fetcher: async () => {
        calls.push(clock)
        return { health: { status: 'upstream-failure' } }
      },
    }
    await fetchObservation(config, options)
    await fetchObservation({ ...config, endpoints: { vehicles: 'v' } }, options)
    assert.deepEqual(calls, [1000000, 1061000, 1122000, 1183000])
    const missing = await fetchObservation({ ...config, key: undefined }, options)
    assert.equal(missing.vehicles.health.status, 'missing-credentials')
    assert.equal(calls.length, 4)
    await writeFile(join(dir, 'realtime.lock'), '')
    await assert.rejects(fetchObservation(config, options), { code: 'EEXIST' })
    assert.equal(calls.length, 4)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
test('failed and invalid refresh preserve the published artifact', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bustime-phase0-test-'))
  try {
    const path = join(dir, 'prepared.json')
    const value = {
      schemaVersion: 1,
      boards: [{ stop: { id: 's' }, services: [], context: { trip: { id: 't' } } }],
    }
    await publishPrepared(path, value)
    const before = await readFile(path, 'utf8')
    await assert.rejects(publishPrepared(path, { schemaVersion: 1, boards: [] }))
    assert.equal(await readFile(path, 'utf8'), before)
    await assert.rejects(inspectStatic(join(dir, 'missing.zip')))
    assert.equal(await readFile(path, 'utf8'), before)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
test('five-city static selection has unique stops and opposing route directions; unavailable feeds are not zero coverage', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bustime-phase0-test-'))
  let server
  const saved = {
    NTA_GTFS_STATIC_URL: process.env.NTA_GTFS_STATIC_URL,
    ATLASOPS_CACHE_DIR: process.env.ATLASOPS_CACHE_DIR,
    TZ: process.env.TZ,
  }
  try {
    const zip = new AdmZip()
    const add = (name, text) => zip.addFile(name, Buffer.from(text))
    add('agency.txt', 'agency_id,agency_name,agency_timezone\na,Test,Europe/Dublin\n')
    add('routes.txt', 'route_id,agency_id,route_type,route_short_name\nr,a,3,R\n')
    add('trips.txt', 'route_id,trip_id,direction_id,service_id\nr,t0,0,d\nr,t1,1,d\n')
    const stops = cities.flatMap((c) =>
      [0, 1, 2, 3].map((n) => ({
        id: c.id + n,
        longitude: c.center[0] + (n === 3 ? 0.02 : n * 0.001),
        latitude: c.center[1],
        direction: n === 2 ? 1 : 0,
      })),
    )
    add(
      'stops.txt',
      'stop_id,stop_name,stop_lat,stop_lon\n' +
        stops.map((s) => `${s.id},${s.id},${s.latitude},${s.longitude}`).join('\n'),
    )
    add(
      'stop_times.txt',
      'trip_id,stop_id,stop_sequence,arrival_time,departure_time\n' +
        stops.map((s, i) => `t${s.direction},${s.id},${i},12:00:00,12:00:00`).join('\n'),
    )
    const path = join(dir, 'test.zip')
    await writeFile(path, zip.toBuffer())
    const data = await inspectStatic(path)
    assert.equal(data.samples.length, 5)
    for (const city of data.samples) {
      assert.equal(city.stops.length, 4)
      assert.equal(new Set(city.stops.map((s) => s.id)).size, 4)
    }
    const report = coverage(data, {
      vehicles: { health: { status: 'missing-credentials' } },
      tripUpdates: { health: { status: 'upstream-failure' } },
      alerts: { health: { status: 'empty' }, feed: { entity: [] } },
    })
    assert.equal(report.semantics.alertCount, 0)
    assert.equal(report.semantics.tripUpdates, null)
    assert.equal(report.cities[0].vehicles, null)
    assert.equal(report.cities[0].stops[0].matchingStopUpdates, null)
    server = createServer((_req, res) => res.end(zip.toBuffer()))
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    process.env.NTA_GTFS_STATIC_URL = `http://127.0.0.1:${server.address().port}/fixture.zip`
    process.env.ATLASOPS_CACHE_DIR = join(dir, 'cache')
    process.env.TZ = 'Europe/Dublin'
    const api = await import('../server/providers/ntaGtfsRealtime/staticGtfs.ts')
    const now = new Date('2026-09-15T10:00:00Z')
    const boards = await prepareBoards(path, data, now)
    for (const board of boards) {
      const { services } = await api.fetchStaticGtfsStopServices(board.stop.id, [], now)
      const context = await api.fetchStaticGtfsTripContext(services[0].tripIds[0])
      assert.deepEqual(
        JSON.parse(JSON.stringify(board.services)),
        JSON.parse(JSON.stringify(services)),
      )
      assert.deepEqual(
        JSON.parse(JSON.stringify(board.context)),
        JSON.parse(JSON.stringify(context)),
      )
    }
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve))
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    await rm(dir, { recursive: true, force: true })
  }
})
