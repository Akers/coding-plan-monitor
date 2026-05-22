import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ZhipuAdapter } from '@/providers/zhipu'
import type { ProviderConfig } from '@/types/data-model'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('ZhipuAdapter', () => {
  let adapter: ZhipuAdapter
  const validConfig: ProviderConfig = {
    providerId: 'zhipu',
    enabled: true,
    authType: 'oauth',
    token: 'test-oauth-token',
    tokenExpireAt: Date.now() + 3600000,
  }

  beforeEach(() => {
    adapter = new ZhipuAdapter()
    vi.clearAllMocks()
  })

  describe('properties', () => {
    it('should have correct id and name', () => {
      expect(adapter.id).toBe('zhipu')
      expect(adapter.name).toBe('智谱 CodingPlan')
      expect(adapter.authType).toBe('oauth')
    })
  })

  describe('validateConfig', () => {
    it('should return true for valid oauth config with unexpired token', () => {
      expect(adapter.validateConfig(validConfig)).toBe(true)
    })

    it('should return false when token is missing', () => {
      const noToken: ProviderConfig = {
        providerId: 'zhipu',
        enabled: true,
        authType: 'oauth',
      }
      expect(adapter.validateConfig(noToken)).toBe(false)
    })

    it('should return false when token is expired', () => {
      const expired: ProviderConfig = {
        providerId: 'zhipu',
        enabled: true,
        authType: 'oauth',
        token: 'expired-token',
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
            <div class="quota-info">
              <div class="item">5小时额度：<span class="used">3</span>/<span class="total">5</span>次</div>
              <div class="item">周额度：<span class="used">150</span>/<span class="total">500</span>次</div>
              <div class="item">MCP月额度：<span class="used">2000</span>/<span class="total">10000</span>tokens</div>
              <div class="item">今日Token消耗：<span class="value">50,000</span>tokens</div>
            </div>
          </body>
          </html>
        `,
      })

      const result = await adapter.fetchUsage(validConfig)

      expect(result.providerId).toBe('zhipu')
      expect(result.error).toBeUndefined()
      expect(result.metrics.length).toBeGreaterThanOrEqual(3)

      // Check 5h quota
      const fiveH = result.metrics.find((m) => m.label === '5h 额度')
      expect(fiveH).toBeDefined()
      expect(fiveH!.percentage).toBe(60) // 3/5

      // Check weekly quota
      const weekly = result.metrics.find((m) => m.label === '周额度')
      expect(weekly).toBeDefined()
      expect(weekly!.percentage).toBe(30) // 150/500

      // Check monthly MCP quota
      const monthly = result.metrics.find((m) => m.label === 'MCP月额度')
      expect(monthly).toBeDefined()
      expect(monthly!.percentage).toBe(20) // 2000/10000
    })

    it('should send authorization header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '<html><body>empty</body></html>',
      })

      await adapter.fetchUsage(validConfig)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('test-oauth-token'),
          }),
        }),
      )
    })

    it('should return error on 403 (authorization expired)', async () => {
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
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

      const result = await adapter.fetchUsage(validConfig)

      expect(result.error).toContain('网络错误')
      expect(result.metrics).toEqual([])
    })

    it('should return error when token is missing', async () => {
      const noToken: ProviderConfig = {
        providerId: 'zhipu',
        enabled: true,
        authType: 'oauth',
      }

      const result = await adapter.fetchUsage(noToken)

      expect(result.error).toContain('Token')
      expect(result.metrics).toEqual([])
    })
  })
})
