import { describe, it, expect, beforeEach } from 'vitest'
import type { UsageInfo, UsageMetric } from '@/types/data-model'
import { checkAlerts, resetAlertCycle } from '@/services/alert'

describe('Alert Service', () => {
  const createMockUsageInfo = (metrics: UsageMetric[]): UsageInfo => ({
    providerId: 'zhipu',
    timestamp: Date.now(),
    metrics,
  })

  const createMockConfigStore = (overrides = {}) => ({
    config: {
      alertEnabled: true,
      alertThreshold: 80,
      ...overrides,
    },
  })

  beforeEach(() => {
    resetAlertCycle()
  })

  describe('checkAlerts', () => {
    it('should return notification when usage reaches threshold', () => {
      const usageInfo = createMockUsageInfo([
        { label: '额度', usedQuota: 900, totalQuota: 1000, percentage: 90, unit: '次' },
      ])
      const configStore = createMockConfigStore()

      const notifications = checkAlerts(usageInfo, 'Zhipu', configStore)

      expect(notifications).toHaveLength(1)
      expect(notifications[0]).toEqual({
        title: '额度提醒',
        body: 'Zhipu 额度 已达 90%，请留意用量',
      })
    })

    it('should return empty array when usage is below threshold', () => {
      const usageInfo = createMockUsageInfo([
        { label: '额度', usedQuota: 500, totalQuota: 1000, percentage: 50, unit: '次' },
      ])
      const configStore = createMockConfigStore()

      const notifications = checkAlerts(usageInfo, 'Zhipu', configStore)

      expect(notifications).toHaveLength(0)
    })

    it('should return empty array when alertEnabled is false', () => {
      const usageInfo = createMockUsageInfo([
        { label: '额度', usedQuota: 900, totalQuota: 1000, percentage: 90, unit: '次' },
      ])
      const configStore = createMockConfigStore({ alertEnabled: false })

      const notifications = checkAlerts(usageInfo, 'Zhipu', configStore)

      expect(notifications).toHaveLength(0)
    })

    it('should not notify duplicate alerts in same cycle', () => {
      const usageInfo = createMockUsageInfo([
        { label: '额度', usedQuota: 900, totalQuota: 1000, percentage: 90, unit: '次' },
      ])
      const configStore = createMockConfigStore()

      // First call should notify
      const notifications1 = checkAlerts(usageInfo, 'Zhipu', configStore)
      expect(notifications1).toHaveLength(1)

      // Second call should not notify (same cycle)
      const notifications2 = checkAlerts(usageInfo, 'Zhipu', configStore)
      expect(notifications2).toHaveLength(0)
    })

    it('should notify again after resetAlertCycle', () => {
      const usageInfo = createMockUsageInfo([
        { label: '额度', usedQuota: 900, totalQuota: 1000, percentage: 90, unit: '次' },
      ])
      const configStore = createMockConfigStore()

      // First cycle
      const notifications1 = checkAlerts(usageInfo, 'Zhipu', configStore)
      expect(notifications1).toHaveLength(1)

      // Reset cycle
      resetAlertCycle()

      // New cycle - should notify again
      const notifications2 = checkAlerts(usageInfo, 'Zhipu', configStore)
      expect(notifications2).toHaveLength(1)
    })

    it('should return notifications for multiple metrics that exceed threshold', () => {
      const usageInfo = createMockUsageInfo([
        { label: '额度', usedQuota: 900, totalQuota: 1000, percentage: 90, unit: '次' },
        { label: '月额度', usedQuota: 850, totalQuota: 1000, percentage: 85, unit: '次' },
      ])
      const configStore = createMockConfigStore()

      const notifications = checkAlerts(usageInfo, 'Zhipu', configStore)

      expect(notifications).toHaveLength(2)
      expect(notifications).toContainEqual({
        title: '额度提醒',
        body: 'Zhipu 额度 已达 90%，请留意用量',
      })
      expect(notifications).toContainEqual({
        title: '额度提醒',
        body: 'Zhipu 月额度 已达 85%，请留意用量',
      })
    })

    it('should only notify for metrics that exceed threshold', () => {
      const usageInfo = createMockUsageInfo([
        { label: '额度', usedQuota: 900, totalQuota: 1000, percentage: 90, unit: '次' },
        { label: '月额度', usedQuota: 500, totalQuota: 1000, percentage: 50, unit: '次' },
      ])
      const configStore = createMockConfigStore()

      const notifications = checkAlerts(usageInfo, 'Zhipu', configStore)

      expect(notifications).toHaveLength(1)
      expect(notifications[0].body).toBe('Zhipu 额度 已达 90%，请留意用量')
    })

    it('should use exact threshold value for notification', () => {
      const usageInfo = createMockUsageInfo([
        { label: '额度', usedQuota: 800, totalQuota: 1000, percentage: 80, unit: '次' },
      ])
      const configStore = createMockConfigStore({ alertThreshold: 80 })

      const notifications = checkAlerts(usageInfo, 'Zhipu', configStore)

      expect(notifications).toHaveLength(1)
      expect(notifications[0].body).toBe('Zhipu 额度 已达 80%，请留意用量')
    })
  })
})
