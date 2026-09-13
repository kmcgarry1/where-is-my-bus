<script setup lang="ts">
import type { TelemetryReading } from '../../data/telemetry.types'
import TelemetryFreshness from './TelemetryFreshness.vue'

defineProps<{
  readings: TelemetryReading[]
}>()

function formatValue(reading: TelemetryReading) {
  return reading.value === null ? 'No value' : `${reading.value.toFixed(1)} ${reading.unit ?? ''}`.trim()
}

function labelForMetric(metric: string) {
  const labels: Record<string, string> = {
    'noise-laeq': 'Noise LAeq',
    'noise-lafmax': 'Noise LAFmax',
    pm2_5: 'PM2.5',
    pm10: 'PM10',
    no2: 'NO2',
    o3: 'O3',
    'water-level': 'Water level',
  }
  return labels[metric] ?? metric
}

function conditionLabel(reading: TelemetryReading) {
  return reading.condition && reading.condition !== 'unknown' ? reading.condition : null
}
</script>

<template>
  <section v-if="readings.length" class="telemetry-summary">
    <h3>Current Measurements</h3>
    <div class="telemetry-cards">
      <article v-for="reading in readings" :key="reading.metric">
        <strong>{{ labelForMetric(reading.metric) }}</strong>
        <span>{{ formatValue(reading) }}</span>
        <small v-if="conditionLabel(reading)">Condition {{ conditionLabel(reading) }}</small>
        <small>Observed <TelemetryFreshness :observed-at="reading.observedAt" /></small>
      </article>
    </div>
  </section>
</template>
