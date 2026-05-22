<template>
  <div class="panel-footer">
    <span class="refresh-time">
      {{ refreshTimeText ?? '尚未刷新' }}
    </span>
    <div class="footer-actions">
      <button
        class="footer-btn btn-minimize"
        :disabled="!canMinimize"
        title="最小化"
        @click="$emit('minimize')"
      >
        ─
      </button>
      <button
        class="footer-btn btn-lock"
        :class="{ locked }"
        title="锁定位置"
        @click="$emit('toggleLock')"
      >
        {{ locked ? '🔒' : '🔓' }}
      </button>
      <button
        class="footer-btn btn-settings"
        title="设置"
        @click="$emit('openConfig')"
      >
        ⚙
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  refreshTimeText: string | null
  locked?: boolean
  canMinimize?: boolean
}>()

defineEmits<{
  minimize: []
  toggleLock: []
  openConfig: []
}>()
</script>

<style scoped>
.panel-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  border-top: 1px solid #444;
}

.refresh-time {
  font-size: 10px;
  color: #888;
}

.footer-actions {
  display: flex;
  gap: 4px;
}

.footer-btn {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 3px;
}

.footer-btn:hover:not(:disabled) {
  background: #444;
  color: #ccc;
}

.footer-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.footer-btn.locked {
  color: #ff9800;
}
</style>
