import type { Connect } from 'vite'
import { sendJson } from '../http.ts'
import { adaptSonitusMonitors, normaliseHistoricalReadings, sonitusMetricsForCategory } from './adapter.ts'
import { fetchSonitusMonitorPage, fetchSonitusMonitors } from './client.ts'

const rangeHours = {
  '6h': 6,
  '24h': 24,
} as const

export function sonitusRoutes(): Connect.NextHandleFunction {
  return async (request, response, next) => {
    const url = new URL(request.url ?? '/', 'http://atlasops.local')
    if (url.pathname === '/api/providers/sonitus/monitors') {
      try {
        const monitors = await fetchSonitusMonitors()
        sendJson(response, 200, {
          collection: adaptSonitusMonitors(monitors),
          syncedAt: new Date().toISOString(),
        })
      } catch (error) {
        sendJson(response, 502, { error: error instanceof Error ? error.message : 'Sonitus monitor request failed' })
      }
      return
    }

    const match = url.pathname.match(/^\/api\/providers\/sonitus\/monitors\/([^/]+)\/telemetry$/)
    if (!match) {
      next()
      return
    }

    try {
      const assetId = decodeURIComponent(match[1])
      const metric = url.searchParams.get('metric') ?? 'noise-laeq'
      const range = url.searchParams.get('range') ?? '24h'
      const maxHours = rangeHours[range as keyof typeof rangeHours]
      if (!maxHours) {
        sendJson(response, 400, { error: 'Sonitus telemetry supports 6h and 24h ranges' })
        return
      }
      const code = assetId.replace(/^dcc-sonitus:/, '')
      const monitors = await fetchSonitusMonitors()
      const monitor = monitors.find((item) => item.code === code)
      if (!monitor) {
        sendJson(response, 404, { error: 'Sonitus monitor not found' })
        return
      }

      const html = await fetchSonitusMonitorPage(code)
      const points = filterPointsByHours(parseHourlyChartPoints(html, metric), maxHours)
      sendJson(response, 200, {
        assetId,
        metric,
        range,
        metrics: sonitusMetricsForCategory(monitor.monitor_type.category),
        readings: normaliseHistoricalReadings(assetId, metric, points),
        syncedAt: new Date().toISOString(),
      })
    } catch (error) {
      sendJson(response, 502, { error: error instanceof Error ? error.message : 'Sonitus telemetry request failed' })
    }
  }
}

function filterPointsByHours(points: Array<[string, number | null]>, hours: number) {
  const sorted = points.sort((a, b) => Date.parse(a[0]) - Date.parse(b[0]))
  const latest = sorted.at(-1)?.[0]
  if (!latest) return []
  const cutoff = Date.parse(latest) - hours * 60 * 60 * 1000
  return sorted.filter(([observedAt]) => Date.parse(observedAt) >= cutoff)
}

function parseHourlyChartPoints(html: string, metric: string): Array<[string, number | null]> {
  const seriesName = seriesLabel(metric)
  if (!seriesName) return []
  const seriesIndex = html.indexOf(seriesName)
  if (seriesIndex === -1) return []
  const dataIndex = html.indexOf('data:', seriesIndex)
  if (dataIndex === -1) return []
  const start = html.indexOf('[', dataIndex)
  const tail = html.slice(start)
  const closeMatch = /\n\s*]\s*,?\s*\n\s*}/.exec(tail)
  const dataBlock = tail.slice(0, closeMatch?.index ?? 12000)
  const matches = [...dataBlock.matchAll(/Date\.UTC\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\),\s*([0-9.]+)/g)]

  return matches.map((match) => {
    const [, year, month, day, hour, minute, second, value] = match
    const observedAt = new Date(Date.UTC(
      Number(year),
      Number(month),
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    )).toISOString()
    return [observedAt, Number(value)]
  })
}

function seriesLabel(metric: string) {
  const labels: Record<string, string> = {
    'noise-laeq': "name: 'LAeq'",
    'noise-lafmax': "name: 'LAFmax'",
    pm2_5: "name: 'PM<sub>2.5</sub>'",
    pm10: "name: 'PM<sub>10</sub>'",
    no2: "name: 'NO<sub>2</sub>'",
    o3: "name: 'O<sub>3</sub>'",
  }
  return labels[metric]
}
