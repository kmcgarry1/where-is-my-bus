import type { Connect } from 'vite'
import { sendJson } from '../http.ts'

const rangeHours = {
  '6h': 6,
  '24h': 24,
  '7d': 24 * 7,
  '30d': 24 * 30,
} as const

export function opwRoutes(): Connect.NextHandleFunction {
  return async (request, response, next) => {
    const url = new URL(request.url ?? '/', 'http://atlasops.local')
    const match = url.pathname.match(/^\/api\/providers\/opw\/gauges\/([^/]+)\/telemetry$/)
    if (!match) {
      next()
      return
    }

    try {
      const assetId = decodeURIComponent(match[1])
      const stationRef = assetId.replace(/^opw-water:/, '')
      const compactRef = stationRef.replace(/^0+/, '').padStart(5, '0')
      const range = url.searchParams.get('range') ?? '24h'
      const maxHours = rangeHours[range as keyof typeof rangeHours] ?? 24
      const csvPath = `/data/month/${compactRef}_0001.csv`
      const upstream = await fetch(`https://waterlevel.ie${csvPath}`)
      if (!upstream.ok) throw new Error(`OPW history responded ${upstream.status}`)
      const readings = parseOpwCsv(assetId, await upstream.text()).slice(-(maxHours * 4))

      sendJson(response, 200, {
        assetId,
        metric: 'water-level',
        range,
        metrics: [{ id: 'water-level', label: 'Water level', unit: 'm', decimals: 3 }],
        readings,
        syncedAt: new Date().toISOString(),
      })
    } catch (error) {
      sendJson(response, 502, { error: error instanceof Error ? error.message : 'OPW telemetry request failed' })
    }
  }
}

function parseOpwCsv(assetId: string, csv: string) {
  const deduped = new Map<string, unknown>()
  for (const line of csv.split(/\r?\n/).slice(1)) {
    const [datetime, rawValue] = line.split(',')
    const value = Number.parseFloat(rawValue)
    const observedAt = datetime ? new Date(`${datetime.replace(' ', 'T')}:00Z`).toISOString() : ''
    if (!observedAt || !Number.isFinite(value)) continue
    deduped.set(observedAt, {
      assetId,
      metric: 'water-level',
      value,
      unit: 'm',
      observedAt,
      provider: 'opw-water',
      quality: 'valid',
    })
  }
  return [...deduped.values()]
}
