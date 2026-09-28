import { fork } from 'node:child_process'
import { readFile, stat, unlink, readdir, rmdir } from 'node:fs/promises'
import { join, resolve, relative, isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  configuration,
  prepareOutput,
  purgeExpiredRaw,
  outputDirectory,
  jsonFile,
  hash,
  metadata,
} from './common.mjs'
import { downloadStatic, inspectStatic, publishPrepared } from './static.mjs'

async function removeOwnedTree(path) {
  const root = resolve(outputDirectory, 'raw')
  const rel = relative(root, resolve(path))
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error('Unsafe cleanup path')
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name)
    if (entry.isDirectory()) await removeOwnedTree(child)
    else await unlink(child)
  }
  await rmdir(path)
}
function worker(mode, input, configPath, cachePath, deadlineMs = 600000) {
  return new Promise((resolveResult) => {
    const start = performance.now()
    const child = fork(
      fileURLToPath(new URL('./benchmark-worker.mjs', import.meta.url)),
      [mode, input, configPath, cachePath],
      { silent: true, env: { ...process.env, TZ: 'Europe/Dublin' } },
    )
    let output = ''
    child.stdout.on('data', (bytes) => {
      output += bytes
      if (output.length > 1000000) child.kill()
    })
    child.stderr.on('data', (bytes) => {
      for (const line of bytes.toString().split('\n'))
        if (line.startsWith('phase0: ')) process.stderr.write(line + '\n')
    })
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      child.kill()
    }, deadlineMs)
    child.on('error', () => {
      clearTimeout(timer)
      resolveResult({ mode, failed: true, reason: 'spawn-failed' })
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      try {
        const result = JSON.parse(output.trim().split('\n').at(-1))
        resolveResult({
          ...result,
          timedOut,
          deadlineMs,
          processWallMs: performance.now() - start,
          failed: code !== 0 || result.failed === true || result.incomplete === true,
        })
      } catch {
        resolveResult({
          mode,
          failed: true,
          timedOut,
          deadlineMs,
          processWallMs: performance.now() - start,
          reason: 'worker-timeout-or-invalid-output',
        })
      }
    })
  })
}
export async function runBenchmark(archive, data) {
  const preparedPath = join(outputDirectory, 'raw', 'prepared.json')
  const configPath = join(outputDirectory, 'raw', 'benchmark-config.json')
  const config = {
    stops: data.samples.flatMap((s) => s.stops),
    warmReads: 30,
    now: new Date().toISOString(),
    preparedPath,
    datasetSha256: archive.sha256,
  }
  const report = {
    environment: metadata(configuration()),
    archive: { sha256: archive.sha256, bytes: archive.bytes, downloadMs: archive.downloadMs },
    scope:
      'Local selected-stop snapshot experiment; not full national indexing or production arrival API',
    coldTrials: [],
  }
  await jsonFile(configPath, config)
  const caches = []
  try {
    process.stderr.write('Bulk preparation of the selected stop snapshot.\n')
    report.preparation = await worker('bulk', archive.path, configPath, '')
    for (let trial = 0; trial < 3; trial++) {
      process.stderr.write(`Current loader cold trial ${trial + 1}/3; 30 warm reads per stop.\n`)
      const cache = join(outputDirectory, 'raw', `cache-${process.pid}-${trial}`)
      caches.push(cache)
      const result = await worker('baseline', archive.path, configPath, cache, 120000)
      report.coldTrials.push(result)
      await jsonFile(join(outputDirectory, 'benchmark-progress.json'), report)
    }
    if (!report.preparation.failed) {
      report.preparedBytes = (await stat(preparedPath)).size
      report.readers = await Promise.all([
        worker('prepared', preparedPath, configPath, ''),
        worker('prepared', preparedPath, configPath, ''),
      ])
      report.restart = await worker('prepared', preparedPath, configPath, '')
      const before = hash(await readFile(preparedPath))
      let rejected = false
      try {
        await publishPrepared(preparedPath, { schemaVersion: 1, boards: [] })
      } catch {
        rejected = true
      }
      report.invalidReplacement = {
        rejected,
        previousUnchanged: before === hash(await readFile(preparedPath)),
      }
      // A loader failure must occur before publication, preserving the last version.
      try {
        await inspectStatic(join(outputDirectory, 'raw', 'missing-refresh.zip'))
      } catch {
        report.failedRefresh = {
          rejected: true,
          previousUnchanged: before === hash(await readFile(preparedPath)),
        }
      }
      report.afterFailedRefresh = await worker('prepared', preparedPath, configPath, '')
      const expected = config.stops
        .map((s) => s.id)
        .sort()
        .join(',')
      report.preparedPassed =
        [...report.readers, report.restart, report.afterFailedRefresh].every(
          (r) =>
            !r.failed &&
            r.reads === config.stops.length * 30 &&
            [...r.boardIds].sort().join(',') === expected &&
            r.payloadSha256 === report.preparation.payloadSha256,
        ) &&
        report.invalidReplacement.rejected &&
        report.invalidReplacement.previousUnchanged &&
        report.failedRefresh?.previousUnchanged
      report.currentLoaderMeetsBudget =
        report.coldTrials.length === 3 && report.coldTrials.every((r) => !r.failed)
      report.experimentCompleted = report.coldTrials.length === 3 && report.preparedPassed
      report.passed = report.experimentCompleted && report.currentLoaderMeetsBudget
    } else report.passed = false
  } finally {
    for (const path of [preparedPath, configPath]) await unlink(path).catch(() => {})
    for (const path of caches) await removeOwnedTree(path).catch(() => {})
  }
  await jsonFile(join(outputDirectory, 'benchmark.json'), report)
  return report
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await prepareOutput()
  await purgeExpiredRaw()
  let archive
  try {
    archive = await downloadStatic(configuration().staticUrl)
    const report = await runBenchmark(archive, await inspectStatic(archive.path))
    console.log(JSON.stringify(report, null, 2))
    if (!report.passed) process.exitCode = 1
  } catch {
    console.log(JSON.stringify({ passed: false, reason: 'static-or-benchmark-unavailable' }))
    process.exitCode = 1
  } finally {
    if (archive) await unlink(archive.path).catch(() => {})
  }
}
