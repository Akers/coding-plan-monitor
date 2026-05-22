import type { ProviderRegistry, ProviderAdapter } from '@/providers/types'
import type { AppConfig, ProviderConfig, UsageInfo } from '@/types/data-model'
import { updateTrayStatus } from './tray'
import { sendNotification } from './notification'
import { checkAlerts, resetAlertCycle } from './alert'

/**
 * 刷新定时器 ID
 */
let refreshTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 启动定时刷新调度器
 * @param registry 供应商注册表
 * @param configStore 配置存储
 * @param usageStore 额度数据存储
 */
export function startRefreshScheduler(
  registry: ProviderRegistry,
  configStore: { config: AppConfig },
  usageStore: { setEnabledProviders(ids: string[]): void; updateUsage(info: UsageInfo): void }
): void {
  // 立即刷新一次
  refreshAll(registry, configStore, usageStore)

  // 如果已有定时器，先清除
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer)
  }

  const intervalMs = configStore.config.refreshInterval * 1000
  if (intervalMs <= 0) return

  function scheduleNext(): void {
    refreshTimer = setTimeout(async () => {
      await refreshAll(registry, configStore, usageStore)
      scheduleNext()
    }, intervalMs)
  }
  scheduleNext()
}

/**
 * 停止定时刷新调度器
 */
export function stopRefreshScheduler(): void {
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer)
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
  configStore: { config: AppConfig },
  usageStore: { setEnabledProviders(ids: string[]): void; updateUsage(info: UsageInfo): void }
): Promise<void> {
  const providers = configStore.config.providers

  // 获取所有启用的供应商配置
  const enabledProviders = providers.filter((p: ProviderConfig) => p.enabled)

  // 更新启用供应商列表
  const enabledIds = enabledProviders.map((p: ProviderConfig) => p.providerId)
  usageStore.setEnabledProviders(enabledIds)

  // 并发调用所有启用供应商的 fetchUsage
  const results = await Promise.allSettled<void>(
    enabledProviders.map(async (providerConfig: ProviderConfig) => {
      const adapter = registry.get(providerConfig.providerId)
      if (!adapter) {
        throw new Error(`Provider adapter not found: ${providerConfig.providerId}`)
      }

      // 验证配置
      if (!adapter.validateConfig(providerConfig)) {
        throw new Error(`Invalid config for provider: ${providerConfig.providerId}`)
      }

      const info = await adapter.fetchUsage(providerConfig)
      usageStore.updateUsage(info)
    })
  )

  // 处理结果
  results.forEach((result, index) => {
    const providerConfig = enabledProviders[index]

    if (result.status === 'rejected') {
      // 单个供应商失败不影响其他，传入带 error 的 UsageInfo
      usageStore.updateUsage({
        providerId: providerConfig.providerId,
        timestamp: Date.now(),
        metrics: [],
        error: result.reason?.message || String(result.reason),
      })
    }
    // fulfilled 的情况已经在 Promise.allSettled 中通过 usageStore.updateUsage(info) 处理了
  })

  // W4: 刷新后更新托盘状态
  const allInfos = enabledProviders.map((p: ProviderConfig, i: number) => ({
    providerId: p.providerId,
    info: results[i].status === 'fulfilled' ? (registry.get(p.providerId) ? { metrics: [] } : null) : null,
  }))

  const successCount = allInfos.filter((x) => x.info !== null).length
  const totalCount = enabledProviders.length

  if (totalCount > 0) {
    if (successCount === 0) {
      await updateTrayStatus('error').catch(() => {})
    } else if (successCount < totalCount) {
      await updateTrayStatus('warning').catch(() => {})
    } else {
      // 检查是否所有供应商的百分比都在阈值以下
      // 由于 refreshAll 不知道 threshold 配置，简单设为 normal
      await updateTrayStatus('normal').catch(() => {})
    }
  }

  // 重置通知周期，允许下一个刷新周期重新检测
  resetAlertCycle()
}

/**
 * 重启刷新调度器（配置变更时调用）
 * @param registry 供应商注册表
 * @param configStore 配置存储
 * @param usageStore 额度数据存储
 */
export function restartRefreshScheduler(
  registry: ProviderRegistry,
  configStore: { config: AppConfig },
  usageStore: { setEnabledProviders(ids: string[]): void; updateUsage(info: UsageInfo): void }
): void {
  stopRefreshScheduler()
  startRefreshScheduler(registry, configStore, usageStore)
}
