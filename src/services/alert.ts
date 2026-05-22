import type { UsageInfo } from '@/types/data-model'

/**
 * AlertNotification - 限额提醒通知
 */
export interface AlertNotification {
  title: string
  body: string
}

/**
 * 已通知的 key 集合，用于防止同一周期内重复通知
 */
const notifiedKeys: Set<string> = new Set()

/**
 * 检查供应商额度是否达到提醒阈值
 * @param usageInfo 供应商额度信息
 * @param providerName 供应商显示名称
 * @param configStore 配置存储，包含 alertEnabled 和 alertThreshold
 * @returns 需要发送的通知数组
 */
export function checkAlerts(
  usageInfo: UsageInfo,
  providerName: string,
  configStore: { config: { alertEnabled: boolean; alertThreshold: number } }
): AlertNotification[] {
  // 如果提醒未启用，返回空数组
  if (!configStore.config.alertEnabled) {
    return []
  }

  const notifications: AlertNotification[] = []
  const threshold = configStore.config.alertThreshold

  for (const metric of usageInfo.metrics) {
    if (metric.percentage >= threshold) {
      const key = `${usageInfo.providerId}:${metric.label}`

      // 如果该 key 已在通知集合中，跳过
      if (notifiedKeys.has(key)) {
        continue
      }

      // 添加到通知集合
      notifiedKeys.add(key)

      notifications.push({
        title: '额度提醒',
        body: `${providerName} ${metric.label} 已达 ${metric.percentage}%，请留意用量`,
      })
    }
  }

  return notifications
}

/**
 * 重置通知周期
 * 调用此函数可清空已通知集合，允许在新周期内重新发送通知
 */
export function resetAlertCycle(): void {
  notifiedKeys.clear()
}
