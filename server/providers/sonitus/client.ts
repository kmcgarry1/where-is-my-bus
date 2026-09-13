import { cached } from '../cache.ts'
import { sonitusMonitorsSchema, type SonitusMonitor } from './schemas.ts'

const MONITOR_URL = 'https://dublincityairandnoise.ie/assets/php/get-monitors.php'
const MONITOR_PAGE_URL = 'https://dublincityairandnoise.ie/monitor'

export async function fetchSonitusMonitors(): Promise<SonitusMonitor[]> {
  return cached('sonitus:monitors', 5 * 60 * 1000, async () => {
    const response = await fetch(MONITOR_URL, { headers: authHeaders() })
    if (!response.ok) throw new Error(`Sonitus monitors responded ${response.status}`)
    return sonitusMonitorsSchema.parse(await response.json())
  })
}

export async function fetchSonitusMonitorPage(code: string): Promise<string> {
  return cached(`sonitus:monitor-page:${code}`, 5 * 60 * 1000, async () => {
    const response = await fetch(`${MONITOR_PAGE_URL}/${encodeURIComponent(code)}`, { headers: authHeaders() })
    if (!response.ok) throw new Error(`Sonitus monitor page responded ${response.status}`)
    return response.text()
  })
}

function authHeaders(): Record<string, string> {
  const username = process.env.SONITUS_USERNAME
  const password = process.env.SONITUS_PASSWORD
  if (!username || !password) return { Accept: 'application/json' }

  return {
    Accept: 'application/json',
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
  }
}
