<script setup lang="ts">
import mapboxgl, { type GeoJSONSource, type MapLayerMouseEvent } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { AtlasFeatureCollection, AtlasFilters, AtlasProviderId, AtlasSelection } from '../data/atlas.types'
import type { AtlasIncidentCollection, AtlasIncidentProviderId } from '../data/incident.types'
import type { AtlasEtaPrediction, AtlasMovingAssetCollection, AtlasMovingFilters, AtlasMovingProviderId, AtlasSpatialFilter, AtlasTransitStopCollection, AtlasVehicleTrailCollection } from '../data/movingAsset.types'
import type { AtlasTimeContext } from '../data/time.types'

const sourceIds: Record<AtlasProviderId, string> = {
  'opw-water': 'atlas-opw-water-gauges',
  'dublin-bikes': 'atlas-dublin-bike-stations',
  'dcc-sonitus': 'atlas-sonitus-monitors',
}

const layerIds = {
  'opw-water': ['opw-clusters', 'opw-cluster-count', 'opw-gauges'],
  'dublin-bikes': ['bike-clusters', 'bike-cluster-count', 'bike-stations'],
  'dcc-sonitus': ['sonitus-monitors'],
} satisfies Record<AtlasProviderId, string[]>

const incidentSourceIds: Record<AtlasIncidentProviderId, string> = {
  'epa-bathing-water': 'atlas-epa-bathing-incidents',
  'nta-gtfs-realtime': 'atlas-nta-service-alerts',
  'atlas-derived': 'atlas-derived-incidents',
}

const movingSourceIds: Record<AtlasMovingProviderId, string> = {
  'nta-gtfs-realtime': 'atlas-nta-vehicles',
}

const mapboxTrafficSourceId = 'mapbox-traffic'
const mapboxTrafficLayerIds = ['mapbox-road-traffic', 'mapbox-road-closures'] as const
const vehicleTrailSourceId = 'atlas-selected-vehicle-trail'
const selectedRouteSourceId = 'atlas-selected-route'
const selectedRouteStopsSourceId = 'atlas-selected-route-stops'
const etaRemainingRouteSourceId = 'atlas-selected-eta-route'
const etaNextStopSourceId = 'atlas-selected-eta-next-stop'
const vehicleArrowImageId = 'atlas-vehicle-direction-arrow'
const transitStopsSourceId = 'atlas-nta-stops'

const props = defineProps<{
  filters: AtlasFilters
  collections: Record<AtlasProviderId, AtlasFeatureCollection>
  displayMode: 'health' | 'measurement'
  incidentCollections: Record<AtlasIncidentProviderId, AtlasIncidentCollection>
  movingCollections: Record<AtlasMovingProviderId, AtlasMovingAssetCollection>
  movingFilters: AtlasMovingFilters
  roadTrafficVisible: boolean
  selected: AtlasSelection | null
  selectedEtaPrediction: AtlasEtaPrediction | null
  selectedVehicleTrail: AtlasVehicleTrailCollection
  timeContext: AtlasTimeContext
  transitStops: AtlasTransitStopCollection
  transitStopsVisible: boolean
  transportRouteIds: string[]
  transportSpatialFilter?: AtlasSpatialFilter
  transitDensityVisible: boolean
}>()

const emit = defineEmits<{
  select: [selection: AtlasSelection]
  viewportBounds: [bounds: { west: number; south: number; east: number; north: number }]
}>()

const mapElement = ref<HTMLDivElement | null>(null)
const mapReady = ref(false)
const mapboxAccessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim() ?? ''
let map: mapboxgl.Map | null = null
let resizeObserver: ResizeObserver | null = null
let hovered: { source: string; id: string | number } | null = null

const hasMapboxToken = computed(() => Boolean(mapboxAccessToken))

onMounted(() => {
  if (mapboxAccessToken) mapboxgl.accessToken = mapboxAccessToken

  map = new mapboxgl.Map({
    container: mapElement.value as HTMLDivElement,
    center: [-6.2603, 53.3498],
    zoom: 11.15,
    minZoom: 6,
    maxZoom: 17,
    attributionControl: false,
    accessToken: mapboxAccessToken || undefined,
    testMode: !mapboxAccessToken,
    style: mapboxAccessToken ? 'mapbox://styles/mapbox/dark-v11' : fallbackMapStyle(),
  })
  ;(window as typeof window & { __atlasopsMap?: mapboxgl.Map }).__atlasopsMap = map

  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')
  map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left')
  resizeObserver = new ResizeObserver(() => map?.resize())
  resizeObserver.observe(mapElement.value as HTMLDivElement)

  void nextTick(() => {
    map?.resize()
    window.setTimeout(() => map?.resize(), 100)
  })

  map.on('load', () => {
    map?.resize()
    addSourcesAndLayers()
    bindInteractions()
    mapReady.value = true
    updateSources()
    updateIncidentSources()
    updateMovingSources()
    updateTransitStopSource()
    updateEtaPredictionSources()
    updateSelectedVehicleTrail()
    updateFilters()
    updateMovingFilters()
    updateRoadTrafficVisibility()
    updateTransitDensityVisibility()
    updateSelectionState(null, props.selected)
    emitViewportBounds()
  })
  map.on('moveend', emitViewportBounds)
  map.on('zoomend', emitViewportBounds)
})

onBeforeUnmount(() => {
  delete (window as typeof window & { __atlasopsMap?: mapboxgl.Map }).__atlasopsMap
  resizeObserver?.disconnect()
  map?.getCanvas().removeEventListener('click', selectRenderedStopFromCanvas)
  map?.remove()
  map = null
  resizeObserver = null
})

watch(() => props.collections, updateSources, { deep: true })
watch(() => props.incidentCollections, updateIncidentSources, { deep: true })
watch(() => props.movingCollections, updateMovingSources, { deep: true })
watch(() => props.transitStops, updateTransitStopSource, { deep: true })
watch(() => props.selectedEtaPrediction, updateEtaPredictionSources, { deep: true })
watch(() => props.selectedVehicleTrail, updateSelectedVehicleTrail, { deep: true })
watch(() => props.filters, updateFilters, { deep: true })
watch(() => props.movingFilters, updateMovingFilters, { deep: true })
watch(() => props.transportRouteIds, () => {
  updateMovingFilters()
  focusTransportRoute()
}, { deep: true })
watch(() => props.transportSpatialFilter, focusSpatialFilter, { deep: true })
watch(() => props.displayMode, updateDisplayMode)
watch(() => props.roadTrafficVisible, updateRoadTrafficVisibility)
watch(() => props.transitDensityVisible, updateTransitDensityVisibility)
watch(() => props.transitStopsVisible, updateTransitStopsVisibility)
watch(() => props.timeContext.mode, updateTimeMode)
watch(() => props.selected, (current, previous) => {
  updateSelectionState(previous, current)
  updateIncidentSources()
  focusSelection(current)
})

function addSourcesAndLayers() {
  if (!map) return

  map.addSource(sourceIds['opw-water'], {
    type: 'geojson',
    data: emptyCollection(),
    promoteId: 'id',
    cluster: true,
    clusterRadius: 44,
    clusterMaxZoom: 10,
  })
  map.addSource(sourceIds['dublin-bikes'], {
    type: 'geojson',
    data: emptyCollection(),
    promoteId: 'id',
    cluster: true,
    clusterRadius: 48,
    clusterMaxZoom: 13,
  })
  map.addSource(sourceIds['dcc-sonitus'], {
    type: 'geojson',
    data: emptyCollection(),
    promoteId: 'id',
  })
  for (const sourceId of Object.values(incidentSourceIds)) {
    map.addSource(sourceId, {
      type: 'geojson',
      data: emptyIncidentCollection(),
      promoteId: 'id',
    })
  }
  for (const sourceId of Object.values(movingSourceIds)) {
    map.addSource(sourceId, {
      type: 'geojson',
      data: emptyMovingCollection(),
      promoteId: 'id',
    })
  }
  map.addSource(vehicleTrailSourceId, {
    type: 'geojson',
    data: emptyTrailCollection(),
  })
  map.addSource(selectedRouteSourceId, {
    type: 'geojson',
    data: emptySelectedRouteCollection(),
  })
  map.addSource(selectedRouteStopsSourceId, {
    type: 'geojson',
    data: emptyTransitStopCollection(),
    promoteId: 'id',
  })
  map.addSource(etaRemainingRouteSourceId, {
    type: 'geojson',
    data: emptyEtaRouteCollection(),
  })
  map.addSource(etaNextStopSourceId, {
    type: 'geojson',
    data: emptyTransitStopCollection(),
    promoteId: 'id',
  })
  map.addSource(transitStopsSourceId, {
    type: 'geojson',
    data: emptyTransitStopCollection(),
    promoteId: 'id',
  })
  addMapboxTrafficLayers()
  addVehicleArrowImage()

  addClusterLayers('opw', sourceIds['opw-water'], '#3da5d9')
  map.addLayer({
    id: 'opw-gauges',
    type: 'circle',
    source: sourceIds['opw-water'],
    filter: unclusteredFilter(),
    paint: {
      'circle-color': statusColorExpression(),
      'circle-radius': ['case', ['boolean', ['feature-state', 'selected'], false], 10, ['boolean', ['feature-state', 'hover'], false], 8, 6],
      'circle-stroke-color': ['case', ['boolean', ['get', 'stale'], false], '#6c757d', '#c8e7ff'],
      'circle-stroke-width': ['case', ['boolean', ['feature-state', 'selected'], false], 4, 2],
      'circle-opacity': ['case', ['==', ['get', 'status'], 'offline'], 0.55, 0.94],
    },
  })

  addClusterLayers('bike', sourceIds['dublin-bikes'], '#83d4c8')
  map.addLayer({
    id: 'bike-stations',
    type: 'circle',
    source: sourceIds['dublin-bikes'],
    filter: unclusteredFilter(),
    paint: {
      'circle-color': statusColorExpression(),
      'circle-radius': ['case', ['boolean', ['feature-state', 'selected'], false], 11, ['boolean', ['feature-state', 'hover'], false], 9, ['interpolate', ['linear'], ['coalesce', ['get', 'value'], 0], 0, 5, 20, 8, 40, 11]],
      'circle-stroke-color': '#f5f1e8',
      'circle-stroke-width': ['case', ['boolean', ['feature-state', 'selected'], false], 4, 1.8],
      'circle-opacity': 0.94,
    },
  })
  map.addLayer({
    id: 'sonitus-monitors',
    type: 'circle',
    source: sourceIds['dcc-sonitus'],
    filter: unclusteredFilter(),
    paint: {
      'circle-color': [
        'case',
        ['==', ['literal', props.displayMode], 'health'],
        statusColorExpression(),
        ['==', ['get', 'assetType'], 'noise-monitor'],
        '#b8a1ff',
        '#83d4c8',
      ],
      'circle-radius': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        12,
        ['boolean', ['feature-state', 'hover'], false],
        10,
        ['==', ['literal', props.displayMode], 'health'],
        7,
        ['interpolate', ['linear'], ['coalesce', ['get', 'value'], 0], 0, 6, 45, 8, 70, 12],
      ],
      'circle-stroke-color': statusColorExpression(),
      'circle-stroke-width': ['case', ['boolean', ['feature-state', 'selected'], false], 4, 2],
      'circle-opacity': ['case', ['==', ['get', 'status'], 'offline'], 0.5, 0.94],
    },
  })
  map.addLayer({
    id: 'incident-points',
    type: 'circle',
    source: incidentSourceIds['epa-bathing-water'],
    filter: ['==', ['geometry-type'], 'Point'],
    paint: {
      'circle-color': severityColorExpression(),
      'circle-radius': [
        'case',
        ['boolean', ['get', 'selected'], false],
        15,
        10,
      ],
      'circle-stroke-color': '#f5f1e8',
      'circle-stroke-width': ['case', ['boolean', ['get', 'selected'], false], 4, 2],
      'circle-opacity': props.timeContext.mode === 'replay' ? 0.72 : 0.92,
    },
  })
  map.addLayer({
    id: 'incident-labels',
    type: 'symbol',
    source: incidentSourceIds['epa-bathing-water'],
    minzoom: 10,
    layout: {
      'text-field': ['get', 'title'],
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 10, 10, 14, 12],
      'text-offset': [0, 1.25],
      'text-anchor': 'top',
    },
    paint: {
      'text-color': '#f5f1e8',
      'text-halo-color': '#101820',
      'text-halo-width': 1.2,
    },
  })

  map.addLayer({
    id: 'derived-incident-points',
    type: 'circle',
    source: incidentSourceIds['atlas-derived'],
    filter: ['==', ['geometry-type'], 'Point'],
    paint: {
      'circle-color': severityColorExpression(),
      'circle-radius': ['case', ['boolean', ['get', 'selected'], false], 11, 6],
      'circle-stroke-color': '#101820',
      'circle-stroke-width': ['case', ['boolean', ['get', 'selected'], false], 4, 2],
      'circle-opacity': 0.82,
    },
  })
  map.addLayer({
    id: 'transport-alert-points',
    type: 'circle',
    source: incidentSourceIds['nta-gtfs-realtime'],
    filter: ['==', ['geometry-type'], 'Point'],
    paint: {
      'circle-color': severityColorExpression(),
      'circle-radius': ['case', ['boolean', ['get', 'selected'], false], 13, 8],
      'circle-stroke-color': '#101820',
      'circle-stroke-width': ['case', ['boolean', ['get', 'selected'], false], 4, 2],
      'circle-opacity': 0.86,
    },
  })
  map.addLayer({
    id: 'nta-transit-density',
    type: 'heatmap',
    source: movingSourceIds['nta-gtfs-realtime'],
    maxzoom: 15,
    paint: {
      'heatmap-weight': [
        'match',
        ['get', 'assetType'],
        'bus',
        1,
        'tram',
        1.25,
        'rail',
        1.1,
        0.75,
      ],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 8, 0.7, 11, 1.15, 14, 1.8],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 8, 18, 11, 30, 14, 48],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        'rgba(61, 165, 217, 0)',
        0.2,
        'rgba(61, 165, 217, 0.34)',
        0.45,
        'rgba(131, 212, 200, 0.54)',
        0.7,
        'rgba(246, 189, 96, 0.68)',
        1,
        'rgba(249, 87, 56, 0.82)',
      ],
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.46, 12, 0.66, 15, 0.24],
    },
  })
  map.addLayer({
    id: 'nta-stop-halos',
    type: 'circle',
    source: transitStopsSourceId,
    minzoom: 11.6,
    paint: {
      'circle-color': '#071318',
      'circle-radius': ['case', ['boolean', ['feature-state', 'selected'], false], 7, ['boolean', ['feature-state', 'hover'], false], 6, 4],
      'circle-stroke-color': ['case', ['boolean', ['feature-state', 'selected'], false], '#f6bd60', '#83d4c8'],
      'circle-stroke-width': ['case', ['boolean', ['feature-state', 'selected'], false], 2.4, 1.4],
      'circle-opacity': ['interpolate', ['linear'], ['zoom'], 11.6, 0.34, 13, 0.72, 15, 0.9],
    },
  })
  map.addLayer({
    id: 'nta-stop-icons',
    type: 'symbol',
    source: transitStopsSourceId,
    minzoom: 12.2,
    layout: {
      'text-field': 'B',
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 12, 7, 15, 9],
      'text-allow-overlap': false,
      'text-ignore-placement': false,
    },
    paint: {
      'text-color': '#83d4c8',
      'text-halo-color': '#071318',
      'text-halo-width': 1,
      'text-opacity': ['interpolate', ['linear'], ['zoom'], 12.2, 0.58, 14, 0.88],
    },
  })
  map.addLayer({
    id: 'selected-route-casing',
    type: 'line',
    source: selectedRouteSourceId,
    paint: {
      'line-color': '#071318',
      'line-width': ['interpolate', ['linear'], ['zoom'], 9, 4, 13, 7, 17, 11],
      'line-opacity': 0.76,
    },
  })
  map.addLayer({
    id: 'selected-route-line',
    type: 'line',
    source: selectedRouteSourceId,
    paint: {
      'line-color': '#3da5d9',
      'line-width': ['interpolate', ['linear'], ['zoom'], 9, 2, 13, 4, 17, 6],
      'line-opacity': 0.72,
    },
  })
  map.addLayer({
    id: 'selected-route-direction',
    type: 'symbol',
    source: selectedRouteSourceId,
    minzoom: 11,
    layout: {
      'symbol-placement': 'line',
      'symbol-spacing': ['interpolate', ['linear'], ['zoom'], 11, 110, 15, 170],
      'text-field': '>',
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 11, 11, 15, 15],
      'text-rotation-alignment': 'map',
      'text-keep-upright': false,
    },
    paint: {
      'text-color': '#f5f1e8',
      'text-halo-color': '#071318',
      'text-halo-width': 1.6,
      'text-opacity': 0.78,
    },
  })
  map.addLayer({
    id: 'selected-route-stops',
    type: 'circle',
    source: selectedRouteStopsSourceId,
    minzoom: 10.4,
    paint: {
      'circle-color': ['case', ['==', ['get', 'routeStopRole'], 'next-stop'], '#f6bd60', '#101820'],
      'circle-radius': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        10,
        ['==', ['get', 'routeStopRole'], 'next-stop'],
        8,
        ['boolean', ['feature-state', 'hover'], false],
        6,
        4,
      ],
      'circle-stroke-color': ['case', ['boolean', ['feature-state', 'selected'], false], '#f5f1e8', ['==', ['get', 'routeStopRole'], 'next-stop'], '#101820', '#83d4c8'],
      'circle-stroke-width': ['case', ['boolean', ['feature-state', 'selected'], false], 3, ['==', ['get', 'routeStopRole'], 'next-stop'], 2.5, 1.3],
      'circle-opacity': 0.92,
    },
  })
  map.addLayer({
    id: 'selected-route-stop-labels',
    type: 'symbol',
    source: selectedRouteStopsSourceId,
    minzoom: 13.5,
    layout: {
      'text-field': ['case', ['==', ['get', 'routeStopRole'], 'next-stop'], ['coalesce', ['get', 'name'], 'Next stop'], ''],
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Regular'],
      'text-size': 11,
      'text-offset': [0, 1.15],
      'text-anchor': 'top',
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#f5f1e8',
      'text-halo-color': '#101820',
      'text-halo-width': 1.2,
    },
  })
  map.addLayer({
    id: 'selected-eta-route',
    type: 'line',
    source: etaRemainingRouteSourceId,
    paint: {
      'line-color': '#f6bd60',
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3, 14, 5, 17, 7],
      'line-opacity': 0.86,
      'line-dasharray': [0.6, 0.35],
    },
  })
  map.addLayer({
    id: 'selected-eta-next-stop',
    type: 'circle',
    source: etaNextStopSourceId,
    paint: {
      'circle-color': '#f6bd60',
      'circle-radius': ['case', ['boolean', ['feature-state', 'selected'], false], 11, 9],
      'circle-stroke-color': '#071318',
      'circle-stroke-width': 3,
      'circle-opacity': 0.96,
    },
  })
  map.addLayer({
    id: 'selected-eta-next-stop-label',
    type: 'symbol',
    source: etaNextStopSourceId,
    minzoom: 11,
    layout: {
      'text-field': ['coalesce', ['get', 'name'], 'Next stop'],
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Regular'],
      'text-size': 11,
      'text-offset': [0, 1.35],
      'text-anchor': 'top',
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#f5f1e8',
      'text-halo-color': '#101820',
      'text-halo-width': 1.2,
    },
  })
  map.addLayer({
    id: 'selected-vehicle-trail',
    type: 'line',
    source: vehicleTrailSourceId,
    paint: {
      'line-color': '#f6bd60',
      'line-width': 3,
      'line-opacity': 0.74,
    },
  })
  map.addLayer({
    id: 'nta-vehicle-halos',
    type: 'circle',
    source: movingSourceIds['nta-gtfs-realtime'],
    paint: {
      'circle-color': ['match', ['get', 'assetType'], 'bus', '#3da5d9', 'tram', '#b8a1ff', 'rail', '#83d4c8', '#f5f1e8'],
      'circle-radius': ['case', ['boolean', ['feature-state', 'selected'], false], 12, ['boolean', ['feature-state', 'hover'], false], 10, 7],
      'circle-stroke-color': '#101820',
      'circle-stroke-width': ['case', ['boolean', ['feature-state', 'selected'], false], 3, 1.4],
      'circle-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 0.84, ['boolean', ['feature-state', 'hover'], false], 0.72, 0.46],
    },
  })
  map.addLayer({
    id: 'nta-vehicles',
    type: 'symbol',
    source: movingSourceIds['nta-gtfs-realtime'],
    layout: {
      'icon-image': vehicleArrowImageId,
      'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.44, 12, 0.58, 15, 0.78, 17, 0.96],
      'icon-rotate': ['coalesce', ['get', 'bearing'], 0],
      'icon-rotation-alignment': 'map',
      'icon-pitch-alignment': 'map',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
    paint: {
      'icon-color': scheduleColorExpression(),
      'icon-halo-color': '#101820',
      'icon-halo-width': ['case', ['boolean', ['feature-state', 'selected'], false], 2.6, ['boolean', ['feature-state', 'hover'], false], 2.2, 1.4],
      'icon-opacity': ['case', ['==', ['get', 'status'], 'offline'], 0.52, 0.96],
    },
  })
  map.addLayer({
    id: 'nta-vehicle-labels',
    type: 'symbol',
    source: movingSourceIds['nta-gtfs-realtime'],
    minzoom: 11,
    layout: {
      'text-field': ['coalesce', ['get', 'routeLabel'], ''],
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Regular'],
      'text-size': 11,
      'text-offset': [0, 1.15],
      'text-anchor': 'top',
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#f5f1e8',
      'text-halo-color': '#101820',
      'text-halo-width': 1.2,
    },
  })
}

function addClusterLayers(prefix: 'opw' | 'bike', source: string, color: string) {
  if (!map) return
  map.addLayer({
    id: `${prefix}-clusters`,
    type: 'circle',
    source,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': color,
      'circle-radius': ['step', ['get', 'point_count'], 15, 25, 21, 100, 28],
      'circle-opacity': 0.82,
      'circle-stroke-color': '#f5f1e8',
      'circle-stroke-width': 2,
    },
  })
  map.addLayer({
    id: `${prefix}-cluster-count`,
    type: 'symbol',
    source,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
      'text-size': 12,
    },
    paint: { 'text-color': '#101820' },
  })
}

function addVehicleArrowImage() {
  if (!map || map.hasImage(vehicleArrowImageId)) return
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) return

  context.clearRect(0, 0, size, size)
  context.fillStyle = '#000000'
  context.beginPath()
  context.moveTo(size / 2, 6)
  context.lineTo(54, 52)
  context.lineTo(size / 2, 42)
  context.lineTo(10, 52)
  context.closePath()
  context.fill()

  map.addImage(vehicleArrowImageId, context.getImageData(0, 0, size, size), {
    pixelRatio: 2,
    sdf: true,
  })
}

function addMapboxTrafficLayers() {
  if (!map || !mapboxAccessToken || map.getSource(mapboxTrafficSourceId)) return
  map.addSource(mapboxTrafficSourceId, {
    type: 'vector',
    url: 'mapbox://mapbox.mapbox-traffic-v1',
  })
  map.addLayer({
    id: 'mapbox-road-traffic',
    type: 'line',
    source: mapboxTrafficSourceId,
    'source-layer': 'traffic',
    filter: [
      'all',
      ['in', ['get', 'class'], ['literal', ['motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link', 'secondary', 'tertiary', 'link', 'street']]],
      ['!', ['==', ['get', 'closed'], 'yes']],
      ['in', ['get', 'congestion'], ['literal', ['moderate', 'heavy', 'severe']]],
    ],
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': [
        'match',
        ['get', 'congestion'],
        'moderate',
        '#f6bd60',
        'heavy',
        '#ef8354',
        'severe',
        '#f95738',
        '#6c757d',
      ],
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        8,
        ['match', ['get', 'congestion'], 'low', 0.6, 'moderate', 0.8, 'heavy', 1, 'severe', 1.2, 0.65],
        11,
        ['match', ['get', 'congestion'], 'low', 1.2, 'moderate', 1.6, 'heavy', 2, 'severe', 2.35, 1.3],
        14,
        ['match', ['get', 'congestion'], 'low', 2.85, 'moderate', 3.8, 'heavy', 4.7, 'severe', 5.55, 3],
        17,
        ['match', ['get', 'congestion'], 'low', 4.5, 'moderate', 6, 'heavy', 7.45, 'severe', 8.75, 4.8],
      ],
      'line-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        8,
        ['match', ['get', 'congestion'], 'low', 0.3, 'moderate', 0.38, 'heavy', 0.44, 'severe', 0.48, 0.28],
        11,
        ['match', ['get', 'congestion'], 'low', 0.46, 'moderate', 0.55, 'heavy', 0.64, 'severe', 0.7, 0.44],
        14,
        ['match', ['get', 'congestion'], 'low', 0.62, 'moderate', 0.72, 'heavy', 0.82, 'severe', 0.88, 0.56],
      ],
      'line-offset': ['interpolate', ['linear'], ['zoom'], 9, 0.6, 13, 1.4, 17, 2.8],
    },
  })
  map.addLayer({
    id: 'mapbox-road-closures',
    type: 'line',
    source: mapboxTrafficSourceId,
    'source-layer': 'traffic',
    filter: ['==', ['get', 'closed'], 'yes'],
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': '#f95738',
      'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.4, 13, 3.2, 17, 6.4],
      'line-opacity': 0.94,
      'line-dasharray': [1.2, 0.8],
      'line-offset': ['interpolate', ['linear'], ['zoom'], 9, 0.8, 13, 1.8, 17, 3.2],
    },
  })
}

function bindInteractions() {
  if (!map) return

  bindFeatureLayer('opw-gauges', 'opw-water')
  bindFeatureLayer('bike-stations', 'dublin-bikes')
  bindFeatureLayer('sonitus-monitors', 'dcc-sonitus')
  bindIncidentLayer('incident-points', 'epa-bathing-water')
  bindIncidentLayer('derived-incident-points', 'atlas-derived')
  bindIncidentLayer('transport-alert-points', 'nta-gtfs-realtime')
  bindTransitStopLayer('nta-stop-halos')
  bindTransitStopLayer('nta-stop-icons')
  bindTransitStopLayer('selected-route-stops', selectedRouteStopsSourceId)
  bindTransitStopLayer('selected-eta-next-stop', etaNextStopSourceId)
  bindMovingLayer('nta-vehicles', 'nta-gtfs-realtime')
  bindClusterLayer('opw-clusters', sourceIds['opw-water'])
  bindClusterLayer('bike-clusters', sourceIds['dublin-bikes'])
  map.on('click', selectRenderedStopAtPoint)
  map.getCanvas().addEventListener('click', selectRenderedStopFromCanvas)
}

function bindMovingLayer(layer: string, provider: AtlasMovingProviderId) {
  if (!map) return
  const source = movingSourceIds[provider]
  map.on('mousemove', layer, (event) => setHover(source, event))
  map.on('mouseleave', layer, () => clearHover())
  map.on('click', layer, (event) => {
    const featureId = event.features?.[0]?.properties?.id
    if (featureId) emit('select', { kind: 'moving', provider, featureId })
  })
}

function bindTransitStopLayer(layer: string, sourceId = transitStopsSourceId) {
  if (!map) return
  map.on('mousemove', layer, (event) => setHover(sourceId, event))
  map.on('mouseleave', layer, () => clearHover())
  map.on('click', layer, (event) => {
    const featureId = event.features?.[0]?.properties?.id
    if (featureId) emit('select', { kind: 'transit-stop', provider: 'nta-gtfs-realtime', featureId })
  })
}

function selectRenderedStopAtPoint(event: mapboxgl.MapMouseEvent) {
  if (!map) return
  const feature = map.queryRenderedFeatures(event.point, {
    layers: ['selected-eta-next-stop', 'selected-route-stops', 'nta-stop-icons', 'nta-stop-halos'],
  }).find((feature) => typeof feature.properties?.id === 'string')
  const featureId = feature?.properties?.id
  if (featureId) emit('select', { kind: 'transit-stop', provider: 'nta-gtfs-realtime', featureId })
}

function selectRenderedStopFromCanvas(event: MouseEvent) {
  if (!map) return
  const rect = map.getCanvas().getBoundingClientRect()
  const point: [number, number] = [event.clientX - rect.left, event.clientY - rect.top]
  const feature = map.queryRenderedFeatures(point, {
    layers: ['selected-eta-next-stop', 'selected-route-stops', 'nta-stop-icons', 'nta-stop-halos'],
  }).find((feature) => typeof feature.properties?.id === 'string')
  const featureId = feature?.properties?.id
  if (featureId) emit('select', { kind: 'transit-stop', provider: 'nta-gtfs-realtime', featureId })
}

function bindIncidentLayer(layer: string, provider: AtlasIncidentProviderId) {
  if (!map) return
  map.on('mousemove', layer, () => {
    if (map) map.getCanvas().style.cursor = 'pointer'
  })
  map.on('mouseleave', layer, () => {
    if (map) map.getCanvas().style.cursor = ''
  })
  map.on('click', layer, (event) => {
    const featureId = event.features?.[0]?.properties?.id
    if (featureId) emit('select', { kind: 'incident', provider, featureId })
  })
}

function bindFeatureLayer(layer: string, provider: AtlasProviderId) {
  if (!map) return
  const source = sourceIds[provider]
  map.on('mousemove', layer, (event) => setHover(source, event))
  map.on('mouseleave', layer, () => clearHover())
  map.on('click', layer, (event) => {
    const featureId = event.features?.[0]?.properties?.id
    if (featureId) emit('select', { kind: 'asset', provider, featureId })
  })
}

function bindClusterLayer(layer: string, sourceId: string) {
  if (!map) return
  map.on('click', layer, (event) => {
    const feature = event.features?.[0]
    const clusterId = feature?.properties?.cluster_id as number | undefined
    const center = (feature?.geometry as GeoJSON.Point | undefined)?.coordinates as [number, number] | undefined
    if (clusterId === undefined || !center) return
    const source = map?.getSource(sourceId) as GeoJSONSource | undefined
    source?.getClusterExpansionZoom(clusterId, (error, zoom) => {
      if (error || !map || typeof zoom !== 'number') return
      map.easeTo({ center, zoom })
    })
  })
}

function updateSources() {
  if (!mapReady.value || !map) return
  for (const provider of Object.keys(sourceIds) as AtlasProviderId[]) {
    const source = map.getSource(sourceIds[provider]) as GeoJSONSource | undefined
    source?.setData(props.collections[provider] ?? emptyCollection())
  }
}

function updateIncidentSources() {
  if (!mapReady.value || !map) return
  for (const provider of Object.keys(incidentSourceIds) as AtlasIncidentProviderId[]) {
    const source = map.getSource(incidentSourceIds[provider]) as GeoJSONSource | undefined
    const collection = props.incidentCollections[provider] ?? emptyIncidentCollection()
    source?.setData({
      ...collection,
      features: collection.features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          selected: props.selected?.kind === 'incident' && props.selected.featureId === feature.properties.id,
        },
      })),
    })
  }
}

function updateMovingSources() {
  if (!mapReady.value || !map) return
  for (const provider of Object.keys(movingSourceIds) as AtlasMovingProviderId[]) {
    const source = map.getSource(movingSourceIds[provider]) as GeoJSONSource | undefined
    source?.setData(props.movingCollections[provider] ?? emptyMovingCollection())
  }
}

function updateTransitStopSource() {
  if (!mapReady.value || !map) return
  const source = map.getSource(transitStopsSourceId) as GeoJSONSource | undefined
  source?.setData(props.transitStops ?? emptyTransitStopCollection())
}

function updateEtaPredictionSources() {
  if (!mapReady.value || !map) return
  const selectedRouteSource = map.getSource(selectedRouteSourceId) as GeoJSONSource | undefined
  selectedRouteSource?.setData(props.selectedEtaPrediction?.routeFeature ? {
    type: 'FeatureCollection',
    features: [props.selectedEtaPrediction.routeFeature],
  } : emptySelectedRouteCollection())

  const selectedRouteStopsSource = map.getSource(selectedRouteStopsSourceId) as GeoJSONSource | undefined
  selectedRouteStopsSource?.setData(props.selectedEtaPrediction?.routeStops ?? emptyTransitStopCollection())

  const routeSource = map.getSource(etaRemainingRouteSourceId) as GeoJSONSource | undefined
  routeSource?.setData(props.selectedEtaPrediction?.remainingRoute ? {
    type: 'FeatureCollection',
    features: [props.selectedEtaPrediction.remainingRoute],
  } : emptyEtaRouteCollection())

  const stopSource = map.getSource(etaNextStopSourceId) as GeoJSONSource | undefined
  stopSource?.setData(props.selectedEtaPrediction?.nextStopFeature ? {
    type: 'FeatureCollection',
    features: [props.selectedEtaPrediction.nextStopFeature],
  } : emptyTransitStopCollection())
}

function updateSelectedVehicleTrail() {
  if (!mapReady.value || !map) return
  const source = map.getSource(vehicleTrailSourceId) as GeoJSONSource | undefined
  source?.setData(props.selectedVehicleTrail ?? emptyTrailCollection())
}

function updateFilters() {
  if (!mapReady.value || !map) return
  for (const provider of Object.keys(layerIds) as AtlasProviderId[]) {
    const isProviderEnabled = props.filters.providers.includes(provider)
    for (const layer of layerIds[provider]) {
      if (!map.getLayer(layer)) continue
      map.setLayoutProperty(layer, 'visibility', isProviderEnabled ? 'visible' : 'none')
    }
  }

  const filter = allFilter([
    ['in', ['get', 'assetType'], ['literal', props.filters.assetTypes]],
    ['in', ['get', 'status'], ['literal', props.filters.statuses]],
    ['!', ['has', 'point_count']],
  ])
  map.setFilter('opw-gauges', filter)
  map.setFilter('bike-stations', filter)
  map.setFilter('sonitus-monitors', filter)
}

function updateMovingFilters() {
  if (!mapReady.value || !map) return
  const isProviderEnabled = props.movingFilters.providers.includes('nta-gtfs-realtime')
  const filter = allFilter([
    ['in', ['get', 'assetType'], ['literal', props.movingFilters.assetTypes]],
    ['in', ['get', 'status'], ['literal', props.movingFilters.statuses]],
    props.transportRouteIds.length
      ? ['in', ['get', 'routeId'], ['literal', props.transportRouteIds]]
      : true,
  ])
  for (const layer of ['nta-transit-density', 'nta-vehicle-halos', 'nta-vehicles', 'nta-vehicle-labels']) {
    if (!map.getLayer(layer)) continue
    const isLayerVisible = layer === 'nta-transit-density'
      ? isProviderEnabled && props.transitDensityVisible
      : isProviderEnabled
    map.setLayoutProperty(layer, 'visibility', isLayerVisible ? 'visible' : 'none')
    map.setFilter(layer, filter)
  }
}

function emitViewportBounds() {
  if (!map) return
  const bounds = map.getBounds()
  if (!bounds) return
  emit('viewportBounds', {
    west: bounds.getWest(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    north: bounds.getNorth(),
  })
}

function updateTransitDensityVisibility() {
  if (!mapReady.value || !map?.getLayer('nta-transit-density')) return
  const isProviderEnabled = props.movingFilters.providers.includes('nta-gtfs-realtime')
  map.setLayoutProperty('nta-transit-density', 'visibility', isProviderEnabled && props.transitDensityVisible ? 'visible' : 'none')
}

function updateRoadTrafficVisibility() {
  if (!mapReady.value || !map) return
  const visibility = props.roadTrafficVisible && mapboxAccessToken && props.timeContext.mode === 'live' ? 'visible' : 'none'
  for (const layer of mapboxTrafficLayerIds) {
    if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', visibility)
  }
}

function updateDisplayMode() {
  if (!mapReady.value || !map?.getLayer('sonitus-monitors')) return
  map.setPaintProperty('sonitus-monitors', 'circle-color', [
    'case',
    ['==', ['literal', props.displayMode], 'health'],
    statusColorExpression(),
    ['==', ['get', 'assetType'], 'noise-monitor'],
    '#b8a1ff',
    '#83d4c8',
  ])
  map.setPaintProperty('sonitus-monitors', 'circle-radius', [
    'case',
    ['boolean', ['feature-state', 'selected'], false],
    12,
    ['boolean', ['feature-state', 'hover'], false],
    10,
    ['==', ['literal', props.displayMode], 'health'],
    7,
    ['interpolate', ['linear'], ['coalesce', ['get', 'value'], 0], 0, 6, 45, 8, 70, 12],
  ])
}

function updateTimeMode() {
  if (!mapReady.value || !map) return
  if (map.getLayer('incident-points')) {
    map.setPaintProperty('incident-points', 'circle-opacity', props.timeContext.mode === 'replay' ? 0.72 : 0.92)
  }
  updateRoadTrafficVisibility()
  updateTransitStopsVisibility()
}

function updateTransitStopsVisibility() {
  if (!mapReady.value || !map) return
  const visibility = props.transitStopsVisible && props.timeContext.mode === 'live' ? 'visible' : 'none'
  for (const layer of ['nta-stop-halos', 'nta-stop-icons']) {
    if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', visibility)
  }
}

function focusSpatialFilter() {
  if (!mapReady.value || !map || !props.transportSpatialFilter || props.transportSpatialFilter.type === 'viewport') return
  map.fitBounds(
    [
      [props.transportSpatialFilter.west, props.transportSpatialFilter.south],
      [props.transportSpatialFilter.east, props.transportSpatialFilter.north],
    ],
    { padding: 72, maxZoom: 12.8, duration: 650 },
  )
}

function focusTransportRoute() {
  if (!mapReady.value || !map || !props.transportRouteIds.length) return
  const coordinates = Object.values(props.movingCollections)
    .flatMap((collection) => collection.features)
    .filter((feature) => props.transportRouteIds.includes(feature.properties.routeId ?? ''))
    .map((feature) => feature.geometry.coordinates as [number, number])
  if (!coordinates.length) return
  const bounds = coordinates.reduce(
    (current, coordinates) => current.extend(coordinates),
    new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
  )
  map.fitBounds(bounds, { padding: 88, maxZoom: 13.6, duration: 650 })
}

function setHover(source: string, event: MapLayerMouseEvent) {
  if (!map) return
  map.getCanvas().style.cursor = 'pointer'
  const id = event.features?.[0]?.id
  if (id === undefined || hovered?.id === id) return
  clearHover()
  map.setFeatureState({ source, id }, { hover: true })
  hovered = { source, id }
}

function clearHover() {
  if (!map) return
  map.getCanvas().style.cursor = ''
  if (hovered) map.setFeatureState({ source: hovered.source, id: hovered.id }, { hover: false })
  hovered = null
}

function updateSelectionState(previous: AtlasSelection | null, current: AtlasSelection | null) {
  if (!mapReady.value || !map) return
  applySelectionState(previous, false)
  applySelectionState(current, true)
}

function applySelectionState(selection: AtlasSelection | null, selected: boolean) {
  if (!map || !selection) return
  if (selection.kind === 'incident') return
  if (selection.kind === 'transit-stop') {
    map.setFeatureState({ source: transitStopsSourceId, id: selection.featureId }, { selected })
    map.setFeatureState({ source: selectedRouteStopsSourceId, id: selection.featureId }, { selected })
    return
  }
  const source = selection.kind === 'moving'
    ? movingSourceIds[selection.provider]
    : sourceIds[selection.provider]
  map.setFeatureState({ source, id: selection.featureId }, { selected })
}

function focusSelection(selection: AtlasSelection | null) {
  if (!mapReady.value || !map || !selection) return
  const feature = selection.kind === 'incident'
    ? props.incidentCollections[selection.provider]?.features.find((item) => item.properties.id === selection.featureId)
    : selection.kind === 'moving'
      ? props.movingCollections[selection.provider]?.features.find((item) => item.properties.id === selection.featureId)
      : selection.kind === 'transit-stop'
        ? props.transitStops.features.find((item) => item.properties.id === selection.featureId)
        : props.collections[selection.provider]?.features.find((item) => item.properties.id === selection.featureId)
  const coordinates = feature?.geometry.type === 'Point' ? feature.geometry.coordinates as [number, number] : undefined
  if (coordinates) map.easeTo({ center: coordinates, zoom: Math.max(map.getZoom(), 13.8), duration: 650 })
}

function statusColorExpression() {
  return ['match', ['get', 'status'], 'normal', '#2fbf71', 'warning', '#f6bd60', 'critical', '#f95738', 'offline', '#6c757d', 'unknown', '#9aa0a6', '#9aa0a6'] as mapboxgl.ExpressionSpecification
}

function severityColorExpression() {
  return ['match', ['get', 'severity'], 'info', '#3da5d9', 'minor', '#f6bd60', 'major', '#ef8354', 'critical', '#f95738', '#9aa0a6'] as mapboxgl.ExpressionSpecification
}

function scheduleColorExpression() {
  return ['match', ['get', 'scheduleStatus'], 'early', '#b8a1ff', 'on-time', '#2fbf71', 'late', '#f95738', 'unknown', '#9aa0a6', '#9aa0a6'] as mapboxgl.ExpressionSpecification
}

function unclusteredFilter() {
  return ['!', ['has', 'point_count']] as mapboxgl.FilterSpecification
}

function allFilter(expressions: unknown[]) {
  return ['all', ...expressions.filter((expression) => expression !== true)] as mapboxgl.FilterSpecification
}

function emptyCollection(): AtlasFeatureCollection {
  return { type: 'FeatureCollection', features: [] }
}

function emptyIncidentCollection(): AtlasIncidentCollection {
  return { type: 'FeatureCollection', features: [] }
}

function emptyMovingCollection(): AtlasMovingAssetCollection {
  return { type: 'FeatureCollection', features: [] }
}

function emptyTrailCollection(): AtlasVehicleTrailCollection {
  return { type: 'FeatureCollection', features: [] }
}

function emptyEtaRouteCollection(): GeoJSON.FeatureCollection<GeoJSON.LineString, { id: string }> {
  return { type: 'FeatureCollection', features: [] }
}

function emptySelectedRouteCollection(): GeoJSON.FeatureCollection<GeoJSON.LineString, { id: string; routeId?: string; routeLabel?: string; directionLabel?: string }> {
  return { type: 'FeatureCollection', features: [] }
}

function emptyTransitStopCollection(): AtlasTransitStopCollection {
  return { type: 'FeatureCollection', features: [] }
}

function fallbackMapStyle(): mapboxgl.StyleSpecification {
  return {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: 'OpenStreetMap',
      },
    },
    layers: [
      { id: 'base', type: 'raster', source: 'osm', paint: { 'raster-saturation': -0.85, 'raster-contrast': -0.2, 'raster-brightness-max': 0.72 } },
    ],
  }
}
</script>

<template>
  <div class="map-shell">
    <div ref="mapElement" class="map-canvas" />
    <div class="map-status" aria-live="polite">
      <span>{{ timeContext.mode === 'live' ? 'Near real-time public data' : 'Historical replay' }}</span>
      <strong>{{ hasMapboxToken ? 'Mapbox basemap' : 'Local fallback' }}</strong>
    </div>
    <div v-if="timeContext.mode === 'replay'" class="replay-banner">
      Replay {{ new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timeContext.timestamp)) }}
    </div>
    <div v-if="!mapboxAccessToken" class="map-config-warning" role="status">
      Add <code>VITE_MAPBOX_ACCESS_TOKEN</code> in <code>.env.local</code> for Mapbox basemap tiles.
    </div>
    <div class="data-attribution">
      Data: Office of Public Works / WaterLevel.ie; Smart Dublin / Dublin City Council; Sonitus Systems; Environmental Protection Agency; National Transport Authority<span v-if="hasMapboxToken && roadTrafficVisible && timeContext.mode === 'live'">; Mapbox Traffic</span>
    </div>
    <div class="map-legend" aria-label="Map legend">
      <span v-if="hasMapboxToken && roadTrafficVisible && timeContext.mode === 'live'"><i class="legend-road-traffic-warning" />Road warning</span>
      <span v-if="hasMapboxToken && roadTrafficVisible && timeContext.mode === 'live'"><i class="legend-road-traffic-heavy" />Road critical</span>
      <span v-if="transitStopsVisible && timeContext.mode === 'live'"><i class="legend-bus-stop" />Bus stop</span>
      <span v-if="displayMode === 'measurement'"><i class="legend-noise" />Noise</span>
      <span v-if="displayMode === 'measurement'"><i class="legend-air" />Air</span>
      <span v-if="displayMode === 'health'"><i class="legend-normal" />Normal</span>
      <span v-if="displayMode === 'health'"><i class="legend-warning" />Warning</span>
      <span v-if="displayMode === 'health'"><i class="legend-offline" />Offline</span>
      <span><i class="legend-schedule-early" />Early</span>
      <span><i class="legend-schedule-on-time" />On time</span>
      <span><i class="legend-schedule-late" />Late</span>
      <span v-if="transitDensityVisible"><i class="legend-density" />Transit density</span>
    </div>
  </div>
</template>
