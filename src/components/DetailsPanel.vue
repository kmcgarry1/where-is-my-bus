<script setup lang="ts">
import { toRef } from 'vue'
import type { AtlasPointFeature } from '../data/atlas.types'
import type { AtlasIncidentFeature } from '../data/incident.types'
import type { AtlasEtaPrediction, AtlasMovingAssetFeature, AtlasStopArrivalsState, AtlasTransitStopFeature } from '../data/movingAsset.types'
import { relativeAge } from '../data/providers/time'
import { useTelemetryHistory } from '../composables/useTelemetryHistory'
import TelemetryChart from './telemetry/TelemetryChart.vue'
import TelemetryMetricSelector from './telemetry/TelemetryMetricSelector.vue'
import TelemetryRangeSelector from './telemetry/TelemetryRangeSelector.vue'
import TelemetrySummary from './telemetry/TelemetrySummary.vue'

const props = defineProps<{
  feature: AtlasPointFeature | null
  incident: AtlasIncidentFeature | null
  movingFeature: AtlasMovingAssetFeature | null
  transitStop: AtlasTransitStopFeature | null
  etaPrediction: AtlasEtaPrediction | null
  etaPredictionLoading: boolean
  etaPredictionError?: string
  stopArrivals: AtlasStopArrivalsState
}>()

const emit = defineEmits<{
  selectMoving: [featureId: string]
}>()

const telemetry = useTelemetryHistory(toRef(props, 'feature'))

function sourceValue(key: string) {
  return props.feature?.properties.sourceProperties[key]
}

function formattedObservedAt() {
  const observedAt = props.feature?.properties.observedAt
  return observedAt ? new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(observedAt)) : 'Unknown'
}

function formattedDate(value?: string) {
  return value ? new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Unknown'
}

function incidentSourceValue(key: string) {
  return props.incident?.properties.sourceProperties[key]
}

function movingSourceValue(key: string) {
  return props.movingFeature?.properties.sourceProperties[key]
}

function transitStopSourceValue(key: string) {
  return props.transitStop?.properties.sourceProperties[key]
}

function formatSpeed(value?: number) {
  return typeof value === 'number' ? `${(value * 3.6).toFixed(1)} km/h` : 'Unknown'
}

function formatScheduleDeviation(value?: number) {
  if (typeof value !== 'number') return 'Unknown'
  const absoluteSeconds = Math.abs(value)
  const minutes = Math.round(absoluteSeconds / 60)
  if (minutes === 0) return 'On time'
  const direction = value < 0 ? 'early' : 'late'
  return `${minutes} min ${direction}`
}

function formatDuration(value?: number) {
  if (typeof value !== 'number') return 'Unknown'
  const absoluteSeconds = Math.max(0, Math.round(value))
  if (absoluteSeconds < 60) return '<1 min'
  const minutes = Math.round(absoluteSeconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`
}

function formatDistance(value?: number) {
  if (typeof value !== 'number') return 'Unknown'
  if (value < 1000) return `${Math.round(value)} m`
  return `${(value / 1000).toFixed(1)} km`
}

function formatTime(value?: string) {
  return value ? new Intl.DateTimeFormat('en-IE', { timeStyle: 'short' }).format(new Date(value)) : 'Unknown'
}

function routeDirectionLabel(routeShortName: string | undefined, headsign: string | undefined) {
  return [routeShortName, headsign].filter(Boolean).join(' to ') || 'Unknown service'
}

function badgeClass(value?: string) {
  return value ? `status-${value}` : 'status-unknown'
}

function severityClass(value?: string) {
  return value ? `severity-${value}` : 'severity-low'
}
</script>

<template>
  <aside class="details-panel" aria-label="Selection details">
    <template v-if="movingFeature">
      <header class="details-header">
        <p class="eyebrow">Moving Asset</p>
        <h2>{{ movingFeature.properties.name }}</h2>
        <div class="details-meta">
          <span>{{ movingFeature.properties.providerName }}</span>
          <span>{{ movingFeature.properties.assetType }}</span>
        </div>
        <span :class="['status-badge', badgeClass(movingFeature.properties.status)]">{{ movingFeature.properties.status }}</span>
      </header>
      <dl class="details-section">
        <div><dt>Provider</dt><dd>{{ movingFeature.properties.providerName }}</dd></div>
        <div><dt>Vehicle Type</dt><dd>{{ movingFeature.properties.assetType }}</dd></div>
        <div><dt>Route</dt><dd>{{ movingFeature.properties.routeLabel ?? 'Unknown' }}</dd></div>
        <div v-if="movingSourceValue('routeLongName')"><dt>Route name</dt><dd>{{ movingSourceValue('routeLongName') }}</dd></div>
        <div><dt>Vehicle</dt><dd>{{ movingFeature.properties.vehicleId ?? 'Unknown' }}</dd></div>
        <div><dt>Trip</dt><dd>{{ movingFeature.properties.tripId ?? 'Unknown' }}</dd></div>
        <div v-if="movingSourceValue('tripHeadsign')"><dt>Headsign</dt><dd>{{ movingSourceValue('tripHeadsign') }}</dd></div>
        <div><dt>Schedule</dt><dd>{{ movingFeature.properties.scheduleStatus ?? 'unknown' }}</dd></div>
        <div v-if="movingFeature.properties.scheduleDeviationSeconds !== undefined"><dt>Deviation</dt><dd>{{ formatScheduleDeviation(movingFeature.properties.scheduleDeviationSeconds) }}</dd></div>
        <div v-if="movingFeature.properties.nextStopName"><dt>Reference stop</dt><dd>{{ movingFeature.properties.nextStopName }}</dd></div>
        <div><dt>Observed</dt><dd>{{ formattedDate(movingFeature.properties.observedAt) }}</dd></div>
        <div><dt>Freshness</dt><dd>{{ relativeAge(movingFeature.properties.observedAt) }}</dd></div>
        <div><dt>Speed</dt><dd>{{ formatSpeed(movingFeature.properties.speed) }}</dd></div>
        <div><dt>Bearing</dt><dd>{{ movingFeature.properties.bearing?.toFixed(0) ?? 'Unknown' }}</dd></div>
        <div><dt>Coordinates</dt><dd>{{ movingFeature.geometry.coordinates[1].toFixed(4) }}, {{ movingFeature.geometry.coordinates[0].toFixed(4) }}</dd></div>
      </dl>
      <p class="description">
        Position updates are discrete GTFS-Realtime observations. Any movement between snapshots is visual only; the observed timestamp remains the measured time.
      </p>
      <section v-if="etaPredictionLoading || etaPredictionError || etaPrediction" class="provider-detail-block details-section">
        <h3>Next Stop ETA</h3>
        <p v-if="etaPredictionLoading" class="description">Calculating AtlasOps prediction.</p>
        <p v-else-if="etaPredictionError" class="description">ETA unavailable: {{ etaPredictionError }}</p>
        <dl v-else-if="etaPrediction">
          <div><dt>Next stop</dt><dd>{{ etaPrediction.stopName ?? 'Unknown' }}</dd></div>
          <div><dt>AtlasOps prediction</dt><dd>{{ etaPrediction.predictedArrival ? formatDuration(etaPrediction.estimatedTravelSeconds) : 'Unavailable' }}</dd></div>
          <div v-if="etaPrediction.predictedArrival"><dt>Expected</dt><dd>{{ formatTime(etaPrediction.predictedArrival) }}</dd></div>
          <div v-if="etaPrediction.scheduledArrival"><dt>Scheduled</dt><dd>{{ formatTime(etaPrediction.scheduledArrival) }}</dd></div>
          <div v-if="etaPrediction.providerArrival"><dt>NTA realtime</dt><dd>{{ formatTime(etaPrediction.providerArrival) }}</dd></div>
          <div v-if="etaPrediction.scheduleDeviationSeconds !== undefined"><dt>Running</dt><dd>{{ formatScheduleDeviation(etaPrediction.scheduleDeviationSeconds) }}</dd></div>
          <div><dt>Distance</dt><dd>{{ formatDistance(etaPrediction.distanceRemainingMeters) }}</dd></div>
          <div><dt>Confidence</dt><dd>{{ etaPrediction.confidence.toUpperCase() }}</dd></div>
          <div><dt>Updated</dt><dd>{{ relativeAge(etaPrediction.calculatedAt) }}</dd></div>
        </dl>
        <details v-if="etaPrediction" class="prediction-details">
          <summary>Why this ETA?</summary>
          <dl>
            <div><dt>Method</dt><dd>{{ etaPrediction.method }}</dd></div>
            <div><dt>Vehicle data</dt><dd>{{ etaPrediction.evidence.realtimePositionAgeSeconds?.toFixed(0) ?? 'Unknown' }} sec old</dd></div>
            <div><dt>Recent observations</dt><dd>{{ etaPrediction.evidence.recentObservationCount }}</dd></div>
            <div v-if="etaPrediction.evidence.recentSpeedMps"><dt>Recent progression</dt><dd>{{ formatSpeed(etaPrediction.evidence.recentSpeedMps) }}</dd></div>
            <div v-if="etaPrediction.evidence.remainingDistanceMeters"><dt>Remaining shape</dt><dd>{{ formatDistance(etaPrediction.evidence.remainingDistanceMeters) }}</dd></div>
            <div v-if="etaPrediction.evidence.scheduleRemainingSeconds"><dt>Schedule baseline</dt><dd>{{ formatDuration(etaPrediction.evidence.scheduleRemainingSeconds) }}</dd></div>
            <div v-if="etaPrediction.evidence.movementEstimateSeconds"><dt>Movement estimate</dt><dd>{{ formatDuration(etaPrediction.evidence.movementEstimateSeconds) }}</dd></div>
            <div v-if="etaPrediction.evidence.shapeMatchDistanceMeters !== undefined"><dt>Shape match</dt><dd>{{ formatDistance(etaPrediction.evidence.shapeMatchDistanceMeters) }}</dd></div>
            <div v-if="etaPrediction.evidence.reason"><dt>Reason</dt><dd>{{ etaPrediction.evidence.reason }}</dd></div>
          </dl>
        </details>
      </section>
      <section class="provider-detail-block details-section">
        <h3>GTFS-Realtime</h3>
        <dl>
          <div><dt>Feed source</dt><dd>{{ movingSourceValue('source') }}</dd></div>
          <div><dt>Static GTFS</dt><dd>{{ movingSourceValue('staticGtfsSource') }}</dd></div>
          <div v-if="movingSourceValue('movementInterpolation')"><dt>Movement</dt><dd>{{ movingSourceValue('movementInterpolation') }}</dd></div>
          <div v-if="movingSourceValue('replayTimestamp')"><dt>Replay time</dt><dd>{{ formattedDate(String(movingSourceValue('replayTimestamp'))) }}</dd></div>
          <div v-if="movingFeature.properties.interpolated"><dt>Replay state</dt><dd>Interpolated between recorded observations</dd></div>
          <div v-if="movingSourceValue('nextObservationAt') && movingFeature.properties.interpolated"><dt>Next observation</dt><dd>{{ formattedDate(String(movingSourceValue('nextObservationAt'))) }}</dd></div>
          <div v-if="movingSourceValue('agencyName')"><dt>Agency</dt><dd>{{ movingSourceValue('agencyName') }}</dd></div>
          <div v-if="movingSourceValue('scheduleSource')"><dt>Schedule source</dt><dd>{{ movingSourceValue('scheduleSource') }}</dd></div>
          <div v-if="movingSourceValue('currentStatus')"><dt>Status</dt><dd>{{ movingSourceValue('currentStatus') }}</dd></div>
          <div v-if="movingSourceValue('occupancyStatus')"><dt>Occupancy</dt><dd>{{ movingSourceValue('occupancyStatus') }}</dd></div>
          <div v-if="movingSourceValue('startDate')"><dt>Start date</dt><dd>{{ movingSourceValue('startDate') }}</dd></div>
        </dl>
      </section>
    </template>

    <template v-else-if="transitStop">
      <header class="details-header">
        <p class="eyebrow">Bus Stop</p>
        <h2>{{ transitStop.properties.name }}</h2>
        <div class="details-meta">
          <span>{{ transitStop.properties.providerName }}</span>
          <span>{{ transitStop.properties.stopId }}</span>
        </div>
      </header>
      <dl class="details-section">
        <div><dt>Provider</dt><dd>{{ transitStop.properties.providerName }}</dd></div>
        <div><dt>Stop ID</dt><dd>{{ transitStop.properties.stopId }}</dd></div>
        <div><dt>Name</dt><dd>{{ transitStop.properties.name }}</dd></div>
        <div><dt>Coordinates</dt><dd>{{ transitStop.geometry.coordinates[1].toFixed(4) }}, {{ transitStop.geometry.coordinates[0].toFixed(4) }}</dd></div>
      </dl>
      <section class="provider-detail-block details-section">
        <h3>Next Services</h3>
        <p v-if="stopArrivals.loading" class="description">Calculating stop arrivals.</p>
        <p v-else-if="stopArrivals.error" class="description">Arrivals unavailable: {{ stopArrivals.error }}</p>
        <p v-else-if="!stopArrivals.arrivals.length" class="description">No scheduled services found for this stop.</p>
        <div v-else class="arrival-list">
          <button
            v-for="arrival in stopArrivals.arrivals"
            :key="`${arrival.routeId}:${arrival.directionId ?? ''}:${arrival.headsign ?? ''}:${arrival.tripId}`"
            class="arrival-item"
            type="button"
            :disabled="!arrival.vehicleFeatureId"
            @click="arrival.vehicleFeatureId && emit('selectMoving', arrival.vehicleFeatureId)"
          >
            <span>
              <strong>{{ routeDirectionLabel(arrival.routeShortName ?? arrival.routeId, arrival.headsign) }}</strong>
              <small>{{ arrival.predictionSource === 'atlas' ? 'AtlasOps estimate' : arrival.predictionSource === 'provider' ? 'NTA realtime' : 'Schedule only' }}<template v-if="arrival.confidence"> · {{ arrival.confidence }} confidence</template></small>
            </span>
            <span>
              <strong>{{ formatDuration(arrival.displayArrival ? Math.max(0, (Date.parse(arrival.displayArrival) - Date.now()) / 1000) : undefined) }}</strong>
              <small>{{ formatTime(arrival.displayArrival) }}</small>
            </span>
          </button>
        </div>
      </section>
      <section class="provider-detail-block details-section">
        <h3>GTFS Static</h3>
        <dl>
          <div><dt>Source</dt><dd>{{ transitStopSourceValue('source') }}</dd></div>
        </dl>
      </section>
    </template>

    <template v-else-if="incident">
      <header class="details-header">
        <p class="eyebrow">Incident</p>
        <h2>{{ incident.properties.title }}</h2>
        <div class="details-meta">
          <span>{{ incident.properties.providerName }}</span>
          <span>{{ incident.properties.type.replaceAll('-', ' ') }}</span>
        </div>
        <span :class="['severity-badge', severityClass(incident.properties.severity)]">{{ incident.properties.severity }}</span>
      </header>
      <dl class="details-section">
        <div><dt>Provider</dt><dd>{{ incident.properties.providerName }}</dd></div>
        <div><dt>Source</dt><dd>{{ incident.properties.source }}</dd></div>
        <div><dt>Severity</dt><dd>{{ incident.properties.severity }}</dd></div>
        <div><dt>Status</dt><dd>{{ incident.properties.status }}</dd></div>
        <div><dt>Started</dt><dd>{{ formattedDate(incident.properties.startedAt) }}</dd></div>
        <div v-if="incident.properties.endedAt"><dt>Ended</dt><dd>{{ formattedDate(incident.properties.endedAt) }}</dd></div>
        <div v-if="incident.properties.lastUpdatedAt"><dt>Updated</dt><dd>{{ relativeAge(incident.properties.lastUpdatedAt) }}</dd></div>
      </dl>

      <p v-if="incident.properties.description" class="description">{{ incident.properties.description }}</p>

      <section class="provider-detail-block details-section">
        <h3>{{ incident.properties.type.replaceAll('-', ' ') }}</h3>
        <dl>
          <div v-if="incident.properties.type === 'bathing-water-restriction'"><dt>Restriction</dt><dd>{{ incidentSourceValue('restrictionType') }}</dd></div>
          <div v-if="incident.properties.type === 'service-alert'"><dt>Effect</dt><dd>{{ incidentSourceValue('effect') }}</dd></div>
          <div v-if="incident.properties.type === 'service-alert'"><dt>Cause</dt><dd>{{ incidentSourceValue('cause') }}</dd></div>
          <div v-if="incidentSourceValue('stopName')"><dt>Stop</dt><dd>{{ incidentSourceValue('stopName') }}</dd></div>
          <div v-if="incidentSourceValue('geometrySource')"><dt>Geometry</dt><dd>{{ incidentSourceValue('geometrySource') }}</dd></div>
          <div v-if="incidentSourceValue('localAuthority')"><dt>Authority</dt><dd>{{ incidentSourceValue('localAuthority') }}</dd></div>
          <div v-if="incidentSourceValue('county')"><dt>County</dt><dd>{{ incidentSourceValue('county') }}</dd></div>
          <div v-if="incidentSourceValue('annualClassification')"><dt>Annual class</dt><dd>{{ incidentSourceValue('annualClassification') }}</dd></div>
          <div v-if="incident.properties.relatedAssetIds?.length"><dt>Related assets</dt><dd>{{ incident.properties.relatedAssetIds.length }}</dd></div>
        </dl>
        <a
          v-if="incidentSourceValue('noticePdf')"
          class="detail-link"
          :href="String(incidentSourceValue('noticePdf'))"
          target="_blank"
          rel="noreferrer"
        >
          Provider notice
        </a>
        <a
          v-if="incidentSourceValue('url')"
          class="detail-link"
          :href="String(incidentSourceValue('url'))"
          target="_blank"
          rel="noreferrer"
        >
          Provider alert
        </a>
      </section>
    </template>

    <template v-else-if="feature">
      <header class="details-header">
        <p class="eyebrow">{{ feature.properties.assetType.replace('-', ' ') }}</p>
        <h2>{{ feature.properties.name }}</h2>
        <div class="details-meta">
          <span>{{ feature.properties.providerName }}</span>
          <span>{{ feature.properties.assetType.replace('-', ' ') }}</span>
        </div>
        <span :class="['status-badge', badgeClass(feature.properties.status)]">{{ feature.properties.status }}</span>
      </header>
      <dl class="details-section">
        <div><dt>Provider</dt><dd>{{ feature.properties.providerName }}</dd></div>
        <div><dt>Sensor Type</dt><dd>{{ feature.properties.assetType.replace('-', ' ') }}</dd></div>
        <div><dt>Status</dt><dd>{{ feature.properties.status }}</dd></div>
        <div><dt>Observed</dt><dd>{{ formattedObservedAt() }}</dd></div>
        <div><dt>Freshness</dt><dd>{{ relativeAge(feature.properties.observedAt) }}</dd></div>
        <div><dt>Coordinates</dt><dd>{{ feature.geometry.coordinates[1].toFixed(4) }}, {{ feature.geometry.coordinates[0].toFixed(4) }}</dd></div>
      </dl>

      <TelemetrySummary :readings="feature.properties.latestTelemetry ?? []" />

      <section v-if="feature.properties.provider === 'opw-water'" class="provider-detail-block details-section">
        <h3>Gauge Reading</h3>
        <dl>
          <div><dt>Station Ref</dt><dd>{{ sourceValue('stationRef') }}</dd></div>
          <div><dt>Sensor Ref</dt><dd>{{ sourceValue('sensorRef') }}</dd></div>
          <div><dt>Water Level</dt><dd>{{ feature.properties.value ?? 'Unknown' }} {{ feature.properties.unit }}</dd></div>
          <div><dt>Sensor Health</dt><dd>{{ feature.properties.stale ? 'Stale observation' : 'Recent observation' }}</dd></div>
        </dl>
      </section>

      <section v-if="feature.properties.provider === 'dublin-bikes'" class="provider-detail-block details-section">
        <h3>Station Availability</h3>
        <dl>
          <div><dt>Station ID</dt><dd>{{ sourceValue('stationId') }}</dd></div>
          <div><dt>Bikes</dt><dd>{{ sourceValue('availableBikes') }}</dd></div>
          <div><dt>Docks</dt><dd>{{ sourceValue('availableDocks') }}</dd></div>
          <div><dt>Capacity</dt><dd>{{ sourceValue('capacity') }}</dd></div>
          <div><dt>Renting</dt><dd>{{ sourceValue('renting') ? 'Yes' : 'No' }}</dd></div>
          <div><dt>Returning</dt><dd>{{ sourceValue('returning') ? 'Yes' : 'No' }}</dd></div>
        </dl>
      </section>

      <section v-if="telemetry.availableMetrics.value.length" class="provider-detail-block details-section">
        <div class="section-heading">
          <h3>History</h3>
          <TelemetryRangeSelector
            :range="telemetry.range.value"
            :ranges="telemetry.availableRanges.value"
            @select="telemetry.range.value = $event"
          />
        </div>
        <TelemetryMetricSelector
          :metrics="telemetry.availableMetrics.value"
          :selected-metric="telemetry.selectedMetric.value"
          @select="telemetry.selectedMetric.value = $event"
        />
        <TelemetryChart
          :metric="telemetry.selectedMetric.value"
          :state="telemetry.state.value"
        />
      </section>
    </template>

    <template v-else>
      <header class="details-header">
        <p class="eyebrow">Selection</p>
        <h2>Choose a live feature</h2>
      </header>
      <p class="description">Assets and incidents share one AtlasOps selection model and details surface.</p>
    </template>
  </aside>
</template>
