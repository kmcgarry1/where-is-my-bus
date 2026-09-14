import { computed, onUnmounted, ref, shallowRef, watch } from 'vue'
import type {
  AtlasMovingAssetCollection,
  AtlasMovingAssetFeature,
  AtlasTransitStopCollection,
  AtlasTransitStopFeature,
  AtlasTripContext,
  AtlasEtaPrediction,
  AtlasStopArrival,
  AtlasStopService,
  AtlasVehiclePositionObservation,
} from '../data/movingAsset.types'
import type { AtlasIncidentFeature } from '../data/incident.types'
import { transportRegions } from '../data/moving/transportFilters'
import { predictArrivalAtStop } from '../data/moving/etaPredictor'
import { assessDelay } from '../data/moving/delayAssessment'

export interface RouteResult {
  routeId: string
  shortName?: string
  longName?: string
  operator?: string
  headsigns: string[]
}
const emptyVehicles = (): AtlasMovingAssetCollection => ({
  type: 'FeatureCollection',
  features: [],
})
const emptyStops = (): AtlasTransitStopCollection => ({
  type: 'FeatureCollection',
  features: [],
})

async function request<T>(
  path: string,
  params = new URLSearchParams(),
  signal?: AbortSignal,
): Promise<T> {
  const timeout = AbortSignal.timeout(path === 'vehicles' && !params.has('stopId') || path === 'alerts' ? 20000 : 120000)
  let response: Response
  try {
    response = await fetch(`/api/providers/nta/${path}?${params}`, {
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    })
  } catch (cause) {
    if (signal?.aborted) throw cause
    throw new Error('Bus information is taking longer than expected. Please try again.')
  }
  if (!response.ok)
    throw new Error('Bus data could not be loaded. Please try again.')
  return response.json()
}

export function useTransit() {
  const selectedArea = ref('')
  const searchMode = ref<'stops' | 'routes' | 'live'>('stops')
  const query = ref('')
  const selectedRoute = shallowRef<RouteResult>()
  const selectedStop = shallowRef<AtlasTransitStopFeature>()
  const selectedVehicle = shallowRef<AtlasMovingAssetFeature>()
  const visibleVehicles = shallowRef(emptyVehicles())
  const visibleStops = shallowRef(emptyStops())
  const routeResults = shallowRef<RouteResult[]>([])
  const stopResults = shallowRef<AtlasTransitStopFeature[]>([])
  const arrivals = shallowRef<AtlasStopArrival[]>([])
  const eta = shallowRef<AtlasEtaPrediction>()
  const alerts = shallowRef<AtlasIncidentFeature[]>([])
  const loading = ref(false)
  const searching = ref(false)
  const detailLoading = ref(false)
  const error = ref('')
  const searchError = ref('')
  const detailError = ref('')
  const source = ref('')
  const now = ref(Date.now())
  const contexts = new Map<string, Promise<AtlasTripContext>>()
  const history = new Map<string, AtlasVehiclePositionObservation[]>()
  const loadedHistory = new Set<string>()
  let scopeVersion = 0
  let detailVersion = 0
  let searchController: AbortController | undefined
  let liveController: AbortController | undefined
  let stopsController: AbortController | undefined
  let searchTimer: ReturnType<typeof setTimeout> | undefined
  const area = computed(() =>
    transportRegions.find((item) => item.id === selectedArea.value),
  )
  const delayAssessment = computed(() =>
    selectedVehicle.value
      ? assessDelay(
          selectedVehicle.value,
          alerts.value,
          eta.value,
          now.value,
          selectedStop.value?.properties.stopId,
        )
      : undefined,
  )
  const trail = computed(() => {
    const points = history.get(selectedVehicle.value?.properties.id ?? '') ?? []
    return {
      type: 'FeatureCollection' as const,
      features:
        points.length > 1
          ? [
              {
                type: 'Feature' as const,
                properties: {},
                geometry: {
                  type: 'LineString' as const,
                  coordinates: points.map((point) => [
                    point.longitude,
                    point.latitude,
                  ]),
                },
              },
            ]
          : [],
    }
  })
  function areaParams() {
    const params = new URLSearchParams()
    const bounds = area.value
    if (bounds)
      params.set(
        'bounds',
        [bounds.west, bounds.south, bounds.east, bounds.north].join(','),
      )
    return params
  }
  async function loadMapStops(bounds?: string) {
    stopsController?.abort()
    if (!bounds || !selectedArea.value) {
      visibleStops.value = selectedStop.value
        ? { type: 'FeatureCollection', features: [selectedStop.value] }
        : emptyStops()
      return
    }
    const controller = new AbortController()
    stopsController = controller
    const values = bounds.split(',').map(Number)
    if (area.value) {
      values[0] = Math.max(values[0]!, area.value.west)
      values[1] = Math.max(values[1]!, area.value.south)
      values[2] = Math.min(values[2]!, area.value.east)
      values[3] = Math.min(values[3]!, area.value.north)
      if (values[0]! > values[2]! || values[1]! > values[3]!) {
        visibleStops.value = emptyStops()
        return
      }
    }
    try {
      const data = await request<{ collection: AtlasTransitStopCollection }>(
        'stops',
        new URLSearchParams({ bounds: values.join(','), limit: '200' }),
        controller.signal,
      )
      if (!controller.signal.aborted) visibleStops.value = data.collection
    } catch {
      if (!controller.signal.aborted)
        error.value = 'Map stops could not be loaded. Please try again.'
    }
  }
  function contextFor(vehicle: AtlasMovingAssetFeature) {
    const tripId = vehicle.properties.tripId
    if (!tripId) return Promise.resolve(undefined)
    if (!contexts.has(tripId)) {
      const promise = request<{ context: AtlasTripContext }>(
        'trip-context',
        new URLSearchParams({ tripId }),
      )
        .then((data) => data.context)
        .catch((cause) => {
          contexts.delete(tripId)
          throw cause
        })
      contexts.set(tripId, promise)
      if (contexts.size > 100) contexts.delete(contexts.keys().next().value!)
    }
    return contexts.get(tripId)!
  }
  function predict(
    vehicle: AtlasMovingAssetFeature,
    context?: AtlasTripContext,
  ) {
    return predictArrivalAtStop({
      vehicle,
      tripContext: context,
      targetStopId: selectedStop.value?.properties.stopId,
      recentPositions: history.get(vehicle.properties.id) ?? [],
      now: new Date().toISOString(),
    })
  }
  async function refreshDetails() {
    const version = ++detailVersion
    const vehicle = selectedVehicle.value
    const stop = selectedStop.value
    if (!vehicle && !stop) return
    detailLoading.value = true
    detailError.value = ''
    try {
      const params = new URLSearchParams()
      if (vehicle?.properties.routeId)
        params.append('routeId', vehicle.properties.routeId)
      if (vehicle?.properties.tripId)
        params.set('tripId', vehicle.properties.tripId)
      if (stop) params.set('stopId', stop.properties.stopId)
      if (vehicle) {
        const id = vehicle.properties.id
        if (!loadedHistory.has(id)) {
          try {
            const historyParams = new URLSearchParams({
              vehicleId: vehicle.properties.vehicleId ?? id,
              since: new Date(Date.now() - 300000).toISOString(),
              limit: '30',
            })
            const response = await fetch(
              `/api/transport/vehicle-observations?${historyParams}`,
              { signal: AbortSignal.timeout(5000) },
            )
            if (response.ok) {
              const data = (await response.json()) as {
                observations: AtlasVehiclePositionObservation[]
              }
              const points = [...data.observations, ...(history.get(id) ?? [])]
              history.set(
                id,
                [
                  ...new Map(
                    points.map((point) => [point.observedAt, point]),
                  ).values(),
                ]
                  .sort(
                    (a, b) =>
                      Date.parse(a.observedAt) - Date.parse(b.observedAt),
                  )
                  .slice(-30),
              )
              loadedHistory.add(id)
            }
          } catch {
            /* Current-session observations remain usable when history is unavailable. */
          }
        }
        const context = await contextFor(vehicle)
        if (version !== detailVersion) return
        eta.value = predict(vehicle, context)
      }
      if (stop) {
        const data = await request<{ services: AtlasStopService[] }>(
          'stop-services',
          new URLSearchParams({ stopId: stop.properties.stopId }),
        )
        if (version !== detailVersion) return
        data.services.forEach((service) =>
          params.append('routeId', service.routeId),
        )
        const tripServices = new Map(
          data.services.flatMap((service) =>
            service.tripIds.map((tripId) => [tripId, service] as const),
          ),
        )
        const candidates = visibleVehicles.value.features.filter((bus) =>
          tripServices.has(bus.properties.tripId ?? ''),
        ).sort((a, b) => {
          const distance = (bus: AtlasMovingAssetFeature) => {
            const longitudeScale = Math.cos(stop.geometry.coordinates[1]! * Math.PI / 180)
            return ((bus.geometry.coordinates[0]! - stop.geometry.coordinates[0]!) * longitudeScale) ** 2
              + (bus.geometry.coordinates[1]! - stop.geometry.coordinates[1]!) ** 2
          }
          return distance(a) - distance(b)
        })
        const next: AtlasStopArrival[] = []
        for (const bus of candidates) {
          let context: AtlasTripContext | undefined
          try {
            context = await contextFor(bus)
          } catch {
            if (version !== detailVersion) return
            detailError.value = 'Some arrival information is unavailable.'
            continue
          }
          if (version !== detailVersion) return
          const prediction = predict(bus, context)
          if (prediction.status !== 'available' || !prediction.predictedArrival)
            continue
          const service = tripServices.get(bus.properties.tripId!)!
          next.push({
            stopId: stop.properties.stopId,
            vehicleFeatureId: bus.properties.id,
            vehicleId: bus.properties.vehicleId,
            routeId: service.routeId,
            routeShortName: service.routeShortName,
            tripId: bus.properties.tripId!,
            headsign: service.headsign,
            displayArrival: prediction.predictedArrival,
            confidence: prediction.confidence,
            predictionSource:
              prediction.method === 'provider-trip-update'
                ? 'provider'
                : prediction.method === 'schedule-baseline'
                  ? 'schedule'
                  : 'atlas',
          })
          arrivals.value = [...next]
            .sort((a, b) => Date.parse(a.displayArrival!) - Date.parse(b.displayArrival!))
            .slice(0, 24)
        }
        arrivals.value = next
          .sort(
            (a, b) =>
              Date.parse(a.displayArrival!) - Date.parse(b.displayArrival!),
          )
          .slice(0, 24)
      }
      const alertData = await request<{
        collection: { features: AtlasIncidentFeature[] }
      }>('alerts', params)
      if (version === detailVersion)
        alerts.value = alertData.collection.features
    } catch (cause) {
      if (version === detailVersion)
        detailError.value =
          cause instanceof Error ? cause.message : 'Arrival data unavailable.'
    } finally {
      if (version === detailVersion) detailLoading.value = false
    }
  }
  async function refresh() {
    if (!selectedArea.value) return
    const version = scopeVersion
    liveController?.abort()
    liveController = new AbortController()
    loading.value = true
    error.value = ''
    try {
      const params = selectedStop.value
        ? new URLSearchParams({ stopId: selectedStop.value.properties.stopId })
        : areaParams()
      if (selectedRoute.value)
        params.set('routeId', selectedRoute.value.routeId)
      const data = await request<{
        collection: AtlasMovingAssetCollection
        source: string
      }>('vehicles', params, liveController.signal)
      if (version !== scopeVersion) return
      visibleVehicles.value = data.collection
      source.value = data.source
      const ids = new Set(
        data.collection.features.map((bus) => bus.properties.id),
      )
      for (const id of history.keys()) if (!ids.has(id)) history.delete(id)
      for (const bus of data.collection.features) {
        const points = history.get(bus.properties.id) ?? []
        if (points.at(-1)?.observedAt !== bus.properties.observedAt)
          history.set(
            bus.properties.id,
            [
              ...points,
              {
                vehicleId: bus.properties.vehicleId ?? bus.properties.id,
                longitude: bus.geometry.coordinates[0]!,
                latitude: bus.geometry.coordinates[1]!,
                observedAt: bus.properties.observedAt,
              },
            ].slice(-30),
          )
      }
      if (selectedVehicle.value) {
        selectedVehicle.value = data.collection.features.find(
          (bus) => bus.properties.id === selectedVehicle.value?.properties.id,
        )
        if (!selectedVehicle.value) {
          eta.value = undefined
          detailError.value = 'This bus is no longer in the current feed.'
        }
      }
      if (!detailLoading.value) void refreshDetails()
    } catch (cause) {
      if (
        version === scopeVersion &&
        !(cause instanceof DOMException && cause.name === 'AbortError')
      )
        error.value =
          cause instanceof Error ? cause.message : 'Bus data unavailable.'
    } finally {
      if (version === scopeVersion) loading.value = false
    }
  }
  function clearSelection() {
    detailVersion++
    selectedVehicle.value = undefined
    selectedStop.value = undefined
    selectedRoute.value = undefined
    arrivals.value = []
    eta.value = undefined
    alerts.value = []
    detailError.value = ''
    detailLoading.value = false
  }
  function changeScope() {
    scopeVersion++
    liveController?.abort()
    visibleVehicles.value = emptyVehicles()
    void refresh()
  }
  async function selectStop(stop: AtlasTransitStopFeature) {
    clearSelection()
    selectedStop.value = stop
    visibleStops.value = { type: 'FeatureCollection', features: [stop] }
    changeScope()
  }
  function selectRoute(route: RouteResult) {
    clearSelection()
    selectedRoute.value = route
    visibleStops.value = emptyStops()
    changeScope()
  }
  function selectVehicle(bus: AtlasMovingAssetFeature) {
    selectedVehicle.value = bus
    eta.value = undefined
    alerts.value = []
    void refreshDetails()
  }
  function reset() {
    clearSelection()
    visibleStops.value = emptyStops()
    changeScope()
  }
  watch(query, () => {
    if (selectedRoute.value || selectedStop.value || selectedVehicle.value)
      reset()
  })
  watch(selectedArea, () => {
    stopsController?.abort()
    query.value = ''
    clearSelection()
    visibleStops.value = emptyStops()
    changeScope()
  })
  watch([query, searchMode, selectedArea], () => {
    clearTimeout(searchTimer)
    searchController?.abort()
    routeResults.value = []
    stopResults.value = []
    searching.value = false
    searchError.value = ''
    if (
      !selectedArea.value ||
      searchMode.value === 'live' ||
      query.value.trim().length < (searchMode.value === 'routes' ? 1 : 2)
    )
      return
    searching.value = true
    const mode = searchMode.value
    const controller = new AbortController()
    searchController = controller
    searchTimer = setTimeout(async () => {
      try {
        const params = areaParams()
        params.set('q', query.value.trim())
        if (mode === 'stops') {
          const result = await request<{
            collection: AtlasTransitStopCollection
          }>('stops', params, controller.signal)
          if (!controller.signal.aborted)
            stopResults.value = result.collection.features
        } else {
          const result = await request<{ routes: RouteResult[] }>(
            'routes',
            params,
            controller.signal,
          )
          if (!controller.signal.aborted) routeResults.value = result.routes
        }
      } catch (cause) {
        if (!controller.signal.aborted)
          searchError.value =
            cause instanceof Error ? cause.message : 'Search unavailable.'
      } finally {
        if (!controller.signal.aborted) searching.value = false
      }
    }, 300)
  })
  const poll = setInterval(() => {
    if (!document.hidden && !loading.value) void refresh()
  }, 15000)
  const clock = setInterval(() => {
    now.value = Date.now()
  }, 1000)
  onUnmounted(() => {
    scopeVersion++
    detailVersion++
    clearInterval(poll)
    clearInterval(clock)
    clearTimeout(searchTimer)
    liveController?.abort()
    searchController?.abort()
    stopsController?.abort()
  })
  return {
    selectedArea,
    searchMode,
    query,
    selectedRoute,
    selectedStop,
    selectedVehicle,
    visibleVehicles,
    visibleStops,
    routeResults,
    stopResults,
    arrivals,
    eta,
    delayAssessment,
    trail,
    area,
    now,
    loading,
    searching,
    detailLoading,
    error,
    searchError,
    detailError,
    source,
    refresh,
    reset,
    selectStop,
    selectRoute,
    selectVehicle,
    loadMapStops,
  }
}
