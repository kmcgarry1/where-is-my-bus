<script setup lang="ts">
import type { TelemetryRange } from '../../data/telemetry.types'

defineProps<{
  range: TelemetryRange
  ranges: TelemetryRange[]
}>()

const emit = defineEmits<{
  select: [range: TelemetryRange]
}>()

const rangeOptions: Array<{ value: TelemetryRange; label: string }> = [
  { value: '6h', label: '6H' },
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
]
</script>

<template>
  <div class="segmented-control compact" aria-label="Telemetry range">
    <button
      v-for="item in rangeOptions.filter((option) => ranges.includes(option.value))"
      :key="item.value"
      type="button"
      :class="{ active: range === item.value }"
      @click="emit('select', item.value)"
    >
      {{ item.label }}
    </button>
  </div>
</template>
