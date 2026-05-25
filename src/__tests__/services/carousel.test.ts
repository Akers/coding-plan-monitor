import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ProviderId } from '@/types/data-model'

const createMockConfigStore = (overrides = {}) => {
  const defaultConfig = {
    refreshInterval: 30,
    carouselInterval: 10,
    providers: [
      { providerId: 'zhipu' as ProviderId, enabled: true, authType: 'apikey' as const },
      { providerId: 'minimax' as ProviderId, enabled: true, authType: 'apikey' as const },
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
  nextProvider: vi.fn(),
})

describe('Carousel Service', () => {
  let startCarousel: any
  let stopCarousel: any
  let resetCarousel: any
  let restartCarousel: any

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })

    // Import the carousel module
    const carouselModule = await import('@/services/carousel')
    startCarousel = carouselModule.startCarousel
    stopCarousel = carouselModule.stopCarousel
    resetCarousel = carouselModule.resetCarousel
    restartCarousel = carouselModule.restartCarousel
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('startCarousel', () => {
    it('should create a timer that calls nextProvider periodically', async () => {
      const usageStore = createMockUsageStore()
      const configStore = createMockConfigStore({
        carouselInterval: 10,
      })

      startCarousel(usageStore, configStore)

      // After 10 seconds
      await vi.advanceTimersByTimeAsync(10000)
      expect(usageStore.nextProvider).toHaveBeenCalledTimes(1)

      // After 20 seconds total
      await vi.advanceTimersByTimeAsync(10000)
      expect(usageStore.nextProvider).toHaveBeenCalledTimes(2)

      // After 30 seconds total
      await vi.advanceTimersByTimeAsync(10000)
      expect(usageStore.nextProvider).toHaveBeenCalledTimes(3)
    })

    it('should read carouselInterval from configStore.config.carouselInterval', async () => {
      const usageStore = createMockUsageStore()
      const configStore = createMockConfigStore({
        carouselInterval: 15,
      })

      startCarousel(usageStore, configStore)

      // After 15 seconds
      await vi.advanceTimersByTimeAsync(15000)
      expect(usageStore.nextProvider).toHaveBeenCalledTimes(1)

      // After 30 seconds total
      await vi.advanceTimersByTimeAsync(15000)
      expect(usageStore.nextProvider).toHaveBeenCalledTimes(2)
    })
  })

  describe('stopCarousel', () => {
    it('should clear the timer', async () => {
      const usageStore = createMockUsageStore()
      const configStore = createMockConfigStore({
        carouselInterval: 10,
      })

      startCarousel(usageStore, configStore)
      await vi.advanceTimersByTimeAsync(10000)

      stopCarousel()
      await vi.advanceTimersByTimeAsync(10000)

      // Should not have more calls after stop
      expect(usageStore.nextProvider).toHaveBeenCalledTimes(1)
    })
  })

  describe('resetCarousel', () => {
    it('should reset the timer so nextProvider is called at next interval', async () => {
      const usageStore = createMockUsageStore()
      const configStore = createMockConfigStore({
        carouselInterval: 10,
      })

      startCarousel(usageStore, configStore)

      // Advance 5 seconds
      await vi.advanceTimersByTimeAsync(5000)

      // Manual switch resets timer
      usageStore.nextProvider()
      resetCarousel()

      // After 5 more seconds (10 total from start) - old timer would trigger but shouldn't since reset
      await vi.advanceTimersByTimeAsync(5000)
      expect(usageStore.nextProvider).toHaveBeenCalledTimes(1) // Only the manual one

      // After 10 more seconds (15 total from start, 10 from reset)
      await vi.advanceTimersByTimeAsync(10000)
      expect(usageStore.nextProvider).toHaveBeenCalledTimes(2)
    })
  })

  describe('restartCarousel', () => {
    it('should stop current timer and start a new one with updated config', async () => {
      const usageStore = createMockUsageStore()
      const configStore = createMockConfigStore({
        carouselInterval: 10,
      })

      startCarousel(usageStore, configStore)
      await vi.advanceTimersByTimeAsync(10000)

      // Change interval and restart
      configStore.config.carouselInterval = 20
      restartCarousel(usageStore, configStore)

      // Should have one call from initial interval
      expect(usageStore.nextProvider).toHaveBeenCalledTimes(1)

      // After 10 more seconds - old interval would trigger but shouldn't
      await vi.advanceTimersByTimeAsync(10000)
      expect(usageStore.nextProvider).toHaveBeenCalledTimes(1)

      // After 20 more seconds from restart - new interval should trigger
      await vi.advanceTimersByTimeAsync(20000)
      expect(usageStore.nextProvider).toHaveBeenCalledTimes(2)
    })
  })

  describe('edge cases', () => {
    it('should not start carousel when only one provider is enabled', async () => {
      const usageStore = createMockUsageStore()
      const configStore = createMockConfigStore({
        carouselInterval: 10,
        providers: [
          { providerId: 'zhipu' as ProviderId, enabled: true, authType: 'apikey' as const },
        ],
      })

      // Mock enabledProviders to return only one provider
      vi.spyOn(usageStore, 'setEnabledProviders').mockImplementation((_ids: ProviderId[]) => {
        // Simulate single provider
      })

      startCarousel(usageStore, configStore)

      // Even after long time, nextProvider should not be called
      await vi.advanceTimersByTimeAsync(30000)
      expect(usageStore.nextProvider).not.toHaveBeenCalled()
    })
  })
})
