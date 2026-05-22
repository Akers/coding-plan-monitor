<template>
  <div class="provider-settings">
    <div
      v-for="provider in providers"
      :key="provider.providerId"
      class="provider-item"
    >
      <div class="provider-header">
        <span class="provider-name">{{ PROVIDER_NAMES[provider.providerId] }}</span>
        <input
          type="checkbox"
          :checked="provider.enabled"
          @change="emit('toggleProvider', provider.providerId)"
        />
      </div>

      <div v-if="provider.enabled" class="provider-config">
        <div v-if="provider.authType === 'apikey'" class="form-group">
          <label>API Key</label>
          <input
            type="password"
            :value="provider.apiKey || ''"
            placeholder="请输入 API Key"
            @input="emit('updateApiKey', provider.providerId, ($event.target as HTMLInputElement).value)"
          />
        </div>

        <div v-if="provider.authType === 'oauth'" class="form-group">
          <button
            class="oauth-btn"
            @click="emit('startOAuth', provider.providerId)"
          >
            {{ provider.token ? '重新授权' : '登录授权' }}
          </button>
          <span v-if="provider.token" class="auth-status">已授权</span>
        </div>

        <div class="form-group">
          <button
            class="validate-btn"
            @click="emit('validateProvider', provider.providerId)"
          >
            验证
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProviderConfig, ProviderId } from '@/types/data-model'

defineProps<{
  providers: ProviderConfig[]
}>()

const PROVIDER_NAMES: Record<string, string> = {
  zhipu: '智谱',
  minimax: 'MiniMax',
  volcengine: '火山',
}

const emit = defineEmits<{
  'toggleProvider': [providerId: ProviderId]
  'updateApiKey': [providerId: ProviderId, apiKey: string]
  'startOAuth': [providerId: ProviderId]
  'validateProvider': [providerId: ProviderId]
}>()
</script>

<style scoped>
.provider-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.provider-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
}

.provider-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.provider-name {
  font-size: 16px;
  font-weight: 500;
  min-width: 80px;
}

.provider-config {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
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
  min-width: 80px;
  font-size: 14px;
}

.form-group input[type="password"] {
  flex: 1;
  max-width: 250px;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.oauth-btn,
.validate-btn {
  padding: 6px 16px;
  border: 1px solid #1976d2;
  background: #1976d2;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.oauth-btn:hover,
.validate-btn:hover {
  background: #1565c0;
}

.auth-status {
  font-size: 14px;
  color: #4caf50;
}
</style>
