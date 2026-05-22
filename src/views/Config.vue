<template>
  <div class="config-window">
    <div class="tab-header">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tab-content">
      <GeneralSettings
        v-if="activeTab === 'general'"
        :config="configStore.config"
        @update:refresh-interval="(v) => updateField('refreshInterval', v)"
        @update:carousel-interval="(v) => updateField('carouselInterval', v)"
        @update:panel-bg-color="(v) => updateField('panelBgColor', v)"
        @update:panel-opacity="(v) => updateField('panelOpacity', v)"
        @update:panel-edge="(v) => updateField('panelEdge', v)"
        @update:panel-locked="(v) => updateField('panelLocked', v)"
        @update:auto-start="(v) => updateField('autoStart', v)"
      />
      <DisplaySettings
        v-if="activeTab === 'display'"
        :config="configStore.config"
        @update:threshold1="(v) => updateField('threshold1', v)"
        @update:threshold2="(v) => updateField('threshold2', v)"
        @update:threshold-color1="(v) => updateField('thresholdColor1', v)"
        @update:threshold-color2="(v) => updateField('thresholdColor2', v)"
        @update:threshold-color3="(v) => updateField('thresholdColor3', v)"
        @update:alert-enabled="(v) => updateField('alertEnabled', v)"
        @update:alert-threshold="(v) => updateField('alertThreshold', v)"
      />
      <ProviderSettings
        v-if="activeTab === 'providers'"
        :providers="configStore.config.providers"
        @toggle-provider="toggleProvider"
        @update-api-key="updateApiKey"
        @start-o-auth="startOAuth"
        @validate-provider="validateProvider"
      />
    </div>
    <div class="tab-footer">
      <button class="btn-save" @click="save" :disabled="!configStore.dirty">保存</button>
      <button class="btn-cancel" @click="cancel">取消</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { emit as tauriEmit } from '@tauri-apps/api/event'
import { useConfigStore } from '@/stores/config'
import { PROVIDER_IDS, type ProviderId, type ProviderConfig } from '@/types/data-model'
import { startOAuth as startOAuthService, stopOAuth, onOAuthCallback, openOAuthUrl } from '@/services/oauth'
import { createProviderRegistry } from '@/providers/registry'
import { ZhipuAdapter } from '@/providers/zhipu'
import { MiniMaxAdapter } from '@/providers/minimax'
import { VolcengineAdapter } from '@/providers/volcengine'
import GeneralSettings from '@/components/config/GeneralSettings.vue'
import DisplaySettings from '@/components/config/DisplaySettings.vue'
import ProviderSettings from '@/components/config/ProviderSettings.vue'

const configStore = useConfigStore()

const activeTab = ref<'general' | 'display' | 'providers'>('general')

const tabs = [
  { key: 'general', label: '通用设置' },
  { key: 'display', label: '显示设置' },
  { key: 'providers', label: '供应商' },
] as const

onMounted(async () => {
  await configStore.loadConfig()
  ensureProviders()
})

function ensureProviders(): void {
  const existingIds = configStore.config.providers.map((p) => p.providerId)
  const defaultAuthTypes: Record<ProviderId, 'apikey' | 'oauth'> = {
    zhipu: 'oauth',
    minimax: 'apikey',
    volcengine: 'oauth',
  }

  for (const id of PROVIDER_IDS) {
    if (!existingIds.includes(id)) {
      configStore.config.providers.push({
        providerId: id,
        enabled: false,
        authType: defaultAuthTypes[id],
      })
    }
  }
}

function updateField(field: string, value: unknown): void {
  configStore.updateConfig({ [field]: value })
}

function toggleProvider(id: ProviderId): void {
  const provider = configStore.config.providers.find((p) => p.providerId === id)
  if (provider) {
    provider.enabled = !provider.enabled
    configStore.updateConfig({ providers: [...configStore.config.providers] })
  }
}

function updateApiKey(id: ProviderId, key: string): void {
  const provider = configStore.config.providers.find((p) => p.providerId === id)
  if (provider) {
    provider.apiKey = key
    configStore.updateConfig({ providers: [...configStore.config.providers] })
  }
}

// OAuth 回调 URL 映射（按供应商配置）
const OAUTH_URLS: Record<string, string> = {
  zhipu: 'https://open.bigmodel.cn/user/api/paas/token',
  volcengine: 'https://console.volcengine.com/iam/keymanage',
}

async function startOAuth(id: ProviderId): Promise<void> {
  const port = 9527 // 固定端口
  try {
    await startOAuthService(id, port)
    const unlisten = await onOAuthCallback((data) => {
      if (data.provider_id === id) {
        // 更新供应商 token
        const provider = configStore.config.providers.find((p) => p.providerId === id)
        if (provider) {
          provider.apiKey = data.token
          configStore.updateConfig({ providers: [...configStore.config.providers] })
        }
        stopOAuth()
        unlisten()
      }
    })
    // 打开浏览器授权页面
    const url = OAUTH_URLS[id]
    if (url) {
      await openOAuthUrl(url)
    }
  } catch (e) {
    console.error('OAuth failed:', e)
  }
}

async function validateProvider(id: ProviderId): Promise<void> {
  const provider = configStore.config.providers.find((p) => p.providerId === id)
  if (!provider) return

  // 构建临时 registry 验证
  const registry = createProviderRegistry()
  registry.register(new ZhipuAdapter())
  registry.register(new MiniMaxAdapter())
  registry.register(new VolcengineAdapter())

  const adapter = registry.get(id)
  if (!adapter) return

  const valid = adapter.validateConfig(provider)
  if (valid) {
    try {
      const info = await adapter.fetchUsage(provider)
      alert(`${provider.providerId} 验证成功`)
    } catch (e) {
      alert(`验证失败: ${e}`)
    }
  } else {
    alert('配置无效，请检查 API Key 或授权状态')
  }
}

async function save(): Promise<void> {
  await configStore.saveConfig()
  await tauriEmit('config-saved', configStore.config)
}

function cancel(): void {
  configStore.cancelChanges()
}
</script>

<style scoped>
.config-window {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #fff;
}

.tab-header {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  background: #f5f5f5;
}

.tab-btn {
  padding: 12px 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border-bottom: 2px solid transparent;
}

.tab-btn:hover {
  color: #1976d2;
}

.tab-btn.active {
  color: #1976d2;
  border-bottom-color: #1976d2;
  background: #fff;
}

.tab-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.tab-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid #e0e0e0;
  background: #f5f5f5;
}

.btn-save,
.btn-cancel {
  padding: 8px 24px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.btn-save {
  background: #1976d2;
  color: white;
  border: none;
}

.btn-save:hover:not(:disabled) {
  background: #1565c0;
}

.btn-save:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-cancel {
  background: #fff;
  color: #666;
  border: 1px solid #ccc;
}

.btn-cancel:hover {
  background: #f0f0f0;
}
</style>
