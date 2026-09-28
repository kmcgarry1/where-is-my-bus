import { join } from 'node:path'
import { unlink, readFile } from 'node:fs/promises'
import {
  configuration,
  metadata,
  prepareOutput,
  purgeExpiredRaw,
  outputDirectory,
  jsonFile,
  failure,
  hash,
  boundedFetch,
} from './common.mjs'
import { downloadStatic, inspectStatic } from './static.mjs'
import { fetchObservation, coverage } from './feeds.mjs'
import { samplingWindow } from './common.mjs'
import { setTimeout as sleep } from 'node:timers/promises'

const args = new Set(process.argv.slice(2))
const config = configuration()
const requestedWindow = process.argv
  .find((a) => a.startsWith('--window='))
  ?.slice('--window='.length)
if (requestedWindow && !['morning-peak', 'midday'].includes(requestedWindow))
  throw new Error('Use --window=morning-peak or --window=midday')
await prepareOutput()
await purgeExpiredRaw()
const report = {
  schemaVersion: 1,
  environment: metadata(config),
  failures: [],
  static: { status: 'not-run' },
}
report.coverageLimitations = [
  'A successful command is not complete Phase 0 qualification.',
  'Zero alert entities does not establish alert capability.',
  'Static candidate selection needs geographic review.',
  'Samples are not ETA accuracy ground truth.',
]
let archive
try {
  const localArchive = process.argv
    .find((a) => a.startsWith('--archive='))
    ?.slice('--archive='.length)
  if (localArchive) {
    const bytes = await readFile(localArchive)
    archive = {
      path: localArchive,
      sha256: hash(bytes),
      bytes: bytes.length,
      downloadMs: null,
      localInput: true,
    }
  } else archive = await downloadStatic(config.staticUrl)
  process.stderr.write(`Static archive: ${archive.bytes} bytes. Preparing coverage indexes.\n`)
  const start = performance.now()
  const data = await inspectStatic(archive.path)
  report.static = {
    status: 'ok',
    source: archive.localInput ? 'local-archive' : config.staticSource,
    sha256: archive.sha256,
    bytes: archive.bytes,
    downloadMs: archive.downloadMs,
    preparationMs: performance.now() - start,
    counts: data.counts,
  }
  report.selectedStops = data.samples
  if (args.has('--app')) {
    report.applicationChecks = []
    for (const sample of data.samples) {
      const stop = sample.stops[0]
      if (!stop) continue
      const start = performance.now()
      try {
        const url = new URL('/api/providers/nta/stops', config.baseUrl)
        url.searchParams.set('q', stop.id)
        const response = await boundedFetch(url, {}, 120000)
        const body = response.ok ? await response.json() : null
        const passed =
          response.ok && body?.collection?.features?.some((s) => s.properties.stopId === stop.id)
        report.applicationChecks.push({
          city: sample.city,
          status: response.status,
          passed,
          durationMs: performance.now() - start,
        })
        if (!passed) report.failures.push(`${sample.city}: application stop lookup failed`)
      } catch (error) {
        report.applicationChecks.push({ city: sample.city, passed: false, status: failure(error) })
        report.failures.push(`${sample.city}: application unavailable`)
      }
    }
  }
  report.observations = []
  const observationCount = requestedWindow ? 3 : 1
  let previousStart = 0
  for (let n = 0; n < observationCount; n++) {
    const remaining = Math.max(0, previousStart + 300000 - Date.now())
    if (remaining) {
      process.stderr.write('Waiting for the next five-minute observation.\n')
      await sleep(remaining)
    }
    const window = samplingWindow()
    if (requestedWindow && (window.window !== requestedWindow || !args.has('--live'))) {
      report.failures.push(
        'Scheduled series requires --live and execution within the requested Dublin weekday window',
      )
      break
    }
    previousStart = Date.now()
    const observation = await fetchObservation(config, { live: args.has('--live') })
    const entry = {
      startedAt: new Date(previousStart).toISOString(),
      finishedAt: new Date().toISOString(),
      feeds: Object.fromEntries(Object.entries(observation).map(([k, v]) => [k, v.health])),
      coverage: coverage(data, observation, new Date(previousStart)),
    }
    report.observations.push(entry)
    report.feeds = entry.feeds
    report.coverage = entry.coverage
    // Aggregate evidence is saved after every observation; raw realtime stays in memory.
    await jsonFile(join(outputDirectory, `observation-${previousStart}.json`), entry)
    for (const [kind, value] of Object.entries(observation))
      if (!['ok', 'empty'].includes(value.health.status))
        report.failures.push(`${kind}: ${value.health.status}`)
    if (requestedWindow && samplingWindow().window !== requestedWindow)
      report.failures.push('Observation crossed the requested sampling window boundary')
  }
  report.sampling = {
    requestedWindow: requestedWindow ?? 'exploratory',
    required: observationCount,
    completed: report.observations.length,
  }
  if (data.samples.some((s) => s.stops.length !== 4))
    report.failures.push('Incomplete four-stop selection')
  if (args.has('--benchmark')) {
    await jsonFile(join(outputDirectory, 'baseline.json'), report)
    const { runBenchmark } = await import('./benchmark.mjs')
    report.benchmark = await runBenchmark(archive, data)
    if (!report.benchmark.passed) report.failures.push('Benchmark failed or incomplete')
  }
} catch (error) {
  report.failures.push(failure(error))
  if (report.static.status !== 'ok') report.static.status = 'unavailable'
} finally {
  // No raw feed/ZIP retention after completion, including failure paths.
  if (archive && !archive.localInput) await unlink(archive.path).catch(() => {})
}
report.passed = report.failures.length === 0
report.finishedAt = new Date().toISOString()
await jsonFile(join(outputDirectory, 'baseline.json'), report)
console.log(JSON.stringify(report, null, 2))
if (!report.passed) process.exitCode = 1
