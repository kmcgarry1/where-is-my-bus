<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { relativeAge } from '../../data/providers/time'

const props = defineProps<{
  observedAt?: string
}>()

const nowTick = ref(0)
const timer = window.setInterval(() => {
  nowTick.value += 1
}, 60 * 1000)

onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <span :title="observedAt">
    {{ nowTick >= 0 ? relativeAge(props.observedAt) : '' }}
  </span>
</template>
