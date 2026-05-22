import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VolcengineAdapter } from '@/providers/volcengine'
import type { ProviderConfig } from '@/types/data-model'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('VolcengineAdapter', () => {
  let adapter: VolcengineAdapter
  const validConfig: ProviderConfig = {
    providerId: 'volcengine',
    enabled: true,
    authType: 'oauth',
    token: 'test-volc-token',
    tokenExpireAt: Date.now() + 3600000,
  }

  beforeEach(() => {
    adapter = new VolcengineAdapter()
    vi.clearAllMocks()
  })

  describe('properties', () => {
    it('should have correct id and name', () => {
      expect(adapter.id).toBe('volcengine')
      expect(adapter.name).toBe('火山 CodingPlan')
      expect(adapter.authType).toBe('oauth')
    })
  })

  describe('validateConfig', () => {
    it('should return true for valid oauth config', () => {
      expect(adapter.validateConfig(validConfig)).toBe(true)
    })

    it('should return false when token is missing', () => {
      const noToken: ProviderConfig = {
        providerId: 'volcengine',
        enabled: true,
        authType: 'oauth',
      }
      expect(adapter.validateConfig(noToken)).toBe(false)
    })

    it('should return false when token is expired', () => {
      const expired: ProviderConfig = {
        providerId: 'volcengine',
        enabled: true,
        authType: 'oauth',
        token: 'expired',
        tokenExpireAt: Date.now() - 1000,
      }
      expect(adapter.validateConfig(expired)).toBe(false)
    })
  })

  describe('fetchUsage', () => {
    it('should return 3 progress metrics + 1 text info', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => `
          <html>
          <body>
            <div>
              <div>5小时额度：2 / 5次</div>
              <div>周额度：100 / 500次</div>
              <div>MCP月额度：5,000 / 20,000tokens</div>
              <div>今日Token消耗：30,000tokens</div>
            </div>
          </body>
          </html>
        `,
      })

      const result = await adapter.fetchUsage(validConfig)

      expect(result.providerId).toBe('volcengine')
      expect(result.error).toBeUndefined()
      expect(result.metrics.length).toBeGreaterThanOrEqual(3)

      const fiveH = result.metrics.find((m) => m.label === '5h 额度')
      expect(fiveH).toBeDefined()
      expect(fiveH!.percentage).toBe(40)

      const weekly = result.metrics.find((m) => m.label === '周额度')
      expect(weekly).toBeDefined()
      expect(weekly!.percentage).toBe(20)

      const monthly = result.metrics.find((m) => m.label === 'MCP月额度')
      expect(monthly).toBeDefined()
      expect(monthly!.percentage).toBe(25)
    })

    it('should return error on 403', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      })

      const result = await adapter.fetchUsage(validConfig)

      expect(result.error).toContain('授权')
      expect(result.metrics).toEqual([])
    })

    it('should return error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await adapter.fetchUsage(validConfig)

      expect(result.error).toContain('网络错误')
      expect(result.metrics).toEqual([])
    })

    it('should return error when token is missing', async () => {
      const noToken: ProviderConfig = {
        providerId: 'volcengine',
        enabled: true,
        authType: 'oauth',
      }

      const result = await adapter.fetchUsage(noToken)

      expect(result.error).toContain('Token')
      expect(result.metrics).toEqual([])
    })
  })
})
