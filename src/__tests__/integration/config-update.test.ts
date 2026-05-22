/**
 * 集成测试 14.2: 配置窗口 → 修改配置 → 保存 → 面板更新
 *
 * 验证配置修改和保存后各服务的响应：
 * 1. configStore.updateConfig 修改配置
 * 2. configStore.saveConfig 持久化到 Rust 后端
 * 3. refreshAll 使用新配置刷新数据
 * 4. alert 使用新阈值检测
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConfigStore } from '@/stores/config'
import { useUsageStore } from '@/stores/usage'
import { createProviderRegistry } from '@/providers/registry'
import type { ProviderAdapter } from '@/providers/types'
import type { UsageInfo } from '@/types/data-model'
import { refreshAll } from '@/services/refresh'
import { checkAlerts, resetAlertCycle } from '@/services/alert'

const mockInvoke = vi.fn()
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
}))

const zhipuUsage: UsageInfo = {
  providerId: 'zhipu',
  timestamp: Date.now(),
  metrics: [
    { label: '5h 额度', usedQuota: 30, totalQuota: 100, percentage: 30, unit: '次' },
    { label: '周额度', usedQuota: 850, totalQuota: 1000, percentage: 85, unit: 'tokens' },
  ],
}

describe('集成测试 14.2: 配置窗口 → 修改配置 → 保存 → 面板更新', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    resetAlertCycle()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('修改刷新间隔并保存，新间隔生效', async () => {
    // 初始加载
    mockInvoke.mockResolvedValueOnce({
      refreshInterval: 30,
      carouselInterval: 10,
      panelBgColor: '#333333',
      panelOpacity: 0.8,
      panelEdge: 'top',
      panelLocked: false,
      clickThrough: false,
      threshold1: 50,
      threshold2: 80,
      thresholdColor1: '#4caf50',
      thresholdColor2: '#ff9800',
      thresholdColor3: '#f44336',
      alertEnabled: true,
      alertThreshold: 80,
      autoStart: false,
      providers: [
        { providerId: 'zhipu', enabled: true, authType: 'apikey', apiKey: 'test-key' },
      ],
    })
    // 保存调用
    mockInvoke.mockResolvedValueOnce(undefined)

    const configStore = useConfigStore()
    await configStore.loadConfig()
    expect(configStore.config.refreshInterval).toBe(30)
    expect(configStore.dirty).toBe(false)

    // 修改配置
    configStore.updateConfig({ refreshInterval: 60 })
    expect(configStore.dirty).toBe(true)
    expect(configStore.config.refreshInterval).toBe(60)

    // 保存
    await configStore.saveConfig()
    expect(configStore.dirty).toBe(false)
    expect(mockInvoke).toHaveBeenCalledWith('save_config', {
      config: expect.objectContaining({ refreshInterval: 60 }),
    })
  })

  it('取消修改后配置恢复原值', async () => {
    mockInvoke.mockResolvedValueOnce({
      refreshInterval: 30,
      carouselInterval: 10,
      panelBgColor: '#333333',
      panelOpacity: 0.8,
      panelEdge: 'top',
      panelLocked: false,
      clickThrough: false,
      threshold1: 50,
      threshold2: 80,
      thresholdColor1: '#4caf50',
      thresholdColor2: '#ff9800',
      thresholdColor3: '#f44336',
      alertEnabled: true,
      alertThreshold: 80,
      autoStart: false,
      providers: [],
    })

    const configStore = useConfigStore()
    await configStore.loadConfig()

    // 修改
    configStore.updateConfig({ refreshInterval: 120, panelBgColor: '#000000' })
    expect(configStore.config.refreshInterval).toBe(120)
    expect(configStore.config.panelBgColor).toBe('#000000')
    expect(configStore.dirty).toBe(true)

    // 取消
    configStore.cancelChanges()
    expect(configStore.config.refreshInterval).toBe(30)
    expect(configStore.config.panelBgColor).toBe('#333333')
    expect(configStore.dirty).toBe(false)
  })

  it('启用新供应商后刷新数据可用', async () => {
    mockInvoke.mockResolvedValueOnce({
      refreshInterval: 30,
      carouselInterval: 10,
      panelBgColor: '#333333',
      panelOpacity: 0.8,
      panelEdge: 'top',
      panelLocked: false,
      clickThrough: false,
      threshold1: 50,
      threshold2: 80,
      thresholdColor1: '#4caf50',
      thresholdColor2: '#ff9800',
      thresholdColor3: '#f44336',
      alertEnabled: true,
      alertThreshold: 80,
      autoStart: false,
      providers: [
        { providerId: 'zhipu', enabled: true, authType: 'apikey', apiKey: 'key' },
        { providerId: 'minimax', enabled: false, authType: 'apikey' },
      ],
    })

    const configStore = useConfigStore()
    const usageStore = useUsageStore()
    await configStore.loadConfig()

    // 初始只有 zhipu
    const registry = createProviderRegistry()
    registry.register({
      id: 'zhipu',
      name: '智谱',
      authType: 'apikey',
      validateConfig: vi.fn().mockReturnValue(true),
      fetchUsage: vi.fn().mockResolvedValue(zhipuUsage),
    })
    registry.register({
      id: 'minimax',
      name: 'MiniMax',
      authType: 'apikey',
      validateConfig: vi.fn().mockReturnValue(true),
      fetchUsage: vi.fn().mockResolvedValue({
        providerId: 'minimax',
        timestamp: Date.now(),
        metrics: [{ label: '文本生成', usedQuota: 3000, totalQuota: 10000, percentage: 30, unit: '次' }],
      }),
    })

    // 刷新 - 只有 zhipu
    await refreshAll(registry, configStore, usageStore)
    expect(usageStore.enabledProviders).toEqual(['zhipu'])
    expect(usageStore.usageMap['minimax']).toBeUndefined()

    // 启用 minimax
    configStore.config.providers[1].enabled = true
    configStore.config.providers[1].apiKey = 'new-key'

    // 再次刷新
    await refreshAll(registry, configStore, usageStore)
    expect(usageStore.enabledProviders).toEqual(['zhipu', 'minimax'])
    expect(usageStore.usageMap['minimax']).toBeDefined()
    expect(usageStore.usageMap['minimax'].metrics).toHaveLength(1)
  })

  it('修改 alertThreshold 后重新检测通知', async () => {
    const configStore = useConfigStore()
    const usageStore = useUsageStore()

    configStore.config.alertEnabled = true
    configStore.config.alertThreshold = 90 // 初始 90%

    // 85% 在阈值 90% 以下 → 不触发
    usageStore.updateUsage(zhipuUsage)
    let alerts = checkAlerts(usageStore.usageMap['zhipu'], '智谱', configStore)
    expect(alerts).toHaveLength(0)

    // 修改阈值为 80%
    configStore.updateConfig({ alertThreshold: 80 })
    resetAlertCycle() // 新周期

    // 85% 在新阈值 80% 以上 → 触发
    alerts = checkAlerts(usageStore.usageMap['zhipu'], '智谱', configStore)
    expect(alerts).toHaveLength(1)
    expect(alerts[0].body).toContain('85%')
  })
})
