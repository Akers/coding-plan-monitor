<template>
  <div
    ref="panelRef"
    class="panel-container"
    :style="{
      backgroundColor: configStore.config.panelBgColor,
      opacity: configStore.config.panelOpacity,
    }"
    @mousedown="onDragStart"
    @contextmenu.prevent="onContextMenu"
  >
    <!-- 供应商标签栏 -->
    <ProviderTabs
      v-if="usageStore.enabledProviders.length > 0"
      :providers="usageStore.enabledProviders"
      :current-index="usageStore.currentProviderIndex"
      :provider-names="providerNames"
      @prev="usageStore.prevProvider()"
      @next="usageStore.nextProvider()"
      @select="usageStore.setProviderIndex($event)"
    />

    <!-- 错误提示 -->
    <ErrorOverlay
      v-if="currentError"
      :error="currentError"
      @reauth="onReauth"
    />

    <!-- 额度维度列表 -->
    <div v-if="currentMetrics.length > 0" class="metrics-list">
      <UsageBar
        v-for="(metric, i) in currentMetrics"
        :key="i"
        :metric="metric"
        :threshold1="configStore.config.threshold1"
        :threshold2="configStore.config.threshold2"
        :color1="configStore.config.thresholdColor1"
        :color2="configStore.config.thresholdColor2"
        :color3="configStore.config.thresholdColor3"
      />
    </div>

    <!-- 附加信息 -->
    <div v-if="currentExtraInfo" class="extra-info">
      {{ currentExtraInfo }}
    </div>

    <!-- 空状态 -->
    <div v-if="usageStore.enabledProviders.length === 0" class="empty-state">
      请在设置中添加供应商
    </div>

    <!-- 底部信息栏 -->
    <PanelFooter
      :refresh-time-text="usageStore.timeSinceLastRefresh"
      :locked="configStore.config.panelLocked"
      :can-minimize="snapped"
      @minimize="onMinimize"
      @toggle-lock="onToggleLock"
      @open-config="onOpenConfig"
    />

    <!-- 右键菜单 -->
    <div
      v-if="contextMenuVisible"
      class="context-menu"
      :style="{ left: contextMenuPos.x + 'px', top: contextMenuPos.y + 'px' }"
    >
      <div class="context-menu-item" @click="onManualRefresh">刷新</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useConfigStore } from '@/stores/config'
import { useUsageStore } from '@/stores/usage'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { startDrag, snapPanelToEdge, isNearEdge, getPanelPosition, getScreenSize, setPanelSize } from '@/services/panel'
import { startRefreshScheduler, stopRefreshScheduler, restartRefreshScheduler } from '@/services/refresh'
import { createProviderRegistry } from '@/providers/registry'
import { ZhipuAdapter } from '@/providers/zhipu'
import { MiniMaxAdapter } from '@/providers/minimax'
import { VolcengineAdapter } from '@/providers/volcengine'
import ProviderTabs from '@/components/panel/ProviderTabs.vue'
import UsageBar from '@/components/panel/UsageBar.vue'
import PanelFooter from '@/components/panel/PanelFooter.vue'
import ErrorOverlay from '@/components/panel/ErrorOverlay.vue'
import type { ProviderId } from '@/types/data-model'

const configStore = useConfigStore()
const usageStore = useUsageStore()

/** 供应商显示名称映射 */
const providerNames: Record<ProviderId, string> = {
  minimax: 'MiniMax',
  zhipu: '智谱',
  volcengine: '火山',
}

// ============================================================
// Refs
// ============================================================

/** 面板容器 DOM 引用 */
const panelRef = ref<HTMLElement | null>(null)

/** 当前面板窗口高度（px） */
const currentPanelHeight = ref(200)

/** 最小面板高度 */
const MIN_PANEL_HEIGHT = 200

/** 最大面板高度 */
const MAX_PANEL_HEIGHT = 500

// ============================================================
// Computed
// ============================================================

/** 当前供应商的 metrics 列表 */
const currentMetrics = computed(() => {
  return usageStore.currentUsage?.metrics ?? []
})

/** 当前供应商的附加信息 */
const currentExtraInfo = computed(() => {
  return usageStore.currentUsage?.extraInfo ?? null
})

/** 当前供应商的错误信息 */
const currentError = computed(() => {
  return usageStore.currentUsage?.error ?? null
})

/** 是否已吸附到边缘 */
const snapped = ref(false)

/** 右键菜单可见性 */
const contextMenuVisible = ref(false)

/** 右键菜单位置 */
const contextMenuPos = ref({ x: 0, y: 0 })

// ============================================================
// Actions
// ============================================================

/** 高度防抖定时器 */
let heightDebounceTimer: ReturnType<typeof setTimeout> | null = null

/** 根据内容实际高度调整窗口大小 */
function updatePanelHeight() {
  if (!panelRef.value) return
  const el = panelRef.value
  // scrollHeight 是内容实际高度
  const contentHeight = el.scrollHeight
  const newHeight = Math.min(MAX_PANEL_HEIGHT, Math.max(MIN_PANEL_HEIGHT, contentHeight))
  // 仅当高度变化 ≥ 5px 时才调整
  if (Math.abs(newHeight - currentPanelHeight.value) >= 5) {
    currentPanelHeight.value = newHeight
    setPanelSize(320, newHeight).catch(() => {})
  }
}

/** 防抖版高度更新 */
function debouncedUpdatePanelHeight() {
  if (heightDebounceTimer) clearTimeout(heightDebounceTimer)
  heightDebounceTimer = setTimeout(updatePanelHeight, 50)
}

/** 拖拽开始 */
function onDragStart(_e: MouseEvent) {
  if (configStore.config.panelLocked || configStore.config.clickThrough) return
  startDrag()
  // 拖拽结束后检测吸附状态
  document.addEventListener('mouseup', onDragEnd, { once: true })
}

/** 拖拽结束后检测吸附状态 */
function onDragEnd() {
  checkSnapStatus()
}

/** 最小化面板 */
async function onMinimize() {
  try {
    await snapPanelToEdge(320, currentPanelHeight.value, 20)
  } catch {
    // 静默处理
  }
}

/** 切换锁定状态 */
function onToggleLock() {
  configStore.updateConfig({ panelLocked: !configStore.config.panelLocked })
  configStore.saveConfig()
}

/** 打开配置窗口 */
function onOpenConfig() {
  invoke('open_config_window').catch(() => {})
}

/** 重新授权 */
function onReauth() {
  // TODO: 阶段 11 实现 OAuth 流程
}

/** 显示右键菜单 */
function onContextMenu(e: MouseEvent) {
  contextMenuPos.value = { x: e.clientX, y: e.clientY }
  contextMenuVisible.value = true
}

/** 手动刷新 */
function onManualRefresh() {
  contextMenuVisible.value = false
  location.reload()
}

/** 检测面板吸附状态 */
async function checkSnapStatus() {
  try {
    const pos = await getPanelPosition()
    const screen = await getScreenSize()
    const panelSize = { width: 320, height: currentPanelHeight.value }
    const near = isNearEdge(pos, screen, panelSize, 20)
    snapped.value = near.nearLeft || near.nearRight || near.nearTop || near.nearBottom
  } catch {
    snapped.value = false
  }
}

// ============================================================
// 生命周期
// ============================================================

let unlistenConfigSaved: (() => void) | null = null

/** 供应商注册表实例 */
let registry: ReturnType<typeof createProviderRegistry> | null = null

/** ResizeObserver 实例 */
let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  // 初始化 ResizeObserver 监听面板内容高度变化
  if (panelRef.value) {
    resizeObserver = new ResizeObserver(() => {
      debouncedUpdatePanelHeight()
    })
    resizeObserver.observe(panelRef.value)
  }
  // 加载配置
  await configStore.loadConfig()

  // 从配置中提取启用的供应商列表
  const enabled = configStore.config.providers
    .filter((p) => p.enabled)
    .map((p) => p.providerId)
  usageStore.setEnabledProviders(enabled)

  // 初始化供应商注册表并启动刷新调度器
  registry = createProviderRegistry()
  registry.register(new ZhipuAdapter())
  registry.register(new MiniMaxAdapter())
  registry.register(new VolcengineAdapter())
  startRefreshScheduler(registry, configStore, usageStore)

  // 检测初始吸附状态
  await checkSnapStatus()

  // 监听配置保存事件，重新加载配置并重启刷新调度器
  unlistenConfigSaved = await listen('config-saved', () => {
    configStore.loadConfig().then(() => {
      const enabled = configStore.config.providers
        .filter((p) => p.enabled)
        .map((p) => p.providerId)
      usageStore.setEnabledProviders(enabled)

      // 配置变更后重启刷新调度器
      if (registry) {
        restartRefreshScheduler(registry, configStore, usageStore)
      }
    })
  })
})

// 监听内容变化时调整面板高度
watch([currentMetrics, currentError, currentExtraInfo], () => {
  nextTick(() => updatePanelHeight())
})

onUnmounted(() => {
  if (unlistenConfigSaved) {
    unlistenConfigSaved()
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (heightDebounceTimer) {
    clearTimeout(heightDebounceTimer)
  }
  // 停止刷新调度器
  stopRefreshScheduler()
  document.removeEventListener('mouseup', onDragEnd)
})
</script>

<style scoped>
.panel-container {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  border-radius: 6px;
  overflow: hidden;
  user-select: none;
  color: #eee;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.metrics-list {
  flex: 1;
  padding: 4px 8px;
}

.extra-info {
  padding: 2px 8px;
  font-size: 10px;
  color: #999;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #888;
}

.context-menu {
  position: fixed;
  background: rgba(40, 40, 40, 0.95);
  border-radius: 4px;
  padding: 4px 0;
  min-width: 100px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.context-menu-item {
  padding: 6px 16px;
  cursor: pointer;
  font-size: 12px;
  color: #eee;
}

.context-menu-item:hover {
  background: rgba(255,255,255,0.1);
}
</style>
