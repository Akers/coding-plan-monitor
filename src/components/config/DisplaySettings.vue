<template>
  <div class="display-settings">
    <div class="form-group">
      <label>一级阈值</label>
      <input
        type="number"
        :value="config.threshold1"
        min="0"
        max="100"
        @input="emit('update:threshold1', Number(($event.target as HTMLInputElement).value))"
      />
    </div>

    <div class="form-group">
      <label>二级阈值</label>
      <input
        type="number"
        :value="config.threshold2"
        min="0"
        max="100"
        @input="emit('update:threshold2', Number(($event.target as HTMLInputElement).value))"
      />
    </div>

    <div class="form-group">
      <label>低使用量颜色</label>
      <input
        type="color"
        :value="config.thresholdColor1"
        @input="emit('update:thresholdColor1', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="form-group">
      <label>中等使用量颜色</label>
      <input
        type="color"
        :value="config.thresholdColor2"
        @input="emit('update:thresholdColor2', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="form-group">
      <label>高使用量颜色</label>
      <input
        type="color"
        :value="config.thresholdColor3"
        @input="emit('update:thresholdColor3', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="form-group">
      <label>启用限额提醒</label>
      <input
        type="checkbox"
        :checked="config.alertEnabled"
        @change="emit('update:alertEnabled', ($event.target as HTMLInputElement).checked)"
      />
    </div>

    <div class="form-group" v-if="config.alertEnabled">
      <label>提醒阈值</label>
      <input
        type="number"
        :value="config.alertThreshold"
        min="0"
        max="100"
        @input="emit('update:alertThreshold', Number(($event.target as HTMLInputElement).value))"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AppConfig } from '@/types/data-model'

defineProps<{
  config: AppConfig
}>()

const emit = defineEmits<{
  'update:threshold1': [value: number]
  'update:threshold2': [value: number]
  'update:thresholdColor1': [value: string]
  'update:thresholdColor2': [value: string]
  'update:thresholdColor3': [value: string]
  'update:alertEnabled': [value: boolean]
  'update:alertThreshold': [value: number]
}>()
</script>

<style scoped>
.display-settings {
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

.form-group input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}
</style>
