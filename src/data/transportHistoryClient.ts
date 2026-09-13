import type { AtlasEtaPrediction } from './movingAsset.types'

export async function recordEtaPrediction(prediction: AtlasEtaPrediction, predictorVersion = 'baseline-v1') {
  try {
    const response = await fetch('/api/transport/eta-predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prediction, predictorVersion }),
    })
    return response.ok
  } catch {
    return false
  }
}
