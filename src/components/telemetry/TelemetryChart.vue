<script setup lang="ts">
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { TelemetryMetric, TelemetryQueryState } from '../../data/telemetry.types'

const props = defineProps<{
  metric: TelemetryMetric | null
  state: TelemetryQueryState
}>()

const chartElement = ref<HTMLDivElement | null>(null)
let chart: uPlot | null = null
let resizeObserver: ResizeObserver | null = null

const validReadings = computed(() => props.state.readings.filter((reading) => typeof reading.value === 'number'))
const summary = computed(() => {
  const values = validReadings.value.map((reading) => reading.value as number)
  if (!values.length) return null
  const sum = values.reduce((total, value) => total + value, 0)
  return {
    average: sum / values.length,
    minimum: Math.min(...values),
    maximum: Math.max(...values),
  }
})

watch(() => [props.state.status, props.state.readings, props.metric], renderChart, {
  deep: true,
  flush: 'post',
  immediate: true,
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chart?.destroy()
})

function renderChart() {
  if (props.state.status !== 'success' || !props.metric || !chartElement.value) {
    chart?.destroy()
    chart = null
    return
  }

  void nextTick(() => {
    if (!chartElement.value || !props.metric) return
    const width = chartElement.value.clientWidth || 300
    const height = 220
    const data = chartData()

    chart?.destroy()
    chart = new uPlot({
      width,
      height,
      class: 'atlas-chart',
      scales: { x: { time: true } },
      axes: [
        { stroke: '#aab8bd', grid: { stroke: 'rgba(229, 236, 239, 0.08)' } },
        { stroke: '#aab8bd', grid: { stroke: 'rgba(229, 236, 239, 0.08)' }, label: props.metric.unit },
      ],
      series: [
        {},
        {
          label: props.metric.label,
          stroke: '#83d4c8',
          width: 2,
          points: { show: true, size: 5, stroke: '#f5f1e8', fill: '#83d4c8' },
          spanGaps: false,
          value: (_self, value) => value == null ? '-' : `${value.toFixed(props.metric?.decimals ?? 1)} ${props.metric?.unit ?? ''}`.trim(),
        },
      ],
    }, data, chartElement.value)

    resizeObserver?.disconnect()
    resizeObserver = new ResizeObserver(() => {
      if (chartElement.value && chart) chart.setSize({ width: chartElement.value.clientWidth || width, height })
    })
    resizeObserver.observe(chartElement.value)
  })
}

function chartData(): uPlot.AlignedData {
  const points = validReadings.value
    .map((reading) => ({ time: Date.parse(reading.observedAt) / 1000, value: reading.value as number }))
    .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.value))
    .sort((a, b) => a.time - b.time)

  if (points.length < 3) return [points.map((point) => point.time), points.map((point) => point.value)]

  const intervals = points
    .slice(1)
    .map((point, index) => point.time - points[index].time)
    .filter((interval) => interval > 0)
    .sort((a, b) => a - b)
  const medianInterval = intervals[Math.floor(intervals.length / 2)] ?? 0
  const maxGap = medianInterval > 0 ? medianInterval * 2.5 : Number.POSITIVE_INFINITY
  const times: number[] = []
  const values: Array<number | null> = []

  points.forEach((point, index) => {
    const previous = points[index - 1]
    if (previous && point.time - previous.time > maxGap) {
      times.push(previous.time + medianInterval, point.time - medianInterval)
      values.push(null, null)
    }
    times.push(point.time)
    values.push(point.value)
  })

  return [times, values]
}
</script>

<template>
  <section class="telemetry-history">
    <div v-if="state.status === 'loading'" class="chart-state loading-state">Loading historical readings</div>
    <div v-else-if="state.status === 'error'" class="chart-state error-state">
      <strong>Historical readings unavailable</strong>
      <span>{{ state.error }}</span>
    </div>
    <div v-else-if="state.status === 'empty'" class="chart-state">No readings available for this period.</div>
    <div v-else ref="chartElement" class="chart-surface" />

    <div v-if="summary && metric" class="telemetry-stats">
      <span>Average {{ summary.average.toFixed(metric.decimals ?? 1) }} {{ metric.unit }}</span>
      <span>Min {{ summary.minimum.toFixed(metric.decimals ?? 1) }} {{ metric.unit }}</span>
      <span>Max {{ summary.maximum.toFixed(metric.decimals ?? 1) }} {{ metric.unit }}</span>
    </div>
  </section>
</template>
