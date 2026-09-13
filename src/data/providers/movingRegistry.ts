import type { AtlasMovingAssetCollection, AtlasMovingAssetProvider, MovingProviderState } from '../movingAsset.types'
import { ntaMovingProvider } from './ntaGtfsRealtime/ntaMovingProvider'

export const movingProviders: AtlasMovingAssetProvider[] = [
  ntaMovingProvider,
]

export function emptyMovingCollection(): AtlasMovingAssetCollection {
  return { type: 'FeatureCollection', features: [] }
}

export function emptyMovingProviderState(provider: AtlasMovingAssetProvider): MovingProviderState {
  return {
    id: provider.id,
    name: provider.name,
    attribution: provider.attribution,
    collection: emptyMovingCollection(),
    health: { status: 'degraded' },
    loading: false,
  }
}
