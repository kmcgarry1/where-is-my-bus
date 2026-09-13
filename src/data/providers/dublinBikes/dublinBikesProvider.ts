import type { AtlasProvider } from '../../atlas.types'
import { adaptDublinBikes } from './dublinBikesAdapter'
import type { DublinBikesGeoJson } from './dublinBikes.types'

const DUBLIN_BIKES_URL = 'https://data.smartdublin.ie/dublinbikes-api/bikes/dublin_bikes/current/stations.geojson'

export const dublinBikesProvider: AtlasProvider = {
  id: 'dublin-bikes',
  name: 'DublinBikes',
  attribution: 'Smart Dublin / Dublin City Council',
  refreshIntervalMs: 60 * 1000,
  async fetchAssets() {
    const response = await fetch(DUBLIN_BIKES_URL)
    if (!response.ok) throw new Error(`DublinBikes responded ${response.status}`)
    return adaptDublinBikes(await response.json() as DublinBikesGeoJson)
  },
}
