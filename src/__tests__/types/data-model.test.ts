import { describe, it, expect } from 'vitest'
import {
  type ProviderId,
  type ProviderConfig,
  type UsageMetric,
  type UsageInfo,
  type AppConfig,
  createDefaultConfig,
  isProviderId,
  PROVIDER_IDS,
} from '@/types/data-model'

describe('data-model', () => {
  describe('ProviderId', () => {
    it('should contain all supported provider identifiers', () => {
      expect(PROVIDER_IDS).toEqual(['zhipu', 'minimax', 'volcengine'])
    })

    it('isProviderId should validate correct identifiers', () => {
      expect(isProviderId('zhipu')).toBe(true)
      expect(isProviderId('minimax')).toBe(true)
      expect(isProviderId('volcengine')).toBe(true)
    })

    it('isProviderId should reject invalid identifiers', () => {
      expect(isProviderId('openai')).toBe(false)
      expect(isProviderId('')).toBe(false)
      expect(isProviderId('ZHIPU')).toBe(false)
    })
  })

  describe('createDefaultConfig', () => {
    it('should return config with correct default values', () => {
      const config = createDefaultConfig()

      expect(config.refreshInterval).toBe(30)
      expect(config.carouselInterval).toBe(10)
      expect(config.panelBgColor).toBe('#333333')
      expect(config.panelOpacity).toBe(0.8)
      expect(config.panelEdge).toBe('top')
      expect(config.panelLocked).toBe(false)
      expect(config.clickThrough).toBe(false)
      expect(config.threshold1).toBe(50)
      expect(config.threshold2).toBe(80)
      expect(config.thresholdColor1).toBe('#4caf50')
      expect(config.thresholdColor2).toBe('#ff9800')
      expect(config.thresholdColor3).toBe('#f44336')
      expect(config.alertEnabled).toBe(true)
      expect(config.alertThreshold).toBe(80)
      expect(config.autoStart).toBe(false)
      expect(config.providers).toEqual([])
    })
  })

  describe('JSON serialization roundtrip', () => {
    it('should serialize and deserialize AppConfig correctly', () => {
      const original = createDefaultConfig()
      original.providers = [
        {
          providerId: 'zhipu',
          enabled: true,
          authType: 'oauth',
          token: 'test-token',
          tokenExpireAt: Date.now() + 3600000,
        },
        {
          providerId: 'minimax',
          enabled: true,
          authType: 'apikey',
          apiKey: 'test-key',
        },
      ]

      const json = JSON.stringify(original)
      const parsed: AppConfig = JSON.parse(json)

      expect(parsed).toEqual(original)
    })

    it('should serialize UsageInfo with metrics correctly', () => {
      const usage: UsageInfo = {
        providerId: 'zhipu',
        timestamp: Date.now(),
        metrics: [
          {
            label: '5h 额度',
            usedQuota: 3,
            totalQuota: 5,
            percentage: 60,
            unit: '次',
          },
          {
            label: '周额度',
            usedQuota: 150,
            totalQuota: 500,
            percentage: 30,
            unit: '次',
            resetIn: 86400,
          },
        ],
      }

      const json = JSON.stringify(usage)
      const parsed: UsageInfo = JSON.parse(json)

      expect(parsed.providerId).toBe('zhipu')
      expect(parsed.metrics).toHaveLength(2)
      expect(parsed.metrics[0].percentage).toBe(60)
      expect(parsed.metrics[1].resetIn).toBe(86400)
    })

    it('should serialize UsageInfo with error correctly', () => {
      const usage: UsageInfo = {
        providerId: 'minimax',
        timestamp: Date.now(),
        metrics: [],
        error: '认证失败：API Key 无效',
      }

      const json = JSON.stringify(usage)
      const parsed: UsageInfo = JSON.parse(json)

      expect(parsed.error).toBe('认证失败：API Key 无效')
      expect(parsed.metrics).toEqual([])
    })
  })

  describe('UsageMetric', () => {
    it('should contain all required fields', () => {
      const metric: UsageMetric = {
        label: '月额度',
        usedQuota: 1000,
        totalQuota: 5000,
        percentage: 20,
        unit: 'tokens',
      }

      expect(metric.label).toBe('月额度')
      expect(metric.usedQuota).toBe(1000)
      expect(metric.totalQuota).toBe(5000)
      expect(metric.percentage).toBe(20)
      expect(metric.unit).toBe('tokens')
      expect(metric.resetIn).toBeUndefined()
    })

    it('should support optional resetIn field', () => {
      const metric: UsageMetric = {
        label: '周额度',
        usedQuota: 0,
        totalQuota: 500,
        percentage: 0,
        unit: '次',
        resetIn: 172800,
      }

      expect(metric.resetIn).toBe(172800)
    })
  })

  describe('ProviderConfig', () => {
    it('should support apikey auth type', () => {
      const config: ProviderConfig = {
        providerId: 'minimax',
        enabled: true,
        authType: 'apikey',
        apiKey: 'sk-xxx',
      }

      expect(config.authType).toBe('apikey')
      expect(config.apiKey).toBe('sk-xxx')
    })

    it('should support oauth auth type', () => {
      const now = Date.now()
      const config: ProviderConfig = {
        providerId: 'zhipu',
        enabled: true,
        authType: 'oauth',
        token: 'oauth-token-xxx',
        tokenExpireAt: now + 3600000,
      }

      expect(config.authType).toBe('oauth')
      expect(config.token).toBe('oauth-token-xxx')
      expect(config.tokenExpireAt).toBeGreaterThan(now)
    })
  })
})
