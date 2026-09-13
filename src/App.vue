<script setup lang="ts">
import { computed } from 'vue'
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
} from '@lucide/vue'
import TransitMap from './components/TransitMap.vue'
import { useTransit } from './composables/useTransit'
import { transportRegions } from './data/moving/transportFilters'
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
</script>

<template>
  <main class="app-shell">
    <header class="app-header">
      <a class="brand" href="/"
        ><span class="brand-icon"><Bus :size="23" /></span
        ><strong>BusTime</strong><span class="brand-region">Ireland</span></a
      ><span class="header-status"
        ><i />{{
          source === 'fixture'
            ? 'Demo data'
            : source === 'live'
              ? 'Live bus locations'
              : 'Bus arrivals & locations'
        }}</span
      >
    </header>
    <div class="workspace">
      <aside class="journey-panel" aria-label="Find your bus">
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
          ></template>
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
                    selectedVehicle.properties.nextStopName
                      ? `Approaching ${selectedVehicle.properties.nextStopName}`
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
              <h3>{{ searchMode === 'stops' ? 'Bus stops' : 'Bus routes' }}</h3>
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
                ><small>Stop {{ stop.properties.stopId }}</small></span
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
                query.trim().length >= 2 &&
                !searching &&
                !searchError &&
                !stopResults.length &&
                !routeResults.length
              "
              class="empty-copy"
            >
              No matching {{ searchMode }} found.
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
        @vehicle="selectVehicle"
        @stop="selectStop"
        @bounds="state.loadMapStops"
      />
    </div>
  </main>
</template>
