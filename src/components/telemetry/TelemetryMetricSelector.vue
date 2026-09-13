<script setup lang="ts">
import type { TelemetryMetric } from '../../data/telemetry.types'

defineProps<{
  metrics: TelemetryMetric[]
  selectedMetric: TelemetryMetric | null
}>()

const emit = defineEmits<{
  select: [metric: TelemetryMetric]
}>()
</script>

<template>
  <div class="segmented-control" aria-label="Telemetry metric">
    <button
      v-for="metric in metrics"
      :key="metric.id"
      type="button"
      :class="{ active: selectedMetric?.id === metric.id }"
      @click="emit('select', metric)"
    >
      {{ metric.label }}
    </button>
  </div>
</template>
