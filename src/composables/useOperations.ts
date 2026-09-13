import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { AtlasAssetType, AtlasFilters, AtlasProviderId, AtlasSelection, AtlasStatus, ProviderState } from '../data/atlas.types'
import { deriveAssetHealthIncidents } from '../data/incidents/derivedIncidents'
import type { AtlasIncidentCollection, AtlasIncidentFeature, AtlasIncidentFilters, AtlasIncidentProviderId, AtlasIncidentSeverity, AtlasIncidentStatus, IncidentProviderState } from '../data/incident.types'
import { deriveMissingMovingBearings, interpolateMovingCollection } from '../data/moving/interpolation'
import { predictArrivalAtStop, predictNextStopArrival } from '../data/moving/etaPredictor'
import { recordedMovingCollectionForTime, recordedMovingReplayBounds, recordedMovingTrailMap } from '../data/moving/replay'
import { featureMatchesTransportFilters, filterMovingCollectionBySpatialFilter } from '../data/moving/transportFilters'
import { trailCollectionForVehicle, updateVehicleTrails } from '../data/moving/trails'
import type { AtlasEtaPrediction, AtlasMovingAssetCollection, AtlasMovingAssetFeature, AtlasMovingFilters, AtlasMovingProviderId, AtlasMovingAssetType, AtlasStopArrival, AtlasStopArrivalsState, AtlasStopService, AtlasTransitStopCollection, AtlasTransportFilterState, AtlasTransportRouteIndex, AtlasTripContext, AtlasVehiclePositionObservation, AtlasVehicleTrailCollection, MovingProviderState } from '../data/movingAsset.types'
import { atlasProviders, emptyProviderState } from '../data/providers/providerRegistry'
import { emptyIncidentProviderState, incidentProviders } from '../data/providers/incidentRegistry'
import { emptyNtaDiagnosticsState, fetchNtaDiagnostics } from '../data/providers/ntaGtfsRealtime/diagnostics'
import { fetchNtaRouteIndex } from '../data/providers/ntaGtfsRealtime/routes'
import { fetchNtaStopServices } from '../data/providers/ntaGtfsRealtime/stopServices'
import { fetchNtaTransitStops } from '../data/providers/ntaGtfsRealtime/stops'
import { fetchNtaTripContext } from '../data/providers/ntaGtfsRealtime/tripContext'
import { emptyMovingProviderState, movingProviders } from '../data/providers/movingRegistry'
import type { AtlasTimeContext } from '../data/time.types'
import { recordEtaPrediction } from '../data/transportHistoryClient'

export const providerIds: AtlasProviderId[] = ['opw-water', 'dublin-bikes', 'dcc-sonitus']
export const assetTypes: AtlasAssetType[] = ['water-gauge', 'bike-station', 'noise-monitor', 'air-quality-monitor']
export const statuses: AtlasStatus[] = ['normal', 'warning', 'critical', 'offline', 'unknown']
export const incidentProviderIds: AtlasIncidentProviderId[] = ['epa-bathing-water', 'nta-gtfs-realtime', 'atlas-derived']
export const incidentSeverities: AtlasIncidentSeverity[] = ['info', 'minor', 'major', 'critical']
export const incidentStatuses: AtlasIncidentStatus[] = ['active', 'monitoring', 'resolved']
export const movingProviderIds: AtlasMovingProviderId[] = ['nta-gtfs-realtime']
export const movingAssetTypes: AtlasMovingAssetType[] = ['bus', 'tram', 'rail', 'vehicle']

const initialFilters: AtlasFilters = {
  providers: [...providerIds],
  assetTypes: [...assetTypes],
  statuses: [...statuses],
}
const movingTransitionMs = 1200
const vehicleHistoryMs = 5 * 60 * 1000
const maxVehicleHistoryPoints = 12

export function useOperations() {
  const filters = ref<AtlasFilters>({
    providers: [...initialFilters.providers],
    assetTypes: [...initialFilters.assetTypes],
    statuses: [...initialFilters.statuses],
  })
  const selected = ref<AtlasSelection | null>(null)
  const providers = ref<ProviderState[]>(atlasProviders.map(emptyProviderState))
  const incidentProviderStates = ref<IncidentProviderState[]>(incidentProviders.map(emptyIncidentProviderState))
  const movingProviderStates = ref<MovingProviderState[]>(movingProviders.map(emptyMovingProviderState))
  const ntaDiagnosticsState = ref(emptyNtaDiagnosticsState())
  const transportRouteIndex = ref<AtlasTransportRouteIndex>({ source: 'unavailable', routes: [] })
  const transportRouteIndexLoading = ref(false)
  const transportRouteIndexError = ref<string>()
  const transitStops = ref<AtlasTransitStopCollection>({ type: 'FeatureCollection', features: [] })
  const transitStopsLoading = ref(false)
  const transitStopsError = ref<string>()
  const selectedEtaPrediction = ref<AtlasEtaPrediction | null>(null)
  const selectedEtaPredictionLoading = ref(false)
  const selectedEtaPredictionError = ref<string>()
  const selectedStopArrivals = ref<AtlasStopArrivalsState>({ services: [], arrivals: [], loading: false })
  const transportFilters = ref<AtlasTransportFilterState>({
    routeIds: [],
  })
  const viewportBounds = ref<{ west: number; south: number; east: number; north: number }>()
  const vehicleTrails = ref<Map<string, [number, number][]>>(new Map())
  const vehiclePositionHistory = ref<Map<string, AtlasVehiclePositionObservation[]>>(new Map())
  const tripContextCache = new Map<string, AtlasTripContext>()
  const stopServicesCache = new Map<string, AtlasStopService[]>()
  const incidentFilters = ref<AtlasIncidentFilters>({
    providers: [...incidentProviderIds],
    severities: [...incidentSeverities],
    statuses: ['active', 'monitoring'],
  })
  const movingFilters = ref<AtlasMovingFilters>({
    providers: [...movingProviderIds],
    assetTypes: [...movingAssetTypes],
    statuses: ['normal', 'warning', 'critical', 'offline', 'unknown'],
  })
  const timeContext = ref<AtlasTimeContext>({
    mode: 'live',
    timestamp: new Date().toISOString(),
    playing: false,
  })
  const timers: number[] = []
  const movingAnimationFrames = new Map<AtlasMovingProviderId, number>()
  let replayTimer: number | null = null
  let etaRequestSequence = 0

  const providerCollections = computed(() => Object.fromEntries(
    providers.value.map((provider) => [provider.id, provider.collection]),
  ) as Record<AtlasProviderId, ProviderState['collection']>)

  const allFeatures = computed(() => providers.value.flatMap((provider) => provider.collection.features))
  const derivedIncidents = computed(() => deriveAssetHealthIncidents(allFeatures.value))
  const allIncidents = computed(() => [
    ...incidentProviderStates.value.flatMap((provider) => provider.collection.features),
    ...derivedIncidents.value.features,
  ])
  const liveMovingCollections = computed(() => Object.fromEntries(
    movingProviderStates.value.map((provider) => [provider.id, provider.collection]),
  ) as Record<AtlasMovingProviderId, AtlasMovingAssetCollection>)
  const movingCollections = computed(() => {
    if (timeContext.value.mode === 'replay') {
      return {
        ...liveMovingCollections.value,
        'nta-gtfs-realtime': recordedMovingCollectionForTime(timeContext.value.timestamp),
      }
    }
    return liveMovingCollections.value
  })
  const spatialMovingCollections = computed(() => Object.fromEntries(
    movingProviderIds.map((providerId) => [
      providerId,
      filterMovingCollectionBySpatialFilter(
        movingCollections.value[providerId],
        transportFilters.value.spatialFilter,
        viewportBounds.value,
      ),
    ]),
  ) as Record<AtlasMovingProviderId, AtlasMovingAssetCollection>)
  const allMovingFeatures = computed(() => Object.values(spatialMovingCollections.value).flatMap((collection) => collection.features))
  const totalMovingFeatureCount = computed(() => Object.values(movingCollections.value).reduce((total, collection) => total + collection.features.length, 0))
  const visibleMovingFeatures = computed(() => allMovingFeatures.value.filter((feature) => {
    return movingFilters.value.providers.includes(feature.properties.provider)
      && movingFilters.value.assetTypes.includes(feature.properties.assetType)
      && movingFilters.value.statuses.includes(feature.properties.status)
      && featureMatchesTransportFilters(feature, transportFilters.value.routeIds)
  }))

  const visibleFeatures = computed(() => allFeatures.value.filter((feature) => {
    return filters.value.providers.includes(feature.properties.provider)
      && filters.value.assetTypes.includes(feature.properties.assetType)
      && filters.value.statuses.includes(feature.properties.status)
  }))

  const selectedFeature = computed(() => {
    if (!selected.value || selected.value.kind !== 'asset') return null
    return allFeatures.value.find((feature) => {
      return feature.properties.provider === selected.value?.provider
        && feature.properties.id === selected.value?.featureId
    }) ?? null
  })

  const selectedIncident = computed(() => {
    if (!selected.value || selected.value.kind !== 'incident') return null
    return allIncidents.value.find((incident) => {
      return incident.properties.provider === selected.value?.provider
        && incident.properties.id === selected.value?.featureId
    }) ?? null
  })

  const selectedMovingFeature = computed(() => {
    if (!selected.value || selected.value.kind !== 'moving') return null
    return allMovingFeatures.value.find((feature) => {
      return feature.properties.provider === selected.value?.provider
        && feature.properties.id === selected.value?.featureId
    }) ?? null
  })

  const selectedTransitStop = computed(() => {
    if (!selected.value || selected.value.kind !== 'transit-stop') return null
    return transitStops.value.features.find((feature) => feature.properties.id === selected.value?.featureId) ?? null
  })

  const selectedVehicleTrail = computed<AtlasVehicleTrailCollection>(() => trailCollectionForVehicle(
    selected.value?.kind === 'moving' ? selected.value.featureId : undefined,
    timeContext.value.mode === 'replay' ? recordedMovingTrailMap(timeContext.value.timestamp) : vehicleTrails.value,
  ))

  const replayTimelineBounds = computed(() => {
    const movingBounds = recordedMovingReplayBounds()
    const incidentTimes = allIncidents.value.flatMap((incident) => [
      Date.parse(incident.properties.startedAt),
      incident.properties.endedAt ? Date.parse(incident.properties.endedAt) : NaN,
    ]).filter(Number.isFinite)
    return {
      min: Math.min(movingBounds.min, ...incidentTimes),
      max: Math.max(Date.now(), movingBounds.max, ...incidentTimes),
    }
  })

  const timeScopedIncidents = computed(() => allIncidents.value.flatMap((incident) => {
    const reconstructed = incidentForTime(incident, timeContext.value)
    return reconstructed ? [reconstructed] : []
  }))

  const visibleIncidents = computed(() => timeScopedIncidents.value.filter((incident) => {
    return incidentFilters.value.providers.includes(incident.properties.provider)
      && incidentFilters.value.severities.includes(incident.properties.severity)
      && incidentFilters.value.statuses.includes(incident.properties.status)
  }))

  const incidentCollections = computed(() => Object.fromEntries(
    incidentProviderIds.map((providerId) => [
      providerId,
      {
        type: 'FeatureCollection',
        features: visibleIncidents.value.filter((incident) => incident.properties.provider === providerId),
      },
    ]),
  ) as Record<AtlasIncidentProviderId, AtlasIncidentCollection>)

  const visibleFeatureCount = computed(() => visibleFeatures.value.length)
  const warningCount = computed(() => visibleFeatures.value.filter((feature) => feature.properties.status === 'warning').length)
  const criticalCount = computed(() => visibleFeatures.value.filter((feature) => feature.properties.status === 'critical').length)
  const visibleIncidentCount = computed(() => visibleIncidents.value.length)
  const movingFeatureCount = computed(() => visibleMovingFeatures.value.length)

  watch(visibleMovingFeatures, (features) => {
    if (selected.value?.kind !== 'moving') return
    const stillVisible = features.some((feature) => feature.properties.id === selected.value?.featureId)
    if (!stillVisible) selected.value = null
  })

  watch(selected, () => {
    void updateSelectedEtaPrediction()
    void updateSelectedStopArrivals()
  })

  watch(() => timeContext.value.mode, () => {
    void updateSelectedEtaPrediction()
    void updateSelectedStopArrivals()
  })

  watch(() => transportFilters.value.routeIds, () => {
    void updateSelectedStopArrivals()
  }, { deep: true })

  async function syncProvider(providerId: AtlasProviderId) {
    const provider = atlasProviders.find((item) => item.id === providerId)
    const state = providers.value.find((item) => item.id === providerId)
    if (!provider || !state) return

    state.loading = true
    state.health.lastAttempt = new Date().toISOString()

    try {
      const collection = await provider.fetchAssets()
      state.collection = collection
      state.health = {
        status: collection.features.length > 0 ? 'healthy' : 'degraded',
        lastAttempt: state.health.lastAttempt,
        lastSuccessfulSync: new Date().toISOString(),
        featureCount: collection.features.length,
      }
    } catch (error) {
      state.health = {
        ...state.health,
        status: state.health.lastSuccessfulSync ? 'degraded' : 'unavailable',
        error: error instanceof Error ? error.message : 'Provider request failed',
      }
    } finally {
      state.loading = false
    }
  }

  async function syncIncidentProvider(providerId: AtlasIncidentProviderId) {
    if (providerId === 'atlas-derived') return
    const provider = incidentProviders.find((item) => item.id === providerId)
    const state = incidentProviderStates.value.find((item) => item.id === providerId)
    if (!provider || !state) return

    state.loading = true
    state.health.lastAttempt = new Date().toISOString()

    try {
      const collection = await provider.fetchIncidents()
      state.collection = collection
      state.health = {
        status: collection.features.length > 0 ? 'healthy' : 'degraded',
        lastAttempt: state.health.lastAttempt,
        lastSuccessfulSync: new Date().toISOString(),
        featureCount: collection.features.length,
      }
    } catch (error) {
      state.health = {
        ...state.health,
        status: state.health.lastSuccessfulSync ? 'degraded' : 'unavailable',
        error: error instanceof Error ? error.message : 'Incident provider request failed',
      }
    } finally {
      state.loading = false
    }
  }

  async function syncMovingProvider(providerId: AtlasMovingProviderId) {
    const provider = movingProviders.find((item) => item.id === providerId)
    const state = movingProviderStates.value.find((item) => item.id === providerId)
    if (!provider || !state) return

    state.loading = true
    state.health.lastAttempt = new Date().toISOString()

    try {
      const collection = deriveMissingMovingBearings(state.collection, await provider.fetchMovingAssets())
      animateMovingProviderCollection(providerId, state, collection)
      vehicleTrails.value = updateVehicleTrails(vehicleTrails.value, collection.features)
      vehiclePositionHistory.value = updateVehiclePositionHistory(vehiclePositionHistory.value, collection.features)
      void updateSelectedEtaPrediction(collection)
      void updateSelectedStopArrivals(collection)
      state.health = {
        status: collection.features.length > 0 ? 'healthy' : 'degraded',
        lastAttempt: state.health.lastAttempt,
        lastSuccessfulSync: new Date().toISOString(),
        featureCount: collection.features.length,
      }
    } catch (error) {
      state.health = {
        ...state.health,
        status: state.health.lastSuccessfulSync ? 'degraded' : 'unavailable',
        error: error instanceof Error ? error.message : 'Moving provider request failed',
      }
    } finally {
      state.loading = false
    }
  }

  async function syncNtaDiagnostics() {
    ntaDiagnosticsState.value = {
      ...ntaDiagnosticsState.value,
      loading: true,
      error: undefined,
    }

    try {
      const response = await fetchNtaDiagnostics()
      ntaDiagnosticsState.value = {
        diagnostics: response.diagnostics,
        checkedAt: response.checkedAt,
        loading: false,
      }
    } catch (error) {
      ntaDiagnosticsState.value = {
        ...ntaDiagnosticsState.value,
        loading: false,
        error: error instanceof Error ? error.message : 'NTA diagnostics request failed',
      }
    }
  }

  async function syncTransportRouteIndex() {
    transportRouteIndexLoading.value = true
    transportRouteIndexError.value = undefined
    try {
      transportRouteIndex.value = await fetchNtaRouteIndex()
    } catch (error) {
      transportRouteIndexError.value = error instanceof Error ? error.message : 'NTA route index request failed'
    } finally {
      transportRouteIndexLoading.value = false
    }
  }

  async function syncTransitStops() {
    transitStopsLoading.value = true
    transitStopsError.value = undefined
    try {
      const response = await fetchNtaTransitStops()
      transitStops.value = response.collection
    } catch (error) {
      transitStopsError.value = error instanceof Error ? error.message : 'NTA stops request failed'
    } finally {
      transitStopsLoading.value = false
    }
  }

  async function updateSelectedEtaPrediction(latestCollection?: AtlasMovingAssetCollection) {
    const requestSequence = ++etaRequestSequence
    if (selected.value?.kind !== 'moving' || timeContext.value.mode !== 'live') {
      selectedEtaPrediction.value = null
      selectedEtaPredictionError.value = undefined
      selectedEtaPredictionLoading.value = false
      return
    }

    const vehicle = latestCollection?.features.find((feature) => feature.properties.id === selected.value?.featureId)
      ?? selectedMovingFeature.value
    if (!vehicle) {
      selectedEtaPrediction.value = null
      selectedEtaPredictionError.value = undefined
      selectedEtaPredictionLoading.value = false
      return
    }

    selectedEtaPredictionLoading.value = true
    selectedEtaPredictionError.value = undefined
    try {
      const tripContext = await tripContextForVehicle(vehicle, tripContextCache)
      if (requestSequence !== etaRequestSequence) return
      selectedEtaPrediction.value = predictNextStopArrival({
        vehicle,
        tripContext,
        recentPositions: vehiclePositionHistory.value.get(vehicle.properties.id) ?? [],
        now: new Date().toISOString(),
      })
      if (selectedEtaPrediction.value.status === 'available') void recordEtaPrediction(selectedEtaPrediction.value)
    } catch (error) {
      if (requestSequence !== etaRequestSequence) return
      selectedEtaPrediction.value = null
      selectedEtaPredictionError.value = error instanceof Error ? error.message : 'ETA prediction failed'
    } finally {
      if (requestSequence === etaRequestSequence) selectedEtaPredictionLoading.value = false
    }
  }

  async function updateSelectedStopArrivals(latestCollection?: AtlasMovingAssetCollection) {
    if (selected.value?.kind !== 'transit-stop' || timeContext.value.mode !== 'live') {
      selectedStopArrivals.value = { services: [], arrivals: [], loading: false }
      return
    }
    const stop = transitStops.value.features.find((feature) => feature.properties.id === selected.value?.featureId)
    if (!stop) {
      selectedStopArrivals.value = { services: [], arrivals: [], loading: false }
      return
    }

    selectedStopArrivals.value = { ...selectedStopArrivals.value, stopId: stop.properties.stopId, loading: true, error: undefined }
    try {
      const services = await stopServicesForStop(stop.properties.stopId, transportFilters.value.routeIds, stopServicesCache)
      const arrivals = await arrivalsForStop(
        stop.properties.stopId,
        services,
        latestCollection ?? liveMovingCollections.value['nta-gtfs-realtime'],
        vehiclePositionHistory.value,
        tripContextCache,
      )
      selectedStopArrivals.value = {
        stopId: stop.properties.stopId,
        services,
        arrivals,
        loading: false,
        calculatedAt: new Date().toISOString(),
      }
    } catch (error) {
      selectedStopArrivals.value = {
        stopId: stop.properties.stopId,
        services: [],
        arrivals: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Stop arrivals failed',
      }
    }
  }

  function startProviderSync() {
    void Promise.all(atlasProviders.map((provider) => syncProvider(provider.id)))
    void Promise.all(incidentProviders.map((provider) => syncIncidentProvider(provider.id)))
    void Promise.all(movingProviders.map((provider) => syncMovingProvider(provider.id)))
    void syncNtaDiagnostics()
    void syncTransportRouteIndex()
    void syncTransitStops()
    for (const provider of atlasProviders) {
      timers.push(window.setInterval(() => {
        void syncProvider(provider.id)
      }, provider.refreshIntervalMs))
    }
    for (const provider of incidentProviders) {
      timers.push(window.setInterval(() => {
        void syncIncidentProvider(provider.id)
      }, provider.refreshIntervalMs))
    }
    for (const provider of movingProviders) {
      timers.push(window.setInterval(() => {
        void syncMovingProvider(provider.id)
      }, provider.refreshIntervalMs))
    }
    timers.push(window.setInterval(() => {
      void syncNtaDiagnostics()
    }, 60 * 1000))
  }

  function stopProviderSync() {
    for (const timer of timers) window.clearInterval(timer)
    timers.length = 0
    stopMovingAnimations()
    stopReplay()
  }

  function animateMovingProviderCollection(providerId: AtlasMovingProviderId, state: MovingProviderState, target: AtlasMovingAssetCollection) {
    stopMovingAnimation(providerId)
    const source = state.collection
    const hasPreviousFeatures = source.features.length > 0
    const canAnimate = hasPreviousFeatures && target.features.some((feature) => (
      source.features.some((previous) => previous.properties.id === feature.properties.id)
    ))
    if (!canAnimate) {
      state.collection = target
      return
    }

    const startedAt = performance.now()
    const tick = () => {
      const ratio = Math.min((performance.now() - startedAt) / movingTransitionMs, 1)
      state.collection = interpolateMovingCollection(source, target, easeOutCubic(ratio))
      if (ratio < 1) {
        movingAnimationFrames.set(providerId, window.requestAnimationFrame(tick))
        return
      }
      state.collection = interpolateMovingCollection(source, target, 1)
      movingAnimationFrames.delete(providerId)
    }

    movingAnimationFrames.set(providerId, window.requestAnimationFrame(tick))
  }

  function stopMovingAnimation(providerId: AtlasMovingProviderId) {
    const frame = movingAnimationFrames.get(providerId)
    if (frame !== undefined) window.cancelAnimationFrame(frame)
    movingAnimationFrames.delete(providerId)
  }

  function stopMovingAnimations() {
    for (const frame of movingAnimationFrames.values()) window.cancelAnimationFrame(frame)
    movingAnimationFrames.clear()
  }

  function toggleFilter<T extends keyof AtlasFilters>(key: T, value: AtlasFilters[T][number]) {
    const current = filters.value[key] as string[]
    filters.value = {
      ...filters.value,
      [key]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    }
  }

  function toggleIncidentFilter<T extends keyof AtlasIncidentFilters>(key: T, value: AtlasIncidentFilters[T][number]) {
    const current = incidentFilters.value[key] as string[]
    incidentFilters.value = {
      ...incidentFilters.value,
      [key]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    }
  }

  function toggleMovingFilter<T extends keyof AtlasMovingFilters>(key: T, value: AtlasMovingFilters[T][number]) {
    const current = movingFilters.value[key] as string[]
    movingFilters.value = {
      ...movingFilters.value,
      [key]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    }
  }

  function setTransportRouteFilter(routeId: string) {
    transportFilters.value = {
      ...transportFilters.value,
      routeIds: routeId ? [routeId] : [],
    }
  }

  function clearTransportRouteFilter() {
    transportFilters.value = {
      ...transportFilters.value,
      routeIds: [],
    }
  }

  function setTransportRegionFilter(region: { id: string; label: string; west: number; south: number; east: number; north: number }) {
    transportFilters.value = {
      ...transportFilters.value,
      spatialFilter: { type: 'region', ...region },
    }
  }

  function setTransportViewportFilter(enabled: boolean) {
    transportFilters.value = {
      ...transportFilters.value,
      spatialFilter: enabled ? { type: 'viewport' } : undefined,
    }
  }

  function clearTransportSpatialFilter() {
    transportFilters.value = {
      ...transportFilters.value,
      spatialFilter: undefined,
    }
  }

  function clearTransportFilters() {
    transportFilters.value = { routeIds: [] }
  }

  function setTransportViewportBounds(bounds: { west: number; south: number; east: number; north: number }) {
    viewportBounds.value = bounds
  }

  function selectFeature(provider: AtlasProviderId, featureId: string) {
    selected.value = { kind: 'asset', provider, featureId }
  }

  function selectIncident(provider: AtlasIncidentProviderId, featureId: string) {
    selected.value = { kind: 'incident', provider, featureId }
  }

  function selectMoving(provider: AtlasMovingProviderId, featureId: string) {
    selected.value = { kind: 'moving', provider, featureId }
    void updateSelectedEtaPrediction()
  }

  function selectTransitStop(provider: 'nta-gtfs-realtime', featureId: string) {
    selected.value = { kind: 'transit-stop', provider, featureId }
  }

  function setReplayTimestamp(timestamp: string) {
    timeContext.value = { ...timeContext.value, mode: 'replay', timestamp, playing: timeContext.value.playing }
  }

  function enterReplay() {
    const movingBounds = recordedMovingReplayBounds()
    timeContext.value = {
      mode: 'replay',
      timestamp: new Date(movingBounds.min).toISOString(),
      playing: false,
    }
  }

  function returnToLive() {
    stopReplay()
    timeContext.value = { mode: 'live', timestamp: new Date().toISOString(), playing: false }
  }

  function toggleReplayPlayback() {
    if (timeContext.value.mode !== 'replay') enterReplay()
    if (timeContext.value.playing) {
      stopReplay()
      return
    }
    timeContext.value = { ...timeContext.value, playing: true }
    replayTimer = window.setInterval(() => {
      const next = Date.parse(timeContext.value.timestamp) + 30 * 60 * 1000
      const now = Date.now()
      if (next >= now) {
        returnToLive()
        return
      }
      timeContext.value = { ...timeContext.value, timestamp: new Date(next).toISOString() }
    }, 1000)
  }

  function stopReplay() {
    if (replayTimer !== null) window.clearInterval(replayTimer)
    replayTimer = null
    if (timeContext.value.playing) timeContext.value = { ...timeContext.value, playing: false }
  }

  onBeforeUnmount(stopProviderSync)

  return {
    criticalCount,
    filters,
    incidentCollections,
    incidentFilters,
    incidentProviderStates,
    movingCollections,
    movingFilters,
    movingFeatureCount,
    movingProviderStates,
    ntaDiagnosticsState,
    providerCollections,
    providers,
    selected,
    selectedFeature,
    selectedIncident,
    selectedMovingFeature,
    selectedEtaPrediction,
    selectedEtaPredictionError,
    selectedEtaPredictionLoading,
    selectedStopArrivals,
    selectedTransitStop,
    selectedVehicleTrail,
    spatialMovingCollections,
    totalMovingFeatureCount,
    transportFilters,
    transportRouteIndex,
    transportRouteIndexError,
    transportRouteIndexLoading,
    transitStops,
    transitStopsError,
    transitStopsLoading,
    replayTimelineBounds,
    startProviderSync,
    syncProvider,
    timeContext,
    toggleFilter,
    toggleIncidentFilter,
    toggleMovingFilter,
    toggleReplayPlayback,
    enterReplay,
    returnToLive,
    setReplayTimestamp,
    setTransportRegionFilter,
    setTransportRouteFilter,
    setTransportViewportBounds,
    setTransportViewportFilter,
    clearTransportFilters,
    clearTransportRouteFilter,
    clearTransportSpatialFilter,
    visibleFeatureCount,
    visibleFeatures,
    visibleIncidentCount,
    visibleIncidents,
    visibleMovingFeatures,
    warningCount,
    selectFeature,
    selectIncident,
    selectMoving,
    selectTransitStop,
  }
}

async function tripContextForVehicle(
  vehicle: AtlasMovingAssetFeature,
  cache: Map<string, AtlasTripContext>,
) {
  const tripId = vehicle.properties.tripId
  if (!tripId) return undefined
  const cached = cache.get(tripId)
  if (cached) return cached
  const response = await fetchNtaTripContext(tripId)
  cache.set(tripId, response.context)
  return response.context
}

async function stopServicesForStop(
  stopId: string,
  routeIds: string[],
  cache: Map<string, AtlasStopService[]>,
) {
  const key = `${stopId}:${routeIds.join(',')}`
  const cached = cache.get(key)
  if (cached) return cached
  const response = await fetchNtaStopServices(stopId, routeIds)
  cache.set(key, response.services)
  return response.services
}

async function arrivalsForStop(
  stopId: string,
  services: AtlasStopService[],
  collection: AtlasMovingAssetCollection,
  history: Map<string, AtlasVehiclePositionObservation[]>,
  tripContexts: Map<string, AtlasTripContext>,
) {
  const now = new Date().toISOString()
  const arrivals: AtlasStopArrival[] = []
  const vehicles = collection.features.filter((vehicle) => vehicle.properties.tripId)
  for (const service of services) {
    const tripIds = new Set(service.tripIds)
    const candidates = vehicles.filter((vehicle) => vehicle.properties.tripId && tripIds.has(vehicle.properties.tripId))
    const predictions: AtlasStopArrival[] = []
    for (const vehicle of candidates) {
      const tripContext = await tripContextForVehicle(vehicle, tripContexts)
      const prediction = predictArrivalAtStop({
        vehicle,
        tripContext,
        targetStopId: stopId,
        recentPositions: history.get(vehicle.properties.id) ?? [],
        now,
      })
      if (prediction.status !== 'available' || !prediction.predictedArrival) continue
      void recordEtaPrediction(prediction)
      predictions.push({
        stopId,
        vehicleFeatureId: vehicle.properties.id,
        vehicleId: vehicle.properties.vehicleId,
        routeId: service.routeId,
        routeShortName: service.routeShortName,
        tripId: vehicle.properties.tripId ?? service.scheduledTripId ?? '',
        directionId: service.directionId,
        headsign: service.headsign,
        scheduledArrival: prediction.scheduledArrival,
        providerArrival: prediction.providerArrival,
        predictedArrival: prediction.predictedArrival,
        displayArrival: prediction.predictedArrival,
        confidence: prediction.confidence,
        predictionSource: 'atlas',
      })
    }
    const best = predictions.sort((left, right) => Date.parse(left.displayArrival ?? '') - Date.parse(right.displayArrival ?? ''))[0]
    arrivals.push(best ?? scheduledStopArrival(stopId, service, now))
  }
  return arrivals
    .filter((arrival) => arrival.tripId)
    .sort((left, right) => Date.parse(left.displayArrival ?? left.scheduledArrival ?? '') - Date.parse(right.displayArrival ?? right.scheduledArrival ?? ''))
    .slice(0, 24)
}

function scheduledStopArrival(stopId: string, service: AtlasStopService, now: string): AtlasStopArrival {
  const scheduledArrival = service.scheduledArrivalSeconds === undefined ? undefined : serviceDayIso(now, service.scheduledArrivalSeconds)
  return {
    stopId,
    routeId: service.routeId,
    routeShortName: service.routeShortName,
    tripId: service.scheduledTripId ?? service.tripIds[0] ?? '',
    directionId: service.directionId,
    headsign: service.headsign,
    scheduledArrival,
    displayArrival: scheduledArrival,
    confidence: 'low',
    predictionSource: 'schedule',
  }
}

function serviceDayIso(now: string, seconds: number) {
  const date = new Date(now)
  date.setHours(0, 0, 0, 0)
  date.setSeconds(seconds)
  return date.toISOString()
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3
}

function incidentForTime(incident: AtlasIncidentFeature, timeContext: AtlasTimeContext): AtlasIncidentFeature | null {
  if (timeContext.mode === 'live') return incident.properties.status === 'resolved' ? null : incident
  const timestamp = Date.parse(timeContext.timestamp)
  const startedAt = Date.parse(incident.properties.startedAt)
  const endedAt = incident.properties.endedAt ? Date.parse(incident.properties.endedAt) : Number.POSITIVE_INFINITY
  if (!Number.isFinite(timestamp) || !Number.isFinite(startedAt) || timestamp < startedAt || timestamp > endedAt) return null
  return {
    ...incident,
    properties: {
      ...incident.properties,
      status: 'active',
    },
  }
}

function updateVehiclePositionHistory(
  previous: Map<string, AtlasVehiclePositionObservation[]>,
  vehicles: AtlasMovingAssetFeature[],
) {
  const next = new Map(previous)
  const now = Date.now()
  for (const vehicle of vehicles) {
    const id = vehicle.properties.id
    const observedAt = vehicle.properties.observedAt
    const observedMs = Date.parse(observedAt)
    if (!Number.isFinite(observedMs)) continue
    const [longitude, latitude] = vehicle.geometry.coordinates as [number, number]
    const existing = next.get(id) ?? []
    const latest = existing.at(-1)
    const duplicate = latest?.observedAt === observedAt
      || (latest?.longitude === longitude && latest?.latitude === latitude && Math.abs(Date.parse(latest.observedAt) - observedMs) < 1000)
    const retained = existing.filter((observation) => now - Date.parse(observation.observedAt) <= vehicleHistoryMs)
    if (!duplicate) retained.push({ vehicleId: id, longitude, latitude, observedAt })
    next.set(id, retained.slice(-maxVehicleHistoryPoints))
  }
  return next
}
