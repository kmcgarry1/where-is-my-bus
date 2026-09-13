<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import type mapboxgl from 'mapbox-gl'
import type { FeatureCollection } from 'geojson'
import 'mapbox-gl/dist/mapbox-gl.css'
import { LocateFixed, TrafficCone, MapPin } from '@lucide/vue'
import busIcon from '@mapbox/maki/icons/bus.svg?url'
import stopIcon from '@mapbox/maki/icons/marker.svg?url'
import type {
  AtlasMovingAssetCollection,
  AtlasMovingAssetFeature,
  AtlasTransitStopCollection,
  AtlasTransitStopFeature,
  AtlasTransportRegion,
  AtlasEtaPrediction,
} from '../data/movingAsset.types'
import { interpolateMovingCollection } from '../data/moving/interpolation'
const props = defineProps<{
  vehicles: AtlasMovingAssetCollection
  stops: AtlasTransitStopCollection
  area?: AtlasTransportRegion
  selectedVehicle?: AtlasMovingAssetFeature
  selectedStop?: AtlasTransitStopFeature
  eta?: AtlasEtaPrediction
  trail: FeatureCollection
}>()
const emit = defineEmits<{
  vehicle: [AtlasMovingAssetFeature]
  stop: [AtlasTransitStopFeature]
  bounds: [string | undefined]
}>()
const container = ref<HTMLDivElement>()
const traffic = ref(false)
const showStops = ref(false)
const mapError = ref('')
const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim()
let map: mapboxgl.Map | undefined
let observer: ResizeObserver | undefined
let animation = 0
let displayed: AtlasMovingAssetCollection = {
  type: 'FeatureCollection',
  features: [],
}
const empty: FeatureCollection = { type: 'FeatureCollection', features: [] }
function setData(id: string, data: FeatureCollection) {
  ;(map?.getSource(id) as mapboxgl.GeoJSONSource | undefined)?.setData(data)
}
function fitArea() {
  if (props.area)
    map?.fitBounds(
      [
        [props.area.west, props.area.south],
        [props.area.east, props.area.north],
      ],
      { padding: 40, duration: 600 },
    )
  else
    map?.fitBounds(
      [
        [-10.8, 51.35],
        [-5.4, 55.5],
      ],
      { padding: 30, duration: 600 },
    )
}
function focusSelection() {
  const feature = props.selectedVehicle ?? props.selectedStop
  if (feature && map)
    map.flyTo({
      center: feature.geometry.coordinates as [number, number],
      zoom: Math.max(map.getZoom(), 14),
      duration: 650,
    })
}
function requestStops() {
  const bounds = map?.getBounds()
  emit(
    'bounds',
    showStops.value && bounds
      ? [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth(),
        ].join(',')
      : undefined,
  )
}
async function registerIcon(id: string, url: string) {
  const image = new Image(48, 48)
  image.src = url
  await image.decode()
  if (!map) return
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 48
  const context = canvas.getContext('2d')!
  context.drawImage(image, 8, 8, 32, 32)
  map.addImage(id, context.getImageData(0, 0, 48, 48), { pixelRatio: 2 })
}
function updateDetails() {
  setData(
    'route',
    props.eta?.routeFeature
      ? { type: 'FeatureCollection', features: [props.eta.routeFeature] }
      : empty,
  )
  setData('trail', props.trail)
  const stops = props.eta?.routeStops ?? props.stops
  setData(
    'stops',
    props.selectedStop &&
      !stops.features.some(
        (stop) => stop.properties.id === props.selectedStop?.properties.id,
      )
      ? { ...stops, features: [...stops.features, props.selectedStop] }
      : stops,
  )
  setData(
    'selected',
    props.selectedVehicle
      ? { type: 'FeatureCollection', features: [props.selectedVehicle] }
      : empty,
  )
}
onMounted(async () => {
  try {
    // Both renderers implement the source/layer API used by this component.
    let renderer: typeof mapboxgl
    if (token) renderer = (await import('mapbox-gl')).default
    else {
      const library = await import('maplibre-gl')
      const worker =
        await import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url')
      library.setWorkerUrl(worker.default)
      await import('maplibre-gl/dist/maplibre-gl.css')
      renderer = library as unknown as typeof mapboxgl
    }
    if (!container.value) return
    map = new renderer.Map({
      container: container.value,
      accessToken: token || undefined,
      style: token
        ? 'mapbox://styles/mapbox/light-v11'
        : {
            version: 8,
            sources: {
              osm: {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '&copy; OpenStreetMap contributors',
              },
            },
            layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
          },
      center: [-7.8, 53.4],
      zoom: 6,
      attributionControl: false,
    })
    if (import.meta.env.DEV)
      (window as Window & { __busTimeMap?: mapboxgl.Map }).__busTimeMap = map
    map.addControl(
      new renderer.AttributionControl({ compact: true }),
      'bottom-right',
    )
    map.addControl(
      new renderer.NavigationControl({ showCompass: false }),
      'bottom-right',
    )
    map.on('moveend', () => {
      if (showStops.value) requestStops()
    })
    map.on('error', () => {
      mapError.value =
        'Some map tiles could not load. Bus details are still available.'
    })
    map.on('load', async () => {
      if (!map) return
      try {
        await registerIcon('local-bus', busIcon)
        await registerIcon('local-stop', stopIcon)
        if (!map) return
        for (const id of ['vehicles', 'stops', 'route', 'selected', 'trail'])
          map.addSource(id, { type: 'geojson', data: empty })
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': '#187565',
            'line-width': 5,
            'line-opacity': 0.65,
          },
        })
        map.addLayer({
          id: 'trail-line',
          type: 'line',
          source: 'trail',
          paint: {
            'line-color': '#a3477d',
            'line-width': 3,
            'line-dasharray': [2, 2],
          },
        })
        map.addLayer({
          id: 'stop-bg',
          type: 'circle',
          source: 'stops',
          paint: {
            'circle-radius': 12,
            'circle-color': '#ffffff',
            'circle-stroke-color': '#555f60',
            'circle-stroke-width': 1.5,
          },
        })
        map.addLayer({
          id: 'stop-icons',
          type: 'symbol',
          source: 'stops',
          layout: {
            'icon-image': map.hasImage('bus-stop') ? 'bus-stop' : 'local-stop',
            'icon-allow-overlap': true,
          },
        })
        map.addLayer({
          id: 'selected-halo',
          type: 'circle',
          source: 'selected',
          paint: {
            'circle-radius': 25,
            'circle-color': '#21846c',
            'circle-opacity': 0.2,
            'circle-stroke-color': '#156e59',
            'circle-stroke-width': 2,
          },
        })
        map.addLayer({
          id: 'bus-bg',
          type: 'circle',
          source: 'vehicles',
          paint: {
            'circle-radius': 15,
            'circle-color': [
              'case',
              ['==', ['get', 'scheduleStatus'], 'late'],
              '#f2c663',
              '#69cfb2',
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2,
          },
        })
        map.addLayer({
          id: 'bus-icons',
          type: 'symbol',
          source: 'vehicles',
          layout: { 'icon-image': 'local-bus', 'icon-allow-overlap': true },
        })
        if (token) {
          map.addSource('traffic', {
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-traffic-v1',
          })
          map.addLayer(
            {
              id: 'traffic-lines',
              type: 'line',
              source: 'traffic',
              'source-layer': 'traffic',
              layout: { visibility: 'none' },
              paint: {
                'line-width': 3,
                'line-offset': 2,
                'line-color': [
                  'match',
                  ['get', 'congestion'],
                  'moderate',
                  '#d5a631',
                  'heavy',
                  '#d16b40',
                  'severe',
                  '#c44558',
                  '#5ba88a',
                ],
              },
            },
            'route-line',
          )
        }
        for (const layer of ['bus-bg', 'stop-bg']) {
          map.on('mouseenter', layer, () => {
            if (map) map.getCanvas().style.cursor = 'pointer'
          })
          map.on('mouseleave', layer, () => {
            if (map) map.getCanvas().style.cursor = ''
          })
          map.on('click', layer, (event) => {
            const id = event.features?.[0]?.properties?.id
            if (layer === 'bus-bg') {
              const bus = props.vehicles.features.find(
                (item) => item.properties.id === id,
              )
              if (bus) emit('vehicle', bus)
            } else {
              const stop = (props.eta?.routeStops ?? props.stops).features.find(
                (item) => item.properties.id === id,
              )
              if (stop) emit('stop', stop)
            }
          })
        }
        displayed = props.vehicles
        setData('vehicles', displayed)
        updateDetails()
        if (props.selectedVehicle || props.selectedStop) focusSelection()
        else fitArea()
      } catch {
        mapError.value =
          'Map symbols could not load. Bus details are still available.'
      }
    })
    observer = new ResizeObserver(() => map?.resize())
    observer.observe(container.value!)
  } catch {
    mapError.value =
      'The map is unavailable in this browser. Bus details are still available.'
  }
})
watch(
  () => props.vehicles,
  (next) => {
    cancelAnimationFrame(animation)
    const previous = displayed
    const started = performance.now()
    function frame() {
      const ratio = Math.min(1, (performance.now() - started) / 1200)
      displayed = interpolateMovingCollection(previous, next, ratio)
      setData('vehicles', displayed)
      if (ratio < 1) animation = requestAnimationFrame(frame)
    }
    animation = requestAnimationFrame(frame)
  },
)
watch(() => props.area, fitArea)
watch(
  () => [
    props.eta,
    props.stops,
    props.selectedStop,
    props.selectedVehicle,
    props.trail,
  ],
  updateDetails,
)
watch(
  () =>
    props.selectedVehicle?.properties.id ?? props.selectedStop?.properties.id,
  focusSelection,
)
watch(traffic, (show) => {
  if (map?.getLayer('traffic-lines'))
    map.setLayoutProperty(
      'traffic-lines',
      'visibility',
      show ? 'visible' : 'none',
    )
})
watch(showStops, requestStops)
onUnmounted(() => {
  cancelAnimationFrame(animation)
  observer?.disconnect()
  map?.remove()
  map = undefined
})
</script>
<template>
  <section class="map-pane" aria-label="Bus location map">
    <div ref="container" class="map-canvas" />
    <div class="map-tools">
      <button
        class="icon-button"
        title="Fit selected area"
        aria-label="Fit selected area"
        @click="fitArea"
      >
        <LocateFixed :size="20" /></button
      ><button
        class="icon-button"
        :class="{ active: showStops }"
        title="Show bus stops"
        aria-label="Show bus stops"
        :aria-pressed="showStops"
        @click="showStops = !showStops"
      >
        <MapPin :size="20" /></button
      ><button
        v-if="token"
        class="icon-button"
        :class="{ active: traffic }"
        title="Traffic conditions"
        aria-label="Traffic conditions"
        :aria-pressed="traffic"
        @click="traffic = !traffic"
      >
        <TrafficCone :size="20" />
      </button>
    </div>
    <div class="map-key">
      <span><i class="key-bus" />Bus</span
      ><span><i class="key-stop" />Stop</span
      ><span><i class="key-late" />Late</span>
    </div>
    <p v-if="mapError" class="map-warning" role="status">{{ mapError }}</p>
  </section>
</template>
