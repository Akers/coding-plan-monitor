import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MiniMaxAdapter } from '@/providers/minimax'
import type { ProviderConfig } from '@/types/data-model'

// Mock global fetch
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('MiniMaxAdapter', () => {
  let adapter: MiniMaxAdapter
  const validConfig: ProviderConfig = {
    providerId: 'minimax',
    enabled: true,
    authType: 'apikey',
    apiKey: 'sk-test-api-key',
  }

  beforeEach(() => {
    adapter = new MiniMaxAdapter()
    vi.clearAllMocks()
  })

  describe('properties', () => {
    it('should have correct id and name', () => {
      expect(adapter.id).toBe('minimax')
      expect(adapter.name).toBe('MiniMax TokenPlan')
      expect(adapter.authType).toBe('apikey')
    })
  })

  describe('validateConfig', () => {
    it('should return true for valid apikey config', () => {
      expect(adapter.validateConfig(validConfig)).toBe(true)
    })

    it('should return false when apiKey is empty', () => {
      const noKey: ProviderConfig = {
        providerId: 'minimax',
        enabled: true,
        authType: 'apikey',
        apiKey: '',
      }
      expect(adapter.validateConfig(noKey)).toBe(false)
    })

    it('should return false when apiKey is missing', () => {
      const noKey: ProviderConfig = {
        providerId: 'minimax',
        enabled: true,
        authType: 'apikey',
      }
      expect(adapter.validateConfig(noKey)).toBe(false)
    })
  })

  describe('fetchUsage', () => {
    it('should return metrics for successful API call', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            plan_info_list: [
              {
                model_name: 'MiniMax-M1',
                task_type: 'text',
                five_hours_remaining: 40,
                five_hours_total: 50,
                weekly_remaining: 400,
                weekly_total: 500,
              },
              {
                model_name: 'coding-plan-vlm',
                task_type: 'image',
                five_hours_remaining: 5,
                five_hours_total: 10,
                weekly_remaining: 50,
                weekly_total: 100,
              },
            ],
          },
        }),
      })

      const result = await adapter.fetchUsage(validConfig)

      expect(result.providerId).toBe('minimax')
      expect(result.error).toBeUndefined()
      expect(result.metrics).toHaveLength(4)

      // Text 5h
      const text5h = result.metrics.find((m) => m.label === '文本 5h 额度')
      expect(text5h).toBeDefined()
      expect(text5h!.percentage).toBe(20) // 10/50 used

      // Text weekly
      const textWeekly = result.metrics.find((m) => m.label === '文本周额度')
      expect(textWeekly).toBeDefined()
      expect(textWeekly!.percentage).toBe(20) // 100/500

      // Image 5h
      const image5h = result.metrics.find((m) => m.label === '图像 5h 额度')
      expect(image5h).toBeDefined()
      expect(image5h!.percentage).toBe(50) // 5/10

      // Image weekly
      const imageWeekly = result.metrics.find((m) => m.label === '图像周额度')
      expect(imageWeekly).toBeDefined()
      expect(imageWeekly!.percentage).toBe(50) // 50/100
    })

    it('should send correct API URL and request headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { plan_info_list: [] } }),
      })

      await adapter.fetchUsage(validConfig)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.minimaxi.com/v1/token_plan/remains',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer sk-test-api-key',
            'Content-Type': 'application/json',
            'User-Agent': 'coding-plan-monitor',
            'Accept': '*/*',
          }),
        }),
      )
    })

    it('should return error on 401 unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      const result = await adapter.fetchUsage(validConfig)

      expect(result.error).toContain('认证失败')
      expect(result.metrics).toEqual([])
    })

    it('should return error on HTTP 404 (the original bug)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      const result = await adapter.fetchUsage(validConfig)

      expect(result.error).toContain('请求失败')
      expect(result.error).toContain('404')
      expect(result.metrics).toEqual([])
    })

    it('should return empty metrics when plan_info_list is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { plan_info_list: [] } }),
      })

      const result = await adapter.fetchUsage(validConfig)

      expect(result.error).toBeUndefined()
      expect(result.metrics).toEqual([])
    })

    it('should return error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await adapter.fetchUsage(validConfig)

      expect(result.error).toContain('网络错误')
      expect(result.metrics).toEqual([])
    })

    it('should return error when apiKey is missing', async () => {
      const noKeyConfig: ProviderConfig = {
        providerId: 'minimax',
        enabled: true,
        authType: 'apikey',
      }

      const result = await adapter.fetchUsage(noKeyConfig)

      expect(result.error).toContain('API Key')
      expect(result.metrics).toEqual([])
    })
  })
})
