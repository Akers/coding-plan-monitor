<template>
  <div v-if="error" class="error-overlay">
    <span class="error-badge">⚠ {{ error }}</span>
    <button
      v-if="isAuthError"
      class="btn-reauth"
      @click="$emit('reauth')"
    >
      重新授权
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  error: string | null
}>()

defineEmits<{
  reauth: []
}>()

const isAuthError = computed(() => {
  if (!props.error) return false
  return props.error.includes('403') || props.error.includes('授权')
})
</script>

<style scoped>
.error-overlay {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(244, 67, 54, 0.15);
  border-radius: 4px;
  margin: 4px 0;
}

.error-badge {
  font-size: 11px;
  color: #f44336;
}

.btn-reauth {
  padding: 2px 8px;
  border: 1px solid #f44336;
  border-radius: 3px;
  background: transparent;
  color: #f44336;
  font-size: 10px;
  cursor: pointer;
}

.btn-reauth:hover {
  background: rgba(244, 67, 54, 0.2);
}
</style>
