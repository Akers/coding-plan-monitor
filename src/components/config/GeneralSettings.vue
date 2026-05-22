<template>
  <div class="general-settings">
    <div class="form-group">
      <label>刷新间隔（秒）</label>
      <input
        type="number"
        :value="config.refreshInterval"
        min="5"
        max="300"
        @input="emit('update:refreshInterval', Number(($event.target as HTMLInputElement).value))"
      />
    </div>

    <div class="form-group">
      <label>轮播间隔（秒）</label>
      <input
        type="number"
        :value="config.carouselInterval"
        min="3"
        max="60"
        @input="emit('update:carouselInterval', Number(($event.target as HTMLInputElement).value))"
      />
    </div>

    <div class="form-group">
      <label>面板背景色</label>
      <input
        type="color"
        :value="config.panelBgColor"
        @input="emit('update:panelBgColor', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="form-group">
      <label>面板透明度</label>
      <input
        type="range"
        :value="config.panelOpacity"
        min="0"
        max="1"
        step="0.05"
        @input="emit('update:panelOpacity', Number(($event.target as HTMLInputElement).value))"
      />
      <span class="opacity-value">{{ Math.round(config.panelOpacity * 100) }}%</span>
    </div>

    <div class="form-group">
      <label>吸附边</label>
      <select
        :value="config.panelEdge"
        @change="emit('update:panelEdge', ($event.target as HTMLSelectElement).value as PanelEdge)"
      >
        <option value="top">顶部</option>
        <option value="bottom">底部</option>
        <option value="left">左侧</option>
        <option value="right">右侧</option>
      </select>
    </div>

    <div class="form-group">
      <label>锁定面板</label>
      <input
        type="checkbox"
        :checked="config.panelLocked"
        @change="emit('update:panelLocked', ($event.target as HTMLInputElement).checked)"
      />
    </div>

    <div class="form-group">
      <label>开机自启动</label>
      <input
        type="checkbox"
        :checked="config.autoStart"
        @change="emit('update:autoStart', ($event.target as HTMLInputElement).checked)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AppConfig, PanelEdge } from '@/types/data-model'

defineProps<{
  config: AppConfig
}>()

const emit = defineEmits<{
  'update:refreshInterval': [value: number]
  'update:carouselInterval': [value: number]
  'update:panelBgColor': [value: string]
  'update:panelOpacity': [value: number]
  'update:panelEdge': [value: PanelEdge]
  'update:panelLocked': [value: boolean]
  'update:autoStart': [value: boolean]
}>()
</script>

<style scoped>
.general-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-group label {
  min-width: 120px;
  font-size: 14px;
}

.form-group input[type="number"] {
  width: 100px;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.form-group input[type="color"] {
  width: 60px;
  height: 30px;
  padding: 0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.form-group input[type="range"] {
  flex: 1;
  max-width: 200px;
}

.form-group select {
  flex: 1;
  max-width: 200px;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.form-group input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.opacity-value {
  min-width: 45px;
  font-size: 14px;
  color: #666;
}
</style>
