<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  Bus,
  Search,
  MapPin,
  Route,
  Radio,
  Clock3,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Map as MapIcon,
  List,
  Sun,
  Moon,
  LocateFixed,
} from '@lucide/vue'
import TransitMap from './components/TransitMap.vue'
import { useTransit } from './composables/useTransit'
import { nearestTransportRegion, transportRegions } from './data/moving/transportFilters'
const state = useTransit()
const {
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
  nearby,
  nearbyDistances,
  findNearbyStops,
  detailError,
  source,
  refresh,
  reset,
  selectStop,
  selectRoute,
  selectVehicle,
} = state
const selected = computed(
  () => selectedRoute.value || selectedStop.value || selectedVehicle.value,
)
const mobileView = ref<'balanced' | 'map' | 'details'>('balanced')
const mobileSearchOpen = ref(false)
watch(() => [selectedRoute.value?.routeId, selectedStop.value?.properties.id, selectedVehicle.value?.properties.id].join('|'), () => {
  mobileView.value = 'balanced'
  mobileSearchOpen.value = false
})
function openMobileSearch() {
  mobileView.value = 'details'
  mobileSearchOpen.value = !mobileSearchOpen.value
}
const modes = [
  { id: 'stops' as const, label: 'Stops', icon: MapPin },
  { id: 'routes' as const, label: 'Routes', icon: Route },
  { id: 'live' as const, label: 'Live buses', icon: Radio },
]
function changeMode(mode: 'stops' | 'routes' | 'live') {
  searchMode.value = mode
  query.value = ''
  reset()
}
const buses = computed(() =>
  visibleVehicles.value.features.filter(
    (bus) =>
      !query.value ||
      searchMode.value !== 'live' ||
      `${bus.properties.routeLabel} ${bus.properties.sourceProperties.tripHeadsign ?? ''} ${bus.properties.vehicleId}`
        .toLowerCase()
        .includes(query.value.toLowerCase()),
  ),
)
function minutes(time?: string) {
  if (!time) return '--'
  const value = Math.ceil((Date.parse(time) - now.value) / 60000)
  return value <= 0 ? 'Due' : `${value} min`
}
function clock(time?: string) {
  return time
    ? new Date(time).toLocaleTimeString('en-IE', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Dublin',
      })
    : '--'
}
function age(time: string) {
  const seconds = Math.max(0, Math.round((now.value - Date.parse(time)) / 1000))
  return seconds < 60
    ? `${seconds}s ago`
    : `${Math.floor(seconds / 60)} min ago`
}
const schedule = computed(() => {
  const seconds = selectedVehicle.value?.properties.scheduleDeviationSeconds
  return seconds === undefined
    ? 'Schedule comparison unavailable'
    : Math.abs(seconds) <= 60
      ? 'On time'
      : `${Math.round(Math.abs(seconds) / 60)} min ${seconds > 0 ? 'late' : 'early'}`
})
const storedTheme = localStorage.getItem('bustime-theme')
const theme = ref<'light' | 'dark'>(
  storedTheme === 'light' || storedTheme === 'dark'
    ? storedTheme
    : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
)
watch(
  theme,
  (value) => {
    document.documentElement.setAttribute('data-theme', value)
    localStorage.setItem('bustime-theme', value)
  },
  { immediate: true },
)
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}
const userLocation = ref<{ longitude: number; latitude: number } | null>(null)
const locating = ref(false)
const locationError = ref('')
let nearbyRequest = 0
watch([query, searchMode, selectedArea], () => { nearbyRequest++; locating.value = false; locationError.value = '' })
async function searchNearby() {
  changeMode('stops')
  await nextTick()
  const request = ++nearbyRequest
  locating.value = true
  locationError.value = ''
  try {
    if (!navigator.geolocation) throw new Error('Location is unavailable in this browser. Search by stop name or number instead.')
    const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { maximumAge: 30000, timeout: 15000, enableHighAccuracy: true }))
    if (request !== nearbyRequest) return
    const { longitude, latitude } = position.coords
    userLocation.value = { longitude, latitude }
    await findNearbyStops(longitude, latitude)
  } catch (cause) {
    if (request === nearbyRequest) locationError.value = cause instanceof Error ? cause.message : 'Location could not be accessed. Allow location in your browser, or search by stop name or number.'
  } finally {
    if (request === nearbyRequest) locating.value = false
  }
}
let locationWatch: number | undefined
onMounted(() => {
  if (!navigator.geolocation) return
  locationWatch = navigator.geolocation.watchPosition(
    (position) => {
      const { longitude, latitude } = position.coords
      const firstFix = !userLocation.value
      userLocation.value = { longitude, latitude }
      const nearest = nearestTransportRegion(longitude, latitude)
      if (firstFix && nearest && selectedArea.value === 'ireland') selectedArea.value = nearest.id
    },
    () => {
      // Permission denied or unavailable; keep the nationwide default view.
    },
    { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 },
  )
})
onUnmounted(() => {
  if (locationWatch !== undefined) navigator.geolocation.clearWatch(locationWatch)
})
</script>

<template>
  <main class="app-shell" :class="[`mobile-view-${mobileView}`, { 'has-selection': selected, 'has-vehicle': selectedVehicle, 'mobile-search-open': mobileSearchOpen }]">
    <header class="app-header">
      <a class="brand" href="/"
        ><span class="brand-icon"><Bus :size="23" /></span
        ><strong>BusTime</strong><span class="brand-region">Ireland</span></a
      ><div class="header-actions"
        ><button
          class="theme-toggle"
          type="button"
          :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleTheme"
        >
          <Sun v-if="theme === 'dark'" :size="18" /><Moon v-else :size="18" /></button
        ><span class="header-status"
          ><i :class="{ pulsing: loading }" />{{
            source === 'fixture'
              ? 'Demo data'
              : source === 'live'
                ? 'Live bus locations'
                : 'Bus arrivals & locations'
          }}</span
        ></div
      >
    </header>
    <div class="workspace">
      <aside class="journey-panel" aria-label="Find your bus">
        <div class="mobile-panel-bar">
          <strong>{{ selected ? 'Your journey' : 'Find a bus' }}</strong>
          <button v-if="selected" class="icon-button" title="Search for another bus or stop" aria-label="Search for another bus or stop" :aria-expanded="mobileSearchOpen" @click="openMobileSearch"><Search :size="20" /></button>
          <button class="icon-button" title="More map space" aria-label="More map space" :aria-pressed="mobileView === 'map'" @click="mobileView = mobileView === 'map' ? 'balanced' : 'map'"><MapIcon :size="20" /></button>
          <button class="icon-button" title="More detail space" aria-label="More detail space" :aria-pressed="mobileView === 'details'" @click="mobileView = mobileView === 'details' ? 'balanced' : 'details'"><List :size="20" /></button>
        </div>
        <div class="search-section">
          <h1>Where is my bus?</h1>
          <label class="field-label" for="area">City or area</label>
          <select id="area" v-model="selectedArea">
            <option value="" disabled>Choose an area</option>
            <option value="ireland">All Ireland</option>
            <option
              v-for="region in transportRegions"
              :key="region.id"
              :value="region.id"
            >
              {{ region.label.replace(' City', '') }}
            </option>
          </select>
          <template v-if="selectedArea"
            ><div class="mode-tabs" role="tablist" aria-label="Search for">
              <button
                v-for="mode in modes"
                :key="mode.id"
                role="tab"
                :aria-selected="searchMode === mode.id"
                :class="{ active: searchMode === mode.id }"
                @click="changeMode(mode.id)"
              >
                <component :is="mode.icon" :size="17" />{{ mode.label }}
              </button>
            </div>
            <div class="search-field">
              <Search :size="19" /><input
                v-model="query"
                :aria-label="
                  searchMode === 'stops'
                    ? 'Stop name or number'
                    : 'Bus route or destination'
                "
                :placeholder="
                  searchMode === 'stops'
                    ? 'Stop name or number'
                    : 'Bus route or destination'
                "
                type="search"
              /></div
          >
            <button v-if="searchMode === 'stops'" class="text-button nearby-button" :disabled="locating || searching" @click="searchNearby">
              <LocateFixed :size="18" />{{ locating ? 'Finding nearby stops...' : 'Bus stops near me' }}
            </button>
            <p v-if="locationError" class="error-state" role="alert">{{ locationError }}</p>
          </template>
        </div>
        <div class="panel-content">
          <p v-if="source === 'fixture'" class="notice">
            <AlertTriangle :size="18" />Demo locations. Live arrival information
            is unavailable.
          </p>
          <div v-if="error" class="error-state" role="alert">
            <p>{{ error }}</p>
            <button class="text-button" @click="refresh">
              <RefreshCw :size="16" />Try again
            </button>
          </div>
          <template v-if="selected">
            <button class="back-button" @click="reset">
              <ArrowLeft :size="16" />Back to results
            </button>
            <section v-if="selectedStop" class="stop-heading">
              <span class="eyebrow"
                >Stop {{ selectedStop.properties.stopId }}</span
              >
              <h2>{{ selectedStop.properties.name }}</h2>
            </section>
            <section v-if="selectedVehicle" class="bus-details">
              <div class="bus-heading">
                <span class="route-badge">{{
                  selectedVehicle.properties.routeLabel || 'Bus'
                }}</span>
                <div>
                  <h2>
                    {{
                      selectedVehicle.properties.sourceProperties
                        .tripHeadsign || selectedVehicle.properties.name
                    }}
                  </h2>
                  <span class="muted"
                    >Bus
                    {{
                      selectedVehicle.properties.vehicleId || 'ID unavailable'
                    }}</span
                  >
                </div>
              </div>
              <div class="location-line">
                <MapPin :size="17" /><span
                  >{{
                    eta?.stopName && !selectedStop
                      ? `Next stop: ${eta.stopName}`
                      : 'Last reported location on map'
                  }}<small
                    >Updated
                    {{ age(selectedVehicle.properties.observedAt) }}</small
                  ></span
                >
              </div>
              <div class="arrival-focus">
                <div class="eyebrow">
                  <Clock3 :size="16" />{{
                    selectedStop ? 'To this stop' : 'To next stop'
                  }}
                </div>
                <strong class="eta-number">{{
                  detailLoading && !eta ? '...' : minutes(eta?.predictedArrival)
                }}</strong
                ><span>{{
                  eta?.stopName ||
                  selectedStop?.properties.name ||
                  selectedVehicle.properties.nextStopName ||
                  'Arrival unavailable'
                }}</span>
                <div class="eta-meta">
                  <span>{{
                    eta?.predictedArrival
                      ? `Expected ${clock(eta.predictedArrival)}`
                      : 'No reliable estimate'
                  }}</span
                  ><span v-if="eta?.status === 'available'"
                    >{{ eta.confidence }} confidence</span
                  >
                </div>
              </div>
              <p class="schedule-line">{{ schedule }}</p>
              <section v-if="delayAssessment" class="delay-section">
                <h3>What might be delaying it?</h3>
                <div class="delay-title">
                  <AlertTriangle :size="18" /><strong>{{
                    delayAssessment.category
                  }}</strong>
                </div>
                <p>{{ delayAssessment.explanation }}</p>
                <span class="evidence-label">{{
                  delayAssessment.inferred
                    ? 'Inferred from available data'
                    : 'Reported by the transport feed'
                }}</span>
              </section>
            </section>
            <section v-if="selectedStop" class="arrivals-section">
              <h3>
                Next arrivals <span>{{ arrivals.length }}</span>
              </h3>
              <p
                v-if="detailLoading && !arrivals.length"
                class="muted"
                role="status"
              >
                Checking arrivals...
              </p>
              <p v-else-if="!arrivals.length" class="empty-copy">
                No reliable live arrivals are available for this stop.
              </p>
              <button
                v-for="arrival in arrivals"
                :key="arrival.tripId"
                class="arrival-row"
                :disabled="!arrival.vehicleFeatureId"
                @click="
                  selectVehicle(
                    visibleVehicles.features.find(
                      (bus) => bus.properties.id === arrival.vehicleFeatureId,
                    )!,
                  )
                "
              >
                <span class="route-badge small">{{
                  arrival.routeShortName || arrival.routeId
                }}</span
                ><span class="arrival-destination"
                  ><strong>{{
                    arrival.headsign || 'Destination unavailable'
                  }}</strong
                  ><small
                    >{{ clock(arrival.displayArrival) }} ·
                    {{ arrival.confidence }} confidence</small
                  ></span
                ><span class="arrival-time">{{
                  minutes(arrival.displayArrival)
                }}</span>
              </button>
            </section>
            <section v-if="selectedRoute && !selectedVehicle">
              <span class="eyebrow">Route {{ selectedRoute.shortName }}</span>
              <h2>
                {{
                  selectedRoute.longName || selectedRoute.headsigns.join(' / ')
                }}
              </h2>
              <p class="muted">{{ selectedRoute.operator }}</p>
            </section>
            <p v-if="detailError" role="alert" class="error-state">
              {{ detailError }}
            </p>
          </template>
          <template v-if="!selected && selectedArea && searchMode !== 'live'">
            <div class="section-caption">
              <h3>{{ nearby ? 'Stops within 1 km' : searchMode === 'stops' ? 'Bus stops' : 'Bus routes' }}</h3>
              <span v-if="searching" role="status">Searching...</span>
            </div>
            <p v-if="searchError" class="error-state" role="alert">
              {{ searchError }}
            </p>
            <button
              v-for="stop in stopResults"
              :key="stop.properties.id"
              class="result-row"
              @click="selectStop(stop)"
            >
              <MapPin :size="19" /><span
                ><strong>{{ stop.properties.name }}</strong
                ><small>Stop {{ stop.properties.stopId }}<template v-if="nearby"> · {{ Math.round((nearbyDistances[stop.properties.id] || 0) / 10) * 10 }} m straight-line</template></small></span
              ><ChevronRight :size="17" />
            </button>
            <button
              v-for="route in routeResults"
              :key="route.routeId"
              class="result-row"
              @click="selectRoute(route)"
            >
              <span class="route-badge small">{{
                route.shortName || route.routeId
              }}</span
              ><span
                ><strong>{{
                  route.longName || route.headsigns.join(' / ')
                }}</strong
                ><small>{{ route.operator }}</small></span
              ><ChevronRight :size="17" />
            </button>
            <p
              v-if="
                (nearby || query.trim().length >= 2) &&
                !searching &&
                !searchError &&
                !stopResults.length &&
                !routeResults.length
              "
              class="empty-copy"
            >
              {{ nearby ? 'No bus stops found within 1 km. Search by stop name or number.' : `No matching ${searchMode} found.` }}
            </p>
          </template>
          <section
            v-if="
              selectedArea &&
              (searchMode === 'live' || selectedRoute) &&
              !selectedVehicle &&
              !selectedStop
            "
            class="live-section"
          >
            <div class="section-caption">
              <h3>
                Live buses <span>{{ buses.length }}</span>
              </h3>
              <button
                class="icon-button subtle"
                title="Refresh buses"
                aria-label="Refresh buses"
                :disabled="loading"
                @click="refresh"
              >
                <RefreshCw :size="17" :class="{ spinning: loading }" />
              </button>
            </div>
            <p v-if="loading && !buses.length" role="status" class="muted">
              Finding buses...
            </p>
            <p v-else-if="!buses.length && !error" class="empty-copy">
              No buses are reporting in this area.
            </p>
            <button
              v-for="bus in buses"
              :key="bus.properties.id"
              class="result-row"
              @click="selectVehicle(bus)"
            >
              <span class="route-badge small">{{
                bus.properties.routeLabel || 'Bus'
              }}</span
              ><span
                ><strong>{{
                  bus.properties.sourceProperties.tripHeadsign ||
                  bus.properties.name
                }}</strong
                ><small
                  >{{ bus.properties.nextStopName || 'Location available' }} ·
                  {{ age(bus.properties.observedAt) }}</small
                ></span
              ><ChevronRight :size="17" />
            </button>
          </section>
        </div>
        <footer class="panel-footer">
          <Bus :size="15" /><span>{{
            selectedArea ? area?.label || 'All Ireland' : 'Ireland'
          }}</span
          ><span v-if="loading">Updating...</span
          ><span v-else-if="selectedArea"
            >{{ visibleVehicles.features.length }} buses</span
          >
        </footer>
      </aside>
      <TransitMap
        :vehicles="visibleVehicles"
        :stops="visibleStops"
        :area="area"
        :selected-vehicle="selectedVehicle"
        :selected-stop="selectedStop"
        :eta="eta"
        :trail="trail"
        :updating="loading && Boolean(visibleVehicles.features.length)"
        :dark="theme === 'dark'"
        :user-location="userLocation"
        @vehicle="selectVehicle"
        @stop="selectStop"
        @bounds="state.loadMapStops"
      />
    </div>
  </main>
</template>
