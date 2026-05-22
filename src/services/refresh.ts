import type { ProviderRegistry } from '@/providers/types'
import type { UsageInfo } from '@/types/data-model'

/**
 * 刷新定时器 ID
 */
let refreshTimer: ReturnType<typeof setInterval> | null = null

/**
 * 启动定时刷新调度器
 * @param registry 供应商注册表
 * @param configStore 配置存储
 * @param usageStore 额度数据存储
 */
export function startRefreshScheduler(
  registry: ProviderRegistry,
  configStore: { config: { refreshInterval: number; providers: any[] } },
  usageStore: { setEnabledProviders(ids: any): void; updateUsage(info: UsageInfo): void }
): void {
  // 立即刷新一次
  refreshAll(registry, configStore, usageStore)

  // 如果已有定时器，先清除
  if (refreshTimer !== null) {
    clearInterval(refreshTimer)
  }

  // 启动新的定时器
  const intervalMs = configStore.config.refreshInterval * 1000
  refreshTimer = setInterval(() => {
    refreshAll(registry, configStore, usageStore)
  }, intervalMs)
}

/**
 * 停止定时刷新调度器
 */
export function stopRefreshScheduler(): void {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

/**
 * 立即刷新所有启用的供应商数据
 * @param registry 供应商注册表
 * @param configStore 配置存储
 * @param usageStore 额度数据存储
 */
export async function refreshAll(
  registry: ProviderRegistry,
  configStore: { config: { providers: any[] } },
  usageStore: { setEnabledProviders(ids: any): void; updateUsage(info: UsageInfo): void }
): Promise<void> {
  const providers = configStore.config.providers

  // 获取所有启用的供应商配置
  const enabledProviders = providers.filter((p: any) => p.enabled)

  // 更新启用供应商列表
  const enabledIds = enabledProviders.map((p: any) => p.providerId)
  usageStore.setEnabledProviders(enabledIds)

  // 并发调用所有启用供应商的 fetchUsage
  const results = await Promise.allSettled(
    enabledProviders.map(async (providerConfig: any) => {
      const adapter = registry.get(providerConfig.providerId)
      if (!adapter) {
        throw new Error(`Provider adapter not found: ${providerConfig.providerId}`)
      }

      // 验证配置
      if (!adapter.validateConfig(providerConfig)) {
        throw new Error(`Invalid config for provider: ${providerConfig.providerId}`)
      }

      const info = await adapter.fetchUsage(providerConfig)
      return info
    })
  )

  // 处理结果
  results.forEach((result, index) => {
    const providerConfig = enabledProviders[index]

    if (result.status === 'fulfilled') {
      usageStore.updateUsage(result.value)
    } else {
      // 单个供应商失败不影响其他，传入带 error 的 UsageInfo
      usageStore.updateUsage({
        providerId: providerConfig.providerId,
        timestamp: Date.now(),
        metrics: [],
        error: result.reason?.message || String(result.reason),
      })
    }
  })
}

/**
 * 重启刷新调度器（配置变更时调用）
 * @param registry 供应商注册表
 * @param configStore 配置存储
 * @param usageStore 额度数据存储
 */
export function restartRefreshScheduler(
  registry: ProviderRegistry,
  configStore: { config: { refreshInterval: number; providers: any[] } },
  usageStore: { setEnabledProviders(ids: any): void; updateUsage(info: UsageInfo): void }
): void {
  stopRefreshScheduler()
  startRefreshScheduler(registry, configStore, usageStore)
}
