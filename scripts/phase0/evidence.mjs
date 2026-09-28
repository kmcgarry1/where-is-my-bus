import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { outputDirectory, readJson } from './common.mjs'

const baseline = await readJson(join(outputDirectory, 'baseline.json'))
const benchmark = await readJson(join(outputDirectory, 'benchmark.json'))
if (baseline.schemaVersion !== 1 || !baseline.coverage?.cities || !benchmark.archive?.sha256)
  throw new Error('Complete aggregate baseline and benchmark reports are required')
if (baseline.static.sha256 !== benchmark.archive.sha256)
  throw new Error('Dataset mismatch: do not combine evidence from different archives')
const evidence = {
  generatedAt: new Date().toISOString(),
  phase0Complete: false,
  pending: [
    'weekday morning and midday three-observation series',
    'alert endpoint capability and account-specific entitlement',
    'participant interviews',
    'cloud staging qualification',
    'complete real-data parity for workflows exceeding the benchmark deadline',
  ],
  environment: baseline.environment,
  static: baseline.static,
  sampling: baseline.sampling,
  feeds: baseline.feeds,
  coverage: baseline.coverage,
  selectedStops: baseline.selectedStops.map((city) => ({
    city: city.city,
    busStopCount: city.busStopCount,
    selectionStatus: city.selectionStatus,
    rationale: city.rationale,
    stops: city.stops.map((stop) => ({
      id: stop.id,
      name: stop.name,
      role: stop.role,
      routes: stop.routes,
      routeNames: stop.routeNames,
    })),
  })),
  benchmark,
}
await mkdir('docs/phase-0', { recursive: true })
await writeFile('docs/phase-0/evidence.json', JSON.stringify(evidence, null, 2) + '\n')
const escape = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ')
const format = (value) => (typeof value === 'number' ? value.toFixed(1) : 'unverified')
const cityRows = baseline.coverage.cities
  .map(
    (city) =>
      `| ${city.city} | ${city.staticBusStops} | ${city.vehicles?.vehicleCount ?? 'unverified'} | ${format(city.vehicles?.staticTripMatchPercent)} | ${format(city.vehicles?.timestampAgeSeconds.p50)} / ${format(city.vehicles?.timestampAgeSeconds.p95)} | ${city.tripUpdates ?? 'unverified'} |`,
  )
  .join('\n')
const stopRows = baseline.selectedStops
  .flatMap((city) =>
    city.stops.map(
      (stop) =>
        `| ${city.city} | ${escape(stop.role)} | ${stop.id} | ${escape(stop.name)} | ${escape([...new Set(stop.routeNames)].join(', '))} |`,
    ),
  )
  .join('\n')
const section = `<!-- phase0-evidence:start -->
## Recorded local evidence

Source: [aggregate evidence](evidence.json). Snapshot window: ${baseline.coverage.window.localTime} Europe/Dublin on ${baseline.coverage.window.date} (${baseline.coverage.window.window}). Age measurements use the start timestamp of each corresponding feed request, excluding sequential request skew.

Static archive: ${baseline.static.bytes.toLocaleString('en-IE')} bytes; SHA-256 \`${baseline.static.sha256}\`. Download ${format(baseline.static.downloadMs / 1000)} seconds; coverage preparation ${format(baseline.static.preparationMs / 1000)} seconds. Counts: ${baseline.static.counts.routes} routes, ${baseline.static.counts.trips} trips, ${baseline.static.counts.stops} stops and ${baseline.static.counts.stopTimes} stop-time rows.

| City | Static bus stops | Sample vehicles | Static trip match % | Age p50 / p95 (s) | Route-scoped TripUpdates |
| --- | --- | --- | --- | --- | --- |
${cityRows}

These are one-observation counts, not fleet coverage percentages. Full operator and stop-update breakdowns are in the aggregate JSON. The required timed sampling series is pending.

### Selected stop candidates

Route labels below are deduplicated; full route IDs are in the evidence. Central candidates and geographic suitability still require product review.

| City | Role | Stop ID | Name | Served route labels |
| --- | --- | --- | --- | --- |
${stopRows}
<!-- phase0-evidence:end -->`
const path = 'docs/phase-0/baseline-and-coverage.md'
const text = await readFile(path, 'utf8')
const pattern = /<!-- phase0-evidence:start -->[\s\S]*?<!-- phase0-evidence:end -->/
await writeFile(
  path,
  pattern.test(text)
    ? text.replace(pattern, () => section)
    : text.trimEnd() + '\n\n' + section + '\n',
)
console.log(
  JSON.stringify({ written: ['docs/phase-0/evidence.json', path], phase0Complete: false }),
)
