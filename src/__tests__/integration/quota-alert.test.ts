/**
 * 集成测试 14.4: 额度达到阈值 → 系统通知触发
 *
 * 验证：
 * 1. 刷新数据后自动检测限额
 * 2. 多供应商多维度分别检测
 * 3. 同周期防重复
 * 4. alertEnabled 关闭时不通知
 * 5. 重置周期后重新通知
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUsageStore } from '@/stores/usage'
import { checkAlerts, resetAlertCycle } from '@/services/alert'
import { sendNotification } from '@/services/notification'
import type { UsageInfo } from '@/types/data-model'

// Mock notification plugin
const mockTauriNotification = vi.fn()
vi.mock('@tauri-apps/plugin-notification', () => ({
  sendNotification: (...args: any[]) => mockTauriNotification(...args),
}))

describe('集成测试 14.4: 额度阈值 → 系统通知', () => {
  let pinia: ReturnType<typeof createPinia>
  let configStore: { config: { alertEnabled: boolean; alertThreshold: number } }

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    resetAlertCycle()
    vi.clearAllMocks()
    configStore = { config: { alertEnabled: true, alertThreshold: 80 } }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('多供应商多维度分别检测，各维度独立通知', async () => {
    const usageStore = useUsageStore()

    const zhipuData: UsageInfo = {
      providerId: 'zhipu',
      timestamp: Date.now(),
      metrics: [
        { label: '5h 额度', usedQuota: 90, totalQuota: 100, percentage: 90, unit: '次' },
        { label: '周额度', usedQuota: 700, totalQuota: 1000, percentage: 70, unit: 'tokens' },
      ],
    }

    const minimaxData: UsageInfo = {
      providerId: 'minimax',
      timestamp: Date.now(),
      metrics: [
        { label: '文本生成', usedQuota: 8500, totalQuota: 10000, percentage: 85, unit: '次' },
      ],
    }

    usageStore.updateUsage(zhipuData)
    usageStore.updateUsage(minimaxData)

    // 检测智谱
    const zhipuAlerts = checkAlerts(usageStore.usageMap['zhipu'], '智谱', configStore)
    expect(zhipuAlerts).toHaveLength(1) // 只有 5h 额度（90%）超过 80%
    expect(zhipuAlerts[0].body).toContain('5h 额度')

    // 检测 minimax
    const minimaxAlerts = checkAlerts(usageStore.usageMap['minimax'], 'MiniMax', configStore)
    expect(minimaxAlerts).toHaveLength(1)
    expect(minimaxAlerts[0].body).toContain('85%')

    // 发送通知
    const allAlerts = [...zhipuAlerts, ...minimaxAlerts]
    for (const alert of allAlerts) {
      await sendNotification(alert)
    }
    expect(mockTauriNotification).toHaveBeenCalledTimes(2)
  })

  it('同一周期防重复通知', () => {
    const usageStore = useUsageStore()

    const data: UsageInfo = {
      providerId: 'zhipu',
      timestamp: Date.now(),
      metrics: [
        { label: '5h 额度', usedQuota: 95, totalQuota: 100, percentage: 95, unit: '次' },
      ],
    }
    usageStore.updateUsage(data)

    // 第一次检测 → 通知
    const alerts1 = checkAlerts(usageStore.usageMap['zhipu'], '智谱', configStore)
    expect(alerts1).toHaveLength(1)

    // 第二次检测 → 不重复
    const alerts2 = checkAlerts(usageStore.usageMap['zhipu'], '智谱', configStore)
    expect(alerts2).toHaveLength(0)

    // 第三次 → 仍然不重复
    const alerts3 = checkAlerts(usageStore.usageMap['zhipu'], '智谱', configStore)
    expect(alerts3).toHaveLength(0)
  })

  it('重置周期后重新通知', () => {
    const usageStore = useUsageStore()

    const data: UsageInfo = {
      providerId: 'zhipu',
      timestamp: Date.now(),
      metrics: [
        { label: '周额度', usedQuota: 900, totalQuota: 1000, percentage: 90, unit: 'tokens' },
      ],
    }
    usageStore.updateUsage(data)

    // 首次通知
    const alerts1 = checkAlerts(usageStore.usageMap['zhipu'], '智谱', configStore)
    expect(alerts1).toHaveLength(1)

    // 重置周期（模拟刷新调度重启）
    resetAlertCycle()

    // 重新通知
    const alerts2 = checkAlerts(usageStore.usageMap['zhipu'], '智谱', configStore)
    expect(alerts2).toHaveLength(1)
  })

  it('alertEnabled 关闭时不通知', () => {
    const usageStore = useUsageStore()
    configStore.config.alertEnabled = false

    const data: UsageInfo = {
      providerId: 'zhipu',
      timestamp: Date.now(),
      metrics: [
        { label: '5h 额度', usedQuota: 99, totalQuota: 100, percentage: 99, unit: '次' },
      ],
    }
    usageStore.updateUsage(data)

    const alerts = checkAlerts(usageStore.usageMap['zhipu'], '智谱', configStore)
    expect(alerts).toHaveLength(0)
  })

  it('所有维度都低于阈值时不通知', () => {
    const usageStore = useUsageStore()

    const data: UsageInfo = {
      providerId: 'minimax',
      timestamp: Date.now(),
      metrics: [
        { label: '文本生成', usedQuota: 3000, totalQuota: 10000, percentage: 30, unit: '次' },
        { label: '图像生成', usedQuota: 100, totalQuota: 500, percentage: 20, unit: '次' },
      ],
    }
    usageStore.updateUsage(data)

    const alerts = checkAlerts(usageStore.usageMap['minimax'], 'MiniMax', configStore)
    expect(alerts).toHaveLength(0)
  })
})
