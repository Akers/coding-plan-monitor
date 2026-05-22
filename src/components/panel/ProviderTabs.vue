<template>
  <div class="provider-tabs">
    <button
      v-if="providers.length > 1"
      class="tab-arrow tab-arrow-prev"
      @click="$emit('prev')"
    >
      ◀
    </button>
    <div class="tab-list">
      <button
        v-for="(id, index) in providers"
        :key="id"
        class="provider-tab"
        :class="{ active: index === currentIndex }"
        @click="$emit('select', index)"
      >
        {{ providerNames[id] || id }}
      </button>
    </div>
    <button
      v-if="providers.length > 1"
      class="tab-arrow tab-arrow-next"
      @click="$emit('next')"
    >
      ▶
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ProviderId } from '@/types/data-model'

defineProps<{
  providers: ProviderId[]
  currentIndex: number
  providerNames: Record<ProviderId, string>
}>()

defineEmits<{
  prev: []
  next: []
  select: [index: number]
}>()
</script>

<style scoped>
.provider-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
}

.tab-list {
  display: flex;
  flex: 1;
  justify-content: center;
  gap: 2px;
  overflow: hidden;
}

.provider-tab {
  padding: 2px 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #888;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.provider-tab.active {
  background: #555;
  color: #fff;
}

.provider-tab:hover {
  background: #444;
  color: #ccc;
}

.tab-arrow {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 10px;
  padding: 2px 4px;
}

.tab-arrow:hover {
  color: #ccc;
}
</style>
