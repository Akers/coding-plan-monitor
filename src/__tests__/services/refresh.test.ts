import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ProviderRegistry, ProviderAdapter } from '@/providers/types'
import type { ProviderId, ProviderConfig, UsageInfo } from '@/types/data-model'

// Mock the modules before importing the service
const mockFetchUsage = vi.fn()
const mockValidateConfig = vi.fn()

const mockAdapter1: ProviderAdapter = {
  id: 'zhipu' as ProviderId,
  name: 'Zhipu',
  authType: 'apikey',
  fetchUsage: mockFetchUsage,
  validateConfig: mockValidateConfig,
}

const mockAdapter2: ProviderAdapter = {
  id: 'minimax' as ProviderId,
  name: 'MiniMax',
  authType: 'apikey',
  fetchUsage: mockFetchUsage,
  validateConfig: mockValidateConfig,
}

const createMockRegistry = (): ProviderRegistry => {
  const adapters: ProviderAdapter[] = []

  return {
    register(adapter: ProviderAdapter) {
      adapters.push(adapter)
    },
    get(id: ProviderId) {
      return adapters.find((a) => a.id === id)
    },
    getAll() {
      return [...adapters]
    },
  }
}

const createMockConfigStore = (overrides = {}) => {
  const defaultConfig = {
    refreshInterval: 30,
    carouselInterval: 10,
    providers: [
      { providerId: 'zhipu' as ProviderId, enabled: true, authType: 'apikey' as const, apiKey: 'test-key-1' },
      { providerId: 'minimax' as ProviderId, enabled: true, authType: 'apikey' as const, apiKey: 'test-key-2' },
    ],
    ...overrides,
  }

  return {
    config: defaultConfig,
  }
}

const createMockUsageStore = () => ({
  setEnabledProviders: vi.fn(),
  updateUsage: vi.fn(),
})

describe('Refresh Service', () => {
  let refreshAll: any
  let startRefreshScheduler: any
  let stopRefreshScheduler: any
  let restartRefreshScheduler: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockValidateConfig.mockReturnValue(true)
    vi.useFakeTimers({ shouldAdvanceTime: true })

    // Reset modules to get fresh state
    vi.resetModules()

    // Re-import to get fresh functions
    const refreshModule = await import('@/services/refresh')
    refreshAll = refreshModule.refreshAll
    startRefreshScheduler = refreshModule.startRefreshScheduler
    stopRefreshScheduler = refreshModule.stopRefreshScheduler
    restartRefreshScheduler = refreshModule.restartRefreshScheduler
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('refreshAll', () => {
    it('should call fetchUsage for all enabled providers with valid config', async () => {
      const registry = createMockRegistry()
      registry.register(mockAdapter1)
      registry.register(mockAdapter2)

      const configStore = createMockConfigStore()
      const usageStore = createMockUsageStore()

      mockFetchUsage.mockResolvedValue({
        providerId: 'zhipu',
        timestamp: Date.now(),
        metrics: [],
      })

      await refreshAll(registry, configStore, usageStore)

      expect(mockFetchUsage).toHaveBeenCalledTimes(2)
      expect(mockFetchUsage).toHaveBeenCalledWith(configStore.config.providers[0])
      expect(mockFetchUsage).toHaveBeenCalledWith(configStore.config.providers[1])
    })

    it('should call updateUsage with results from all providers', async () => {
      const registry = createMockRegistry()
      registry.register(mockAdapter1)
      registry.register(mockAdapter2)

      const configStore = createMockConfigStore()
      const usageStore = createMockUsageStore()

      const usageInfo1: UsageInfo = {
        providerId: 'zhipu',
        timestamp: Date.now(),
        metrics: [{ label: '额度', usedQuota: 100, totalQuota: 1000, percentage: 10, unit: '次' }],
      }
      const usageInfo2: UsageInfo = {
        providerId: 'minimax',
        timestamp: Date.now(),
        metrics: [{ label: '额度', usedQuota: 200, totalQuota: 2000, percentage: 10, unit: '次' }],
      }

      mockFetchUsage
        .mockResolvedValueOnce(usageInfo1)
        .mockResolvedValueOnce(usageInfo2)

      await refreshAll(registry, configStore, usageStore)

      expect(usageStore.updateUsage).toHaveBeenCalledWith(usageInfo1)
      expect(usageStore.updateUsage).toHaveBeenCalledWith(usageInfo2)
    })

    it('should not fail when one provider fails - other providers should still be processed', async () => {
      const registry = createMockRegistry()
      registry.register(mockAdapter1)
      registry.register(mockAdapter2)

      const configStore = createMockConfigStore()
      const usageStore = createMockUsageStore()

      const errorInfo: UsageInfo = {
        providerId: 'zhipu',
        timestamp: Date.now(),
        metrics: [],
        error: 'API Error',
      }
      const successInfo: UsageInfo = {
        providerId: 'minimax',
        timestamp: Date.now(),
        metrics: [{ label: '额度', usedQuota: 200, totalQuota: 2000, percentage: 10, unit: '次' }],
      }

      mockFetchUsage
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(successInfo)

      // Should not throw
      await expect(refreshAll(registry, configStore, usageStore)).resolves.not.toThrow()

      // Both should still call updateUsage
      expect(usageStore.updateUsage).toHaveBeenCalledTimes(2)
      expect(usageStore.updateUsage).toHaveBeenCalledWith(
        expect.objectContaining({ providerId: 'zhipu', error: 'API Error' })
      )
      expect(usageStore.updateUsage).toHaveBeenCalledWith(successInfo)
    })

    it('should skip providers that are not enabled', async () => {
      const registry = createMockRegistry()
      registry.register(mockAdapter1)
      registry.register(mockAdapter2)

      const configStore = createMockConfigStore({
        providers: [
          { providerId: 'zhipu' as ProviderId, enabled: true, authType: 'apikey' as const, apiKey: 'test-key-1' },
          { providerId: 'minimax' as ProviderId, enabled: false, authType: 'apikey' as const, apiKey: 'test-key-2' },
        ],
      })
      const usageStore = createMockUsageStore()

      mockFetchUsage.mockResolvedValue({
        providerId: 'zhipu',
        timestamp: Date.now(),
        metrics: [],
      })

      await refreshAll(registry, configStore, usageStore)

      // Only zhipu (enabled) should be called
      expect(mockFetchUsage).toHaveBeenCalledTimes(1)
      expect(mockFetchUsage).toHaveBeenCalledWith(configStore.config.providers[0])
    })

    it('should skip providers when validateConfig returns false', async () => {
      const registry = createMockRegistry()
      registry.register(mockAdapter1)
      registry.register(mockAdapter2)

      const configStore = createMockConfigStore()
      const usageStore = createMockUsageStore()

      // First adapter validates to false
      mockValidateConfig
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)

      mockFetchUsage.mockResolvedValue({
        providerId: 'minimax',
        timestamp: Date.now(),
        metrics: [],
      })

      await refreshAll(registry, configStore, usageStore)

      // Only minimax (validateConfig returns true) should be called
      expect(mockFetchUsage).toHaveBeenCalledTimes(1)
      expect(mockFetchUsage).toHaveBeenCalledWith(configStore.config.providers[1])
    })
  })

  describe('startRefreshScheduler', () => {
    it('should create a timer that calls refreshAll periodically', async () => {
      const registry = createMockRegistry()
      registry.register(mockAdapter1)

      const configStore = createMockConfigStore({
        refreshInterval: 30,
        providers: [{ providerId: 'zhipu' as ProviderId, enabled: true, authType: 'apikey' as const }],
      })
      const usageStore = createMockUsageStore()

      mockFetchUsage.mockResolvedValue({
        providerId: 'zhipu',
        timestamp: Date.now(),
        metrics: [],
      })

      startRefreshScheduler(registry, configStore, usageStore)

      // Initial call
      await vi.advanceTimersByTimeAsync(0)
      expect(mockFetchUsage).toHaveBeenCalledTimes(1)

      // After 30 seconds
      await vi.advanceTimersByTimeAsync(30000)
      expect(mockFetchUsage).toHaveBeenCalledTimes(2)

      // After 60 seconds
      await vi.advanceTimersByTimeAsync(30000)
      expect(mockFetchUsage).toHaveBeenCalledTimes(3)
    })
  })

  describe('stopRefreshScheduler', () => {
    it('should clear the timer', async () => {
      const registry = createMockRegistry()
      registry.register(mockAdapter1)

      const configStore = createMockConfigStore({
        refreshInterval: 30,
        providers: [{ providerId: 'zhipu' as ProviderId, enabled: true, authType: 'apikey' as const }],
      })
      const usageStore = createMockUsageStore()

      mockFetchUsage.mockResolvedValue({
        providerId: 'zhipu',
        timestamp: Date.now(),
        metrics: [],
      })

      startRefreshScheduler(registry, configStore, usageStore)
      await vi.advanceTimersByTimeAsync(0)

      stopRefreshScheduler()
      await vi.advanceTimersByTimeAsync(30000)

      // Should not have more calls after stop
      expect(mockFetchUsage).toHaveBeenCalledTimes(1)
    })
  })

  describe('restartRefreshScheduler', () => {
    it('should restart the timer with new interval', async () => {
      const registry = createMockRegistry()
      registry.register(mockAdapter1)

      const configStore = createMockConfigStore({
        refreshInterval: 30,
        providers: [{ providerId: 'zhipu' as ProviderId, enabled: true, authType: 'apikey' as const }],
      })
      const usageStore = createMockUsageStore()

      mockFetchUsage.mockResolvedValue({
        providerId: 'zhipu',
        timestamp: Date.now(),
        metrics: [],
      })

      startRefreshScheduler(registry, configStore, usageStore)
      await vi.advanceTimersByTimeAsync(0)

      // Change interval and restart
      // Note: restartRefreshScheduler calls startRefreshScheduler which immediately calls refreshAll
      configStore.config.refreshInterval = 60
      restartRefreshScheduler(registry, configStore, usageStore)

      // Should have 2 calls (initial + restart calls refreshAll immediately)
      expect(mockFetchUsage).toHaveBeenCalledTimes(2)

      // After 30 seconds - old interval would trigger but shouldn't since restarted
      await vi.advanceTimersByTimeAsync(30000)
      expect(mockFetchUsage).toHaveBeenCalledTimes(2)

      // After 60 seconds from restart - new interval should trigger
      await vi.advanceTimersByTimeAsync(30000)
      expect(mockFetchUsage).toHaveBeenCalledTimes(3)
    })
  })
})
