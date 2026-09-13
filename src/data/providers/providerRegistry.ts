import type { AtlasProvider, ProviderState } from '../atlas.types'
import { dublinBikesProvider } from './dublinBikes/dublinBikesProvider'
import { opwProvider } from './opw/opwProvider'
import { sonitusProvider } from './sonitus/sonitusProvider'

export const atlasProviders: AtlasProvider[] = [opwProvider, dublinBikesProvider, sonitusProvider]

export function emptyProviderState(provider: AtlasProvider): ProviderState {
  return {
    id: provider.id,
    name: provider.name,
    attribution: provider.attribution,
    collection: { type: 'FeatureCollection', features: [] },
    health: { status: 'degraded' },
    loading: false,
  }
}
