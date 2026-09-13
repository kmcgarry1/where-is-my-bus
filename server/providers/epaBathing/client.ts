import { z } from 'zod'
import { cached } from '../cache.ts'
import { epaAlertSchema, epaListResponseSchema, epaLocationSchema, type EpaBathingAlert, type EpaBathingLocation } from './schemas.ts'

const baseUrl = 'https://data.epa.ie/bw/api/v1'
const ttlMs = 10 * 60 * 1000

export async function fetchEpaBathingAlerts(): Promise<EpaBathingAlert[]> {
  return cached('epa-bathing-alerts', ttlMs, () => fetchPaged('/alerts', epaAlertSchema))
}

export async function fetchEpaBathingLocations(): Promise<EpaBathingLocation[]> {
  return cached('epa-bathing-locations', ttlMs, () => fetchPaged('/locations', epaLocationSchema))
}

async function fetchPaged<T>(path: string, itemSchema: z.ZodType<T>): Promise<T[]> {
  const perPage = 100
  const first = await fetchPage(path, itemSchema, 1, perPage)
  const pageCount = Math.ceil(first.count / perPage)
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pageCount - 1) }, (_item, index) => fetchPage(path, itemSchema, index + 2, perPage)),
  )
  return [first.list, ...rest.map((page) => page.list)].flat()
}

async function fetchPage<T>(path: string, itemSchema: z.ZodType<T>, page: number, perPage: number) {
  const url = `${baseUrl}${path}?page=${page}&per_page=${perPage}`
  const response = await fetch(url, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`EPA Bathing Water ${path} responded ${response.status}`)

  const contentType = response.headers.get('content-type') ?? ''
  const body = await response.text()
  if (!contentType.includes('application/json')) {
    throw new Error(`EPA Bathing Water ${path} returned ${describeNonJsonResponse(contentType, body)}`)
  }

  try {
    return epaListResponseSchema(itemSchema).parse(JSON.parse(body))
  } catch (error) {
    throw new Error(`EPA Bathing Water ${path} returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function describeNonJsonResponse(contentType: string, body: string) {
  const normalized = body.trim().replace(/\s+/g, ' ').slice(0, 120)
  const type = contentType || 'unknown content type'
  if (normalized.toLowerCase().startsWith('<!doctype') || normalized.toLowerCase().startsWith('<html')) {
    return `HTML (${type}) from the upstream EPA API`
  }
  return `non-JSON content (${type}): ${normalized || 'empty response'}`
}
