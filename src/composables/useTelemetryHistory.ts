import { computed, ref, watch, type Ref } from 'vue'
import type { AtlasPointFeature } from '../data/atlas.types'
import { defaultMetricForFeature, fetchTelemetry, metricsForFeature, rangesForFeature } from '../data/telemetryClient'
import type { TelemetryMetric, TelemetryQueryState, TelemetryRange } from '../data/telemetry.types'

export function useTelemetryHistory(feature: Ref<AtlasPointFeature | null>) {
  const range = ref<TelemetryRange>('24h')
  const selectedMetric = ref<TelemetryMetric | null>(null)
  const availableMetrics = computed(() => feature.value ? metricsForFeature(feature.value) : [])
  const availableRanges = computed(() => feature.value ? rangesForFeature(feature.value) : ['24h'] as TelemetryRange[])
  const state = ref<TelemetryQueryState>({
    assetId: '',
    metric: '',
    range: '24h',
    status: 'idle',
    readings: [],
  })
  let requestId = 0
  let controller: AbortController | null = null

  watch(feature, (current) => {
    controller?.abort()
    selectedMetric.value = current ? defaultMetricForFeature(current) : null
    if (current && !rangesForFeature(current).includes(range.value)) range.value = '24h'
    state.value = {
      assetId: current?.properties.id ?? '',
      metric: selectedMetric.value?.id ?? '',
      range: range.value,
      status: current && selectedMetric.value ? 'loading' : 'idle',
      readings: [],
    }
    if (current && selectedMetric.value) load()
  }, { immediate: true })

  watch([selectedMetric, range], () => {
    if (feature.value && selectedMetric.value) load()
  })

  async function load() {
    if (!feature.value || !selectedMetric.value) return
    controller?.abort()
    controller = new AbortController()
    const currentRequest = ++requestId
    const assetId = feature.value.properties.id
    const metric = selectedMetric.value.id

    state.value = { assetId, metric, range: range.value, status: 'loading', readings: [] }

    try {
      const result = await fetchTelemetry(feature.value, metric, range.value)
      if (currentRequest !== requestId) return
      state.value = {
        assetId,
        metric,
        range: range.value,
        status: result.readings.length > 0 ? 'success' : 'empty',
        readings: result.readings,
      }
    } catch (error) {
      if (currentRequest !== requestId || controller.signal.aborted) return
      state.value = {
        assetId,
        metric,
        range: range.value,
        status: 'error',
        readings: [],
        error: error instanceof Error ? error.message : 'Unable to load telemetry',
      }
    }
  }

  return {
    availableMetrics,
    availableRanges,
    range,
    reload: load,
    selectedMetric,
    state,
  }
}
