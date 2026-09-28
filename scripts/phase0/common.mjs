import { loadEnv } from 'vite'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile, readdir, stat, unlink } from 'node:fs/promises'
import { resolve, join, relative, isAbsolute } from 'node:path'
import { createHash } from 'node:crypto'

export const outputDirectory = resolve('.phase0')
export const recommendedStaticUrl =
  'https://www.transportforireland.ie/transitData/Data/GTFS_Realtime.zip'
export const cities = [
  {
    id: 'dublin',
    west: -6.42,
    south: 53.24,
    east: -6.05,
    north: 53.43,
    center: [-6.2603, 53.3498],
  },
  { id: 'cork', west: -8.62, south: 51.82, east: -8.33, north: 51.98, center: [-8.4756, 51.8985] },
  { id: 'galway', west: -9.18, south: 53.23, east: -8.91, north: 53.34, center: [-9.049, 53.274] },
  {
    id: 'limerick',
    west: -8.75,
    south: 52.59,
    east: -8.52,
    north: 52.72,
    center: [-8.6267, 52.6638],
  },
  {
    id: 'waterford',
    west: -7.18,
    south: 52.21,
    east: -6.98,
    north: 52.31,
    center: [-7.1119, 52.2593],
  },
]
export function configuration() {
  const env = { ...loadEnv('development', process.cwd(), ''), ...process.env }
  const keyName = ['NTA_API_KEY', 'NTA_GTFSR_API_KEY', 'TFI_API_KEY'].find((k) => env[k]?.trim())
  return {
    key: keyName ? env[keyName].trim() : undefined,
    keyName,
    baseUrl:
      env.BUSTIME_VERIFY_URL ||
      env.ATLASOPS_VERIFY_URL ||
      env.ATLASOPS_SMOKE_URL ||
      'http://127.0.0.1:5174/',
    staticUrl:
      env.NTA_GTFS_STATIC_URL?.trim() ||
      (env.NTA_DISABLE_RECOMMENDED_STATIC_GTFS === '1' ? undefined : recommendedStaticUrl),
    staticSource: env.NTA_GTFS_STATIC_URL?.trim() ? 'configured' : 'recommended',
    endpoints: {
      vehicles:
        env.NTA_VEHICLE_POSITIONS_URL?.trim() ||
        'https://api.nationaltransport.ie/gtfsr/v2/Vehicles',
      tripUpdates:
        env.NTA_TRIP_UPDATES_URL?.trim() || 'https://api.nationaltransport.ie/gtfsr/v2/TripUpdates',
      alerts:
        env.NTA_SERVICE_ALERTS_URL?.trim() ||
        'https://api.nationaltransport.ie/gtfsr/v2/gtfsr?format=json',
    },
  }
}
export function identity(value) {
  if (!value) return null
  try {
    const url = new URL(value)
    // Query strings, userinfo and fragments may contain credentials.
    return {
      origin: url.origin,
      path: url.pathname,
      fingerprint: hash(url.origin + url.pathname).slice(0, 12),
    }
  } catch {
    return { invalid: true }
  }
}
export const hash = (value) => createHash('sha256').update(value).digest('hex')
export function metadata(config) {
  let commit = 'unknown'
  let workingTreeChanges = null
  try {
    commit = execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {}
  try {
    workingTreeChanges = Boolean(
      execFileSync('git', ['status', '--porcelain'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim(),
    )
  } catch {}
  return {
    commit,
    workingTreeChanges,
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    checkedAt: new Date().toISOString(),
    credentialConfigured: Boolean(config.key),
    credentialEnvName: config.keyName ?? null,
    baseUrl: identity(config.baseUrl),
    staticEndpoint: identity(config.staticUrl),
    endpoints: Object.fromEntries(
      Object.entries(config.endpoints).map(([k, v]) => [k, identity(v)]),
    ),
  }
}
export async function jsonFile(path, value) {
  await writeFile(path, JSON.stringify(value, null, 2) + '\n')
}
export async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}
export async function prepareOutput() {
  await mkdir(outputDirectory, { recursive: true })
}
export const inside = (stop, city) =>
  stop.longitude >= city.west &&
  stop.longitude <= city.east &&
  stop.latitude >= city.south &&
  stop.latitude <= city.north
export function distribution(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b)
  const p = (q) =>
    sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)] : null
  return {
    count: sorted.length,
    min: sorted[0] ?? null,
    p50: p(0.5),
    p95: p(0.95),
    max: sorted.at(-1) ?? null,
  }
}
export async function boundedFetch(url, init = {}, timeoutMs = 30000) {
  return fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(timeoutMs) })
}
export function failure(error) {
  // Never persist upstream bodies, URLs or arbitrary exception text.
  if (error?.code === 'EEXIST') return 'evaluation-already-running-or-stale-lock'
  return ['TimeoutError', 'AbortError'].includes(error?.name) ? 'timeout' : 'network-or-parse-error'
}
export function samplingWindow(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Dublin',
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  )
  const minutes = Number(parts.hour) * 60 + Number(parts.minute)
  const weekday = !['Sat', 'Sun'].includes(parts.weekday)
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    localTime: `${parts.hour}:${parts.minute}`,
    timezone: 'Europe/Dublin',
    window:
      weekday && minutes >= 420 && minutes < 540
        ? 'morning-peak'
        : weekday && minutes >= 720 && minutes < 840
          ? 'midday'
          : 'outside-planned-window',
  }
}
// Only tool-owned flat raw files are eligible; never follow symlinks or recurse.
export async function purgeExpiredRaw(now = Date.now()) {
  const raw = join(outputDirectory, 'raw')
  await mkdir(raw, { recursive: true })
  for (const entry of await readdir(raw, { withFileTypes: true })) {
    if (!entry.isFile()) continue
    const path = resolve(raw, entry.name)
    const rel = relative(raw, path)
    if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Unsafe retention path')
    if (now - (await stat(path)).mtimeMs >= 7 * 86400000) await unlink(path)
  }
}
