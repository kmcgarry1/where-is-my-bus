import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'node:http'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import AdmZip from 'adm-zip'
import {
  fetchStaticGtfsRouteOptions,
  fetchStaticGtfsStopOptions,
  fetchStaticGtfsStopServices,
} from '../server/providers/ntaGtfsRealtime/staticGtfs.ts'
import { transportRegions } from '../src/data/moving/transportFilters.ts'

test('static search scope follows bus route-stop membership in every city', async () => {
  const zip = new AdmZip()
  const rows = transportRegions.map((area, index) => ({
    id: String(index),
    lon: (area.west + area.east) / 2,
    lat: (area.south + area.north) / 2,
  }))
  zip.addFile(
    'agency.txt',
    Buffer.from('agency_id,agency_name\na,Test operator\n'),
  )
  zip.addFile(
    'routes.txt',
    Buffer.from(
      'route_id,agency_id,route_short_name,route_long_name,route_type\n' +
        rows.map((row) => `${row.id},a,B${row.id},Bus ${row.id},3`).join('\n') +
        '\nrail,a,R,Rail,2\n',
    ),
  )
  zip.addFile(
    'trips.txt',
    Buffer.from(
      'route_id,trip_id,trip_headsign\n' +
        rows
          .map((row) => `${row.id},trip${row.id},Destination ${row.id}`)
          .join('\n') +
        '\nrail,railtrip,Rail station\n',
    ),
  )
  zip.addFile(
    'stops.txt',
    Buffer.from(
      'stop_id,stop_name,stop_lat,stop_lon\n' +
        rows
          .map((row) => `${row.id},Stop ${row.id},${row.lat},${row.lon}`)
          .join('\n') +
        '\nrailstop,Rail station,53.35,-6.26\n',
    ),
  )
  zip.addFile(
    'stop_times.txt',
    Buffer.from(
      'trip_id,stop_id,arrival_time,departure_time,stop_sequence\n' +
        rows
          .map((row) => `trip${row.id},${row.id},12:00:00,12:00:00,1`)
          .join('\n') +
        '\nrailtrip,railstop,12:00:00,12:00:00,1\n',
    ),
  )
  const server = createServer((_, response) => response.end(zip.toBuffer()))
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  process.env.NTA_GTFS_STATIC_URL = `http://127.0.0.1:${server.address().port}/gtfs.zip`
  process.env.ATLASOPS_CACHE_DIR = await mkdtemp(
    join(tmpdir(), 'bustime-static-test-'),
  )
  try {
    assert.equal((await fetchStaticGtfsRouteOptions()).routes.length, 5)
    for (const [index, area] of transportRegions.entries()) {
      const result = await fetchStaticGtfsRouteOptions([
        area.west,
        area.south,
        area.east,
        area.north,
      ])
      assert.deepEqual(
        result.routes.map((route) => route.routeId),
        [String(index)],
        area.label,
      )
    }
    assert.equal(
      (await fetchStaticGtfsStopOptions()).stops.length,
      5,
      'rail-only stops are excluded',
    )
    assert.deepEqual(
      (await fetchStaticGtfsStopServices('railstop')).services,
      [],
    )
    assert.equal(
      (await fetchStaticGtfsStopServices('0')).services[0].routeId,
      '0',
    )
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})
