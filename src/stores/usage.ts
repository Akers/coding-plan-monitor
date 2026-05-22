import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ProviderId, UsageInfo } from '@/types/data-model'

export const useUsageStore = defineStore('usage', () => {
  // ============================================================
  // State
  // ============================================================

  /** 各供应商额度数据 (providerId -> UsageInfo) */
  const usageMap = ref<Record<string, UsageInfo>>({})

  /** 启用的供应商 ID 列表 */
  const enabledProviders = ref<ProviderId[]>([])

  /** 当前显示的供应商索引（在 enabledProviders 中） */
  const currentProviderIndex = ref(0)

  /** 最后一次成功刷新的时间戳 */
  const lastRefreshTime = ref<number | null>(null)

  // ============================================================
  // Computed
  // ============================================================

  /** 当前供应商 ID */
  const currentProvider = computed<ProviderId | null>(() => {
    if (enabledProviders.value.length === 0) return null
    return enabledProviders.value[currentProviderIndex.value] ?? null
  })

  /** 当前供应商的 UsageInfo */
  const currentUsage = computed<UsageInfo | null>(() => {
    const id = currentProvider.value
    if (!id) return null
    return usageMap.value[id] ?? null
  })

  /** 距上次刷新的时间描述 */
  const timeSinceLastRefresh = computed<string | null>(() => {
    if (lastRefreshTime.value === null) return null
    const diff = Math.floor((Date.now() - lastRefreshTime.value) / 1000)
    if (diff < 60) return `${diff}秒前`
    const minutes = Math.floor(diff / 60)
    if (minutes < 60) return `${minutes}分钟前`
    const hours = Math.floor(minutes / 60)
    return `${hours}小时前`
  })

  // ============================================================
  // Actions
  // ============================================================

  /** 设置启用的供应商列表 */
  function setEnabledProviders(ids: ProviderId[]): void {
    enabledProviders.value = ids
    // 当前索引超出范围时重置
    if (currentProviderIndex.value >= ids.length) {
      currentProviderIndex.value = 0
    }
  }

  /** 更新指定供应商的额度数据 */
  function updateUsage(info: UsageInfo): void {
    const existing = usageMap.value[info.providerId]

    if (info.error && existing && existing.metrics.length > 0) {
      // 失败但有缓存数据：保留缓存 metrics，标记 error
      usageMap.value[info.providerId] = {
        ...existing,
        error: info.error,
        timestamp: info.timestamp,
      }
    } else {
      // 成功 或 无缓存
      usageMap.value[info.providerId] = { ...info }
    }

    // 成功刷新时更新 lastRefreshTime
    if (!info.error) {
      lastRefreshTime.value = Date.now()
    }
  }

  /** 获取指定供应商的 UsageInfo */
  function getUsage(id: ProviderId): UsageInfo | undefined {
    return usageMap.value[id]
  }

  /** 切换到下一个供应商 */
  function nextProvider(): void {
    const len = enabledProviders.value.length
    if (len === 0) return
    currentProviderIndex.value = (currentProviderIndex.value + 1) % len
  }

  /** 切换到上一个供应商 */
  function prevProvider(): void {
    const len = enabledProviders.value.length
    if (len === 0) return
    currentProviderIndex.value = (currentProviderIndex.value - 1 + len) % len
  }

  /** 设置当前供应商索引（clamp 到合法范围） */
  function setProviderIndex(index: number): void {
    const max = enabledProviders.value.length - 1
    if (max < 0) {
      currentProviderIndex.value = 0
      return
    }
    currentProviderIndex.value = Math.max(0, Math.min(index, max))
  }

  /**
   * 根据百分比和阈值返回进度条颜色
   * @param percentage 当前百分比
   * @param threshold1 一级阈值（默认50）
   * @param threshold2 二级阈值（默认80）
   * @param color1 低于 threshold1 的颜色（默认绿）
   * @param color2 threshold1 ~ threshold2 的颜色（默认黄）
   * @param color3 高于 threshold2 的颜色（默认红）
   */
  function getProgressColor(
    percentage: number,
    threshold1 = 50,
    threshold2 = 80,
    color1 = '#4caf50',
    color2 = '#ff9800',
    color3 = '#f44336',
  ): string {
    if (percentage >= threshold2) return color3
    if (percentage >= threshold1) return color2
    return color1
  }

  return {
    // State
    usageMap,
    enabledProviders,
    currentProviderIndex,
    lastRefreshTime,
    // Computed
    currentProvider,
    currentUsage,
    timeSinceLastRefresh,
    // Actions
    setEnabledProviders,
    updateUsage,
    getUsage,
    nextProvider,
    prevProvider,
    setProviderIndex,
    getProgressColor,
  }
})
