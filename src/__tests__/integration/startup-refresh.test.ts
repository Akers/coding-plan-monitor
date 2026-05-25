/**
 * 集成测试 14.1: 应用启动 → 悬浮面板显示 → 加载配置 → 刷新数据
 *
 * 验证完整启动流程中多个服务层的协作：
 * 1. configStore 加载配置（从 mock Rust 后端）
 * 2. usageStore 根据配置设置启用的供应商
 * 3. refreshAll 调用供应商适配器获取数据
 * 4. usageStore 接收并存储数据
 * 5. checkAlerts 在刷新后检测限额
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

// ============================================================
// Mock: Tauri invoke
// ============================================================
const mockInvoke = vi.fn()
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
}))

// ============================================================
// Mock: Provider Adapters
// ============================================================
function createMockAdapter(
  id: 'zhipu' | 'minimax' | 'volcengine',
  usageData: UsageInfo
): ProviderAdapter {
  return {
    id,
    name: id === 'zhipu' ? '智谱' : id === 'minimax' ? 'MiniMax' : '火山',
    authType: 'apikey',
    validateConfig: vi.fn().mockReturnValue(true),
    fetchUsage: vi.fn().mockResolvedValue(usageData),
  }
}

describe('集成测试 14.1: 应用启动 → 加载配置 → 刷新数据', () => {
  let pinia: ReturnType<typeof createPinia>

  const zhipuUsage: UsageInfo = {
    providerId: 'zhipu',
    timestamp: Date.now(),
    metrics: [
      { label: '5h 额度', usedQuota: 30, totalQuota: 100, percentage: 30, unit: '次' },
      { label: '周额度', usedQuota: 800, totalQuota: 1000, percentage: 80, unit: 'tokens' },
    ],
  }

  const minimaxUsage: UsageInfo = {
    providerId: 'minimax',
    timestamp: Date.now(),
    metrics: [
      { label: '文本生成', usedQuota: 5000, totalQuota: 10000, percentage: 50, unit: '次' },
    ],
  }

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    resetAlertCycle()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('完整启动流程：加载配置 → 设置供应商 → 刷新数据 → 数据可用', async () => {
    // 1. 模拟 Rust 后端返回配置
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
        { providerId: 'zhipu', enabled: true, authType: 'apikey', apiKey: 'test-key-1' },
        { providerId: 'minimax', enabled: true, authType: 'apikey', apiKey: 'test-key-2' },
        { providerId: 'volcengine', enabled: false, authType: 'oauth' },
      ],
    })

    // 2. 初始化 stores
    const configStore = useConfigStore()
    const usageStore = useUsageStore()

    // 3. 加载配置
    await configStore.loadConfig()
    expect(configStore.loaded).toBe(true)
    expect(configStore.config.providers).toHaveLength(3)
    expect(configStore.config.providers.filter(p => p.enabled)).toHaveLength(2)

    // 4. 创建注册表并注册适配器
    const registry = createProviderRegistry()
    registry.register(createMockAdapter('zhipu', zhipuUsage))
    registry.register(createMockAdapter('minimax', minimaxUsage))

    // 5. 刷新所有供应商数据
    await refreshAll(registry, configStore, usageStore)

    // 6. 验证 usageStore 数据正确
    expect(usageStore.enabledProviders).toEqual(['zhipu', 'minimax'])
    expect(usageStore.usageMap['zhipu']).toBeDefined()
    expect(usageStore.usageMap['zhipu'].metrics).toHaveLength(2)
    expect(usageStore.usageMap['zhipu'].metrics[0].label).toBe('5h 额度')
    expect(usageStore.usageMap['minimax']).toBeDefined()
    expect(usageStore.usageMap['minimax'].metrics).toHaveLength(1)
    expect(usageStore.lastRefreshTime).not.toBeNull()

    // 7. 验证 currentProvider 指向第一个启用的供应商
    expect(usageStore.currentProvider).toBe('zhipu')
  })

  it('配置加载失败时使用默认配置，刷新仍然可以工作', async () => {
    // 1. 模拟 Rust 后端失败
    mockInvoke.mockRejectedValueOnce(new Error('file not found'))

    const configStore = useConfigStore()
    const usageStore = useUsageStore()

    // 2. 加载配置（应回退到默认值）
    await configStore.loadConfig()
    expect(configStore.loaded).toBe(true)
    expect(configStore.config.refreshInterval).toBe(30)
    expect(configStore.config.providers).toHaveLength(0)

    // 3. 无启用供应商时刷新应正常完成（不报错）
    const registry = createProviderRegistry()
    await refreshAll(registry, configStore, usageStore)
    expect(usageStore.enabledProviders).toEqual([])
  })

  it('单个供应商刷新失败时，其他供应商数据正常', async () => {
    const configStore = useConfigStore()
    const usageStore = useUsageStore()

    // 手动设置配置
    configStore.config.providers = [
      { providerId: 'zhipu', enabled: true, authType: 'apikey', apiKey: 'key-1' },
      { providerId: 'minimax', enabled: true, authType: 'apikey', apiKey: 'key-2' },
    ]

    const registry = createProviderRegistry()

    // zhipu 成功
    registry.register(createMockAdapter('zhipu', zhipuUsage))
    // minimax 失败
    const failingAdapter: ProviderAdapter = {
      id: 'minimax',
      name: 'MiniMax',
      authType: 'apikey',
      validateConfig: vi.fn().mockReturnValue(true),
      fetchUsage: vi.fn().mockRejectedValue(new Error('Network timeout')),
    }
    registry.register(failingAdapter)

    // 先给 minimax 设置缓存数据
    usageStore.updateUsage({
      providerId: 'minimax',
      timestamp: Date.now() - 60000,
      metrics: [{ label: '文本生成', usedQuota: 1000, totalQuota: 10000, percentage: 10, unit: '次' }],
    })

    // 刷新
    await refreshAll(registry, configStore, usageStore)

    // zhipu 数据正常
    expect(usageStore.usageMap['zhipu'].error).toBeUndefined()
    expect(usageStore.usageMap['zhipu'].metrics).toHaveLength(2)

    // minimax 保留缓存数据但标记 error
    expect(usageStore.usageMap['minimax'].error).toBe('Network timeout')
    expect(usageStore.usageMap['minimax'].metrics).toHaveLength(1) // 缓存保留
  })

  it('刷新后限额检测：达到阈值的维度触发通知', async () => {
    const configStore = useConfigStore()
    const usageStore = useUsageStore()

    configStore.config.alertEnabled = true
    configStore.config.alertThreshold = 80

    // 刷新数据（周额度达到 80%）
    usageStore.updateUsage(zhipuUsage)

    // 检测限额
    const alerts = checkAlerts(usageStore.usageMap['zhipu'], '智谱', configStore)
    expect(alerts).toHaveLength(1)
    expect(alerts[0].body).toContain('智谱')
    expect(alerts[0].body).toContain('周额度')
    expect(alerts[0].body).toContain('80%')

    // 第二次检测不应重复通知
    const alerts2 = checkAlerts(usageStore.usageMap['zhipu'], '智谱', configStore)
    expect(alerts2).toHaveLength(0)
  })
})
