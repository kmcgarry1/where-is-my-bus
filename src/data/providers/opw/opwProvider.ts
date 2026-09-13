import type { AtlasProvider } from '../../atlas.types'
import { adaptOpwLatest } from './opwAdapter'
import type { OpwLatestGeoJson } from './opw.types'

const OPW_LATEST_URL = '/api/opw-waterlevel'

export const opwProvider: AtlasProvider = {
  id: 'opw-water',
  name: 'OPW Water Gauges',
  attribution: 'Office of Public Works / WaterLevel.ie',
  refreshIntervalMs: 15 * 60 * 1000,
  async fetchAssets() {
    const response = await fetch(`${OPW_LATEST_URL}?${Date.now()}`)
    if (!response.ok) throw new Error(`OPW responded ${response.status}`)
    return adaptOpwLatest(await response.json() as OpwLatestGeoJson)
  },
}
