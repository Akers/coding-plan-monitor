import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUsageStore } from '@/stores/usage'
import type { UsageInfo, UsageMetric, ProviderId } from '@/types/data-model'

// Mock provider data
const mockMetrics: UsageMetric[] = [
  { label: '5h 额度', usedQuota: 30, totalQuota: 100, percentage: 30, unit: '次' },
  { label: '周额度', usedQuota: 500, totalQuota: 1000, percentage: 50, unit: '次' },
]

const mockUsageInfo: UsageInfo = {
  providerId: 'minimax',
  timestamp: Date.now(),
  metrics: mockMetrics,
}

const mockUsageInfo2: UsageInfo = {
  providerId: 'zhipu',
  timestamp: Date.now(),
  metrics: [
    { label: '5h 额度', usedQuota: 80, totalQuota: 100, percentage: 80, unit: '次' },
  ],
  extraInfo: '今日消耗: 1200 tokens',
}

const mockErrorUsage: UsageInfo = {
  providerId: 'minimax',
  timestamp: Date.now(),
  metrics: [],
  error: '连接失败',
}

describe('useUsageStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('初始状态', () => {
    it('应该有空的 usageMap', () => {
      const store = useUsageStore()
      expect(store.usageMap).toEqual({})
    })

    it('应该有空的 enabledProviders', () => {
      const store = useUsageStore()
      expect(store.enabledProviders).toEqual([])
    })

    it('应该有空的 currentProviderIndex', () => {
      const store = useUsageStore()
      expect(store.currentProviderIndex).toBe(0)
    })

    it('应该有空的 lastRefreshTime', () => {
      const store = useUsageStore()
      expect(store.lastRefreshTime).toBeNull()
    })
  })

  describe('setEnabledProviders', () => {
    it('应该设置启用的供应商列表', () => {
      const store = useUsageStore()
      store.setEnabledProviders(['minimax', 'zhipu'])
      expect(store.enabledProviders).toEqual(['minimax', 'zhipu'])
    })

    it('当当前索引超出范围时应该重置为 0', () => {
      const store = useUsageStore()
      store.setEnabledProviders(['minimax', 'zhipu'])
      store.currentProviderIndex = 1
      store.setEnabledProviders(['minimax'])
      expect(store.currentProviderIndex).toBe(0)
    })
  })

  describe('updateUsage', () => {
    it('应该更新指定供应商的额度数据', () => {
      const store = useUsageStore()
      store.updateUsage(mockUsageInfo)
      expect(store.usageMap['minimax']).toEqual(mockUsageInfo)
    })

    it('成功时应该更新 lastRefreshTime', () => {
      const store = useUsageStore()
      const before = Date.now()
      store.updateUsage(mockUsageInfo)
      expect(store.lastRefreshTime).toBeGreaterThanOrEqual(before)
    })

    it('失败时应该保留缓存数据但设置 error', () => {
      const store = useUsageStore()
      store.updateUsage(mockUsageInfo) // 先存成功数据
      const cached = { ...mockUsageInfo }

      // 再存失败数据
      store.updateUsage(mockErrorUsage)

      // 应该保留缓存数据
      expect(store.usageMap['minimax'].metrics).toEqual(cached.metrics)
      // 但标记错误
      expect(store.usageMap['minimax'].error).toBe('连接失败')
    })

    it('没有缓存数据时失败应该直接存储错误', () => {
      const store = useUsageStore()
      store.updateUsage(mockErrorUsage)
      expect(store.usageMap['minimax'].error).toBe('连接失败')
      expect(store.usageMap['minimax'].metrics).toEqual([])
    })
  })

  describe('getUsage', () => {
    it('应该返回指定供应商的 UsageInfo', () => {
      const store = useUsageStore()
      store.updateUsage(mockUsageInfo)
      expect(store.getUsage('minimax')).toEqual(mockUsageInfo)
    })

    it('不存在的供应商应该返回 undefined', () => {
      const store = useUsageStore()
      expect(store.getUsage('volcengine')).toBeUndefined()
    })
  })

  describe('currentProvider / currentUsage', () => {
    it('currentProvider 应该返回当前供应商 ID', () => {
      const store = useUsageStore()
      store.setEnabledProviders(['minimax', 'zhipu'])
      expect(store.currentProvider).toBe('minimax')
    })

    it('currentUsage 应该返回当前供应商的 UsageInfo', () => {
      const store = useUsageStore()
      store.setEnabledProviders(['minimax', 'zhipu'])
      store.updateUsage(mockUsageInfo)
      expect(store.currentUsage).toEqual(mockUsageInfo)
    })

    it('没有启用供应商时应该返回 null', () => {
      const store = useUsageStore()
      expect(store.currentProvider).toBeNull()
      expect(store.currentUsage).toBeNull()
    })
  })

  describe('nextProvider / prevProvider', () => {
    it('nextProvider 应该切换到下一个供应商', () => {
      const store = useUsageStore()
      store.setEnabledProviders(['minimax', 'zhipu', 'volcengine'])
      store.nextProvider()
      expect(store.currentProviderIndex).toBe(1)
    })

    it('nextProvider 到末尾应该循环到开头', () => {
      const store = useUsageStore()
      store.setEnabledProviders(['minimax', 'zhipu'])
      store.currentProviderIndex = 1
      store.nextProvider()
      expect(store.currentProviderIndex).toBe(0)
    })

    it('prevProvider 应该切换到上一个供应商', () => {
      const store = useUsageStore()
      store.setEnabledProviders(['minimax', 'zhipu'])
      store.currentProviderIndex = 1
      store.prevProvider()
      expect(store.currentProviderIndex).toBe(0)
    })

    it('prevProvider 在开头应该循环到末尾', () => {
      const store = useUsageStore()
      store.setEnabledProviders(['minimax', 'zhipu'])
      store.prevProvider()
      expect(store.currentProviderIndex).toBe(1)
    })

    it('setProviderIndex 应该设置指定索引', () => {
      const store = useUsageStore()
      store.setEnabledProviders(['minimax', 'zhipu', 'volcengine'])
      store.setProviderIndex(2)
      expect(store.currentProviderIndex).toBe(2)
    })

    it('setProviderIndex 超出范围时应该 clamp', () => {
      const store = useUsageStore()
      store.setEnabledProviders(['minimax', 'zhipu'])
      store.setProviderIndex(5)
      expect(store.currentProviderIndex).toBe(1)
    })
  })

  describe('getProgressColor', () => {
    it('低于阈值1应该返回 thresholdColor1', () => {
      const store = useUsageStore()
      expect(store.getProgressColor(30, 50, 80)).toBe('#4caf50')
    })

    it('达到阈值1但低于阈值2应该返回 thresholdColor2', () => {
      const store = useUsageStore()
      expect(store.getProgressColor(65, 50, 80)).toBe('#ff9800')
    })

    it('达到阈值2应该返回 thresholdColor3', () => {
      const store = useUsageStore()
      expect(store.getProgressColor(85, 50, 80)).toBe('#f44336')
    })

    it('正好等于阈值1应该返回 thresholdColor2', () => {
      const store = useUsageStore()
      expect(store.getProgressColor(50, 50, 80)).toBe('#ff9800')
    })

    it('正好等于阈值2应该返回 thresholdColor3', () => {
      const store = useUsageStore()
      expect(store.getProgressColor(80, 50, 80)).toBe('#f44336')
    })
  })

  describe('timeSinceLastRefresh', () => {
    it('没有刷新时应该返回 null', () => {
      const store = useUsageStore()
      expect(store.timeSinceLastRefresh).toBeNull()
    })

    it('有刷新时间时应该返回格式化字符串', () => {
      const store = useUsageStore()
      store.updateUsage(mockUsageInfo)
      const result = store.timeSinceLastRefresh
      expect(result).toBeTruthy()
      // 应该包含"秒前"或"分钟前"
      expect(result).toMatch(/(秒|分钟)前/)
    })
  })
})
