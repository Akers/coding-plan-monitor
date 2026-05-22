/**
 * 集成测试 14.3: 供应商轮播 → 手动切换 → 维度展示
 *
 * 验证：
 * 1. 多供应商轮播切换
 * 2. 手动切换重置轮播计时
 * 3. usageStore 的 currentProvider/currentUsage 正确更新
 * 4. 单个供应商时不启动轮播
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUsageStore } from '@/stores/usage'
import { startCarousel, stopCarousel, resetCarousel } from '@/services/carousel'
import type { UsageInfo } from '@/types/data-model'

describe('集成测试 14.3: 供应商轮播 → 手动切换 → 维度展示', () => {
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
      { label: '图像生成', usedQuota: 200, totalQuota: 500, percentage: 40, unit: '次' },
    ],
  }

  const volcengineUsage: UsageInfo = {
    providerId: 'volcengine',
    timestamp: Date.now(),
    metrics: [
      { label: '5h 额度', usedQuota: 10, totalQuota: 100, percentage: 10, unit: '次' },
    ],
  }

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.useFakeTimers()
    stopCarousel()
  })

  afterEach(() => {
    vi.useRealTimers()
    stopCarousel()
  })

  it('轮播自动切换供应商', () => {
    const usageStore = useUsageStore()
    const configStore = { config: { carouselInterval: 10, providers: [] } }

    // 设置三个启用的供应商
    usageStore.setEnabledProviders(['zhipu', 'minimax', 'volcengine'])
    usageStore.updateUsage(zhipuUsage)
    usageStore.updateUsage(minimaxUsage)
    usageStore.updateUsage(volcengineUsage)

    expect(usageStore.currentProvider).toBe('zhipu')

    // 启动轮播
    startCarousel(usageStore, configStore)

    // 第一个间隔后切换到 minimax
    vi.advanceTimersByTime(10_000)
    expect(usageStore.currentProvider).toBe('minimax')
    expect(usageStore.currentUsage?.metrics).toHaveLength(2)
    expect(usageStore.currentUsage?.metrics[0].label).toBe('文本生成')

    // 第二个间隔后切换到 volcengine
    vi.advanceTimersByTime(10_000)
    expect(usageStore.currentProvider).toBe('volcengine')
    expect(usageStore.currentUsage?.metrics).toHaveLength(1)

    // 第三个间隔后循环回 zhipu
    vi.advanceTimersByTime(10_000)
    expect(usageStore.currentProvider).toBe('zhipu')
  })

  it('手动切换后轮播计时器重置', () => {
    const usageStore = useUsageStore()
    const configStore = { config: { carouselInterval: 10, providers: [] } }

    usageStore.setEnabledProviders(['zhipu', 'minimax'])
    usageStore.updateUsage(zhipuUsage)
    usageStore.updateUsage(minimaxUsage)

    startCarousel(usageStore, configStore)

    // 过了 7 秒（接近下一次切换）
    vi.advanceTimersByTime(7_000)
    expect(usageStore.currentProvider).toBe('zhipu')

    // 手动切换
    usageStore.nextProvider()
    expect(usageStore.currentProvider).toBe('minimax')
    resetCarousel()

    // 再过 7 秒（如果不是重置，应该已经切换了）
    vi.advanceTimersByTime(7_000)
    expect(usageStore.currentProvider).toBe('minimax') // 仍然在 minimax

    // 过了 3 秒（总计 10 秒从重置起）才切换
    vi.advanceTimersByTime(3_000)
    expect(usageStore.currentProvider).toBe('zhipu')
  })

  it('单个供应商时不启动轮播', () => {
    const usageStore = useUsageStore()
    const configStore = { config: { carouselInterval: 10, providers: [] } }
    const nextSpy = vi.spyOn(usageStore, 'nextProvider')

    usageStore.setEnabledProviders(['zhipu'])
    usageStore.updateUsage(zhipuUsage)

    startCarousel(usageStore, configStore)

    // 轮播不启动，即使过了很长时间也不切换
    vi.advanceTimersByTime(30_000)
    expect(nextSpy).not.toHaveBeenCalled()
    expect(usageStore.currentProvider).toBe('zhipu')
  })

  it('维度数据随当前供应商正确展示', () => {
    const usageStore = useUsageStore()

    usageStore.setEnabledProviders(['zhipu', 'minimax'])
    usageStore.updateUsage(zhipuUsage)
    usageStore.updateUsage(minimaxUsage)

    // zhipu: 2个维度
    usageStore.setProviderIndex(0)
    expect(usageStore.currentUsage?.metrics).toHaveLength(2)
    expect(usageStore.currentUsage?.metrics.map(m => m.label)).toEqual(['5h 额度', '周额度'])

    // minimax: 2个维度
    usageStore.setProviderIndex(1)
    expect(usageStore.currentUsage?.metrics).toHaveLength(2)
    expect(usageStore.currentUsage?.metrics.map(m => m.label)).toEqual(['文本生成', '图像生成'])
  })

  it('prevProvider 循环切换正确', () => {
    const usageStore = useUsageStore()
    usageStore.setEnabledProviders(['zhipu', 'minimax', 'volcengine'])

    // 从第一个(0)往前 → 最后一个(2)
    usageStore.setProviderIndex(0)
    usageStore.prevProvider()
    expect(usageStore.currentProviderIndex).toBe(2)

    // 从最后一个(2)往前 → 中间(1)
    usageStore.prevProvider()
    expect(usageStore.currentProviderIndex).toBe(1)

    // 从中间(1)往前 → 第一个(0)
    usageStore.prevProvider()
    expect(usageStore.currentProviderIndex).toBe(0)
  })
})
