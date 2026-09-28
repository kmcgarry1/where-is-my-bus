import { readFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { createServer } from 'node:http'
import { performance } from 'node:perf_hooks'
import { distribution, hash } from './common.mjs'
import { validatePrepared, inspectStatic, prepareBoards, publishPrepared } from './static.mjs'

const [mode, input, configPath, cachePath] = process.argv.slice(2)
const started = performance.now()
const config = JSON.parse(await readFile(configPath, 'utf8'))
let server
try {
  let boards
  const timings = []
  if (mode === 'bulk') {
    const data = await inspectStatic(input)
    boards = await prepareBoards(input, data, new Date(config.now))
    await publishPrepared(config.preparedPath, {
      schemaVersion: 1,
      now: config.now,
      datasetSha256: config.datasetSha256,
      scope:
        'selected stops only; one representative trip context per stop; frozen schedule snapshot',
      boards,
    })
    console.log(
      JSON.stringify({
        mode,
        elapsedMs: performance.now() - started,
        maxRssKiB: process.resourceUsage().maxRSS,
        boardIds: boards.map((b) => b.stop.id),
        payloadSha256: hash(JSON.stringify(boards)),
      }),
    )
  } else if (mode === 'prepared') {
    boards = validatePrepared(JSON.parse(await readFile(input, 'utf8'))).boards
    const loadedMs = performance.now() - started
    for (const board of boards)
      for (let n = 0; n < config.warmReads; n++) {
        const start = performance.now()
        const found = boards.find((b) => b.stop.id === board.stop.id)
        JSON.stringify({ stop: found.stop, services: found.services, context: found.context })
        timings.push(performance.now() - start)
      }
    console.log(
      JSON.stringify({
        mode,
        loadedMs,
        reads: timings.length,
        warmMs: distribution(timings),
        maxRssKiB: process.resourceUsage().maxRSS,
        boardIds: boards.map((b) => b.stop.id),
        payloadSha256: hash(JSON.stringify(boards)),
      }),
    )
  } else {
    const archive = await readFile(input)
    server = createServer((_req, res) => {
      res.setHeader('Content-Type', 'application/zip')
      res.end(archive)
    })
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    process.env.NTA_GTFS_STATIC_URL = `http://127.0.0.1:${server.address().port}/static.zip`
    process.env.ATLASOPS_CACHE_DIR = cachePath
    await mkdir(cachePath, { recursive: true })
    const api = await import('../../server/providers/ntaGtfsRealtime/staticGtfs.ts')
    const indexStart = performance.now()
    await api.fetchStaticGtfsIndex()
    const indexMs = performance.now() - indexStart
    const stops = await api.fetchStaticGtfsStopOptions()
    boards = []
    const cold = []
    const now = new Date(config.now)
    for (const selected of config.stops) {
      const start = performance.now()
      const stop = stops.stops.find((s) => s.stopId === selected.id)
      if (!stop) throw new Error('Selected stop missing')
      const { services } = await api.fetchStaticGtfsStopServices(selected.id, [], now)
      const tripId = services.find((s) => s.tripIds?.length)?.tripIds[0]
      if (!tripId) throw new Error('Selected stop has no trip')
      const context = await api.fetchStaticGtfsTripContext(tripId)
      boards.push({ stop: selected, services, context })
      process.stderr.write(
        `phase0: prepared ${boards.length}/${config.stops.length} stop workflows\n`,
      )
      cold.push(performance.now() - start)
      for (let n = 0; n < config.warmReads; n++) {
        const warmStart = performance.now()
        stops.stops.find((s) => s.stopId === selected.id)
        const result = await api.fetchStaticGtfsStopServices(selected.id, [], now)
        const ctx = await api.fetchStaticGtfsTripContext(tripId)
        JSON.stringify({ stop: selected, services: result.services, context: ctx })
        timings.push(performance.now() - warmStart)
      }
      // Emit safe checkpoints so a deadline failure still records completed work.
      console.log(
        JSON.stringify({
          mode,
          incomplete: true,
          completedStops: boards.length,
          reads: timings.length,
          elapsedMs: performance.now() - started,
          coldBoardMs: distribution(cold),
          warmMs: distribution(timings),
          maxRssKiB: process.resourceUsage().maxRSS,
        }),
      )
    }
    console.log(
      JSON.stringify({
        mode,
        indexMs,
        elapsedMs: performance.now() - started,
        coldBoardMs: distribution(cold),
        warmMs: distribution(timings),
        reads: timings.length,
        maxRssKiB: process.resourceUsage().maxRSS,
        boardIds: boards.map((b) => b.stop.id),
        payloadSha256: hash(JSON.stringify(boards)),
      }),
    )
  }
} catch {
  console.log(
    JSON.stringify({
      mode,
      failed: true,
      reason: 'worker-failed',
      maxRssKiB: process.resourceUsage().maxRSS,
    }),
  )
  process.exitCode = 1
} finally {
  if (server) await new Promise((resolve) => server.close(resolve))
}
