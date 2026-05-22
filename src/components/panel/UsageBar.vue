<template>
  <div class="usage-bar">
    <div class="usage-bar-header">
      <span class="usage-label">{{ metric.label }}</span>
      <span class="usage-percent">{{ metric.percentage }}%</span>
    </div>
    <div class="usage-bar-track">
      <div
        class="usage-bar-fill"
        :style="{
          width: metric.percentage + '%',
          backgroundColor: barColor,
        }"
      />
    </div>
    <div class="usage-bar-footer">
      <span class="usage-detail">
        {{ metric.usedQuota }}/{{ metric.totalQuota }} {{ metric.unit }}
      </span>
      <span v-if="metric.resetIn != null" class="usage-reset">
        重置 {{ formatCountdown(metric.resetIn) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { UsageMetric } from '@/types/data-model'

const props = withDefaults(
  defineProps<{
    metric: UsageMetric
    threshold1?: number
    threshold2?: number
    color1?: string
    color2?: string
    color3?: string
  }>(),
  {
    threshold1: 50,
    threshold2: 80,
    color1: '#4caf50',
    color2: '#ff9800',
    color3: '#f44336',
  },
)

const barColor = computed(() => {
  const pct = props.metric.percentage
  if (pct >= props.threshold2) return props.color3
  if (pct >= props.threshold1) return props.color2
  return props.color1
})

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}
</script>

<style scoped>
.usage-bar {
  margin: 4px 0;
}

.usage-bar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.usage-label {
  font-size: 12px;
  color: #ccc;
}

.usage-percent {
  font-size: 12px;
  font-weight: bold;
  color: #eee;
}

.usage-bar-track {
  height: 6px;
  background: #555;
  border-radius: 3px;
  overflow: hidden;
}

.usage-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.usage-bar-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 2px;
}

.usage-detail {
  font-size: 10px;
  color: #999;
}

.usage-reset {
  font-size: 10px;
  color: #aaa;
}
</style>
