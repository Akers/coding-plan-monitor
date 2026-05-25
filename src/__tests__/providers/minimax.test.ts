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
          model_remains: [
            {
              model_name: 'MiniMax-M1',
              current_interval_usage_count: 10,
              current_interval_total_count: 50,
              current_weekly_usage_count: 100,
              current_weekly_total_count: 500,
            },
            {
              model_name: 'coding-plan-vlm',
              current_interval_usage_count: 5,
              current_interval_total_count: 10,
              current_weekly_usage_count: 50,
              current_weekly_total_count: 100,
            },
          ],
          base_resp: { status_code: 0, status_msg: 'success' },
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
        json: async () => ({
          model_remains: [],
          base_resp: { status_code: 0, status_msg: 'success' },
        }),
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

    it('should parse real MiniMax response with wildcard text model and coding plan VLM', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          model_remains: [
            {
              start_time: 1779674400000,
              end_time: 1779692400000,
              remains_time: 4953040,
              current_interval_total_count: 1500,
              current_interval_usage_count: 64,
              model_name: 'MiniMax-M*',
              current_weekly_total_count: 0,
              current_weekly_usage_count: 0,
              weekly_start_time: 1779638400000,
              weekly_end_time: 1780243200000,
              weekly_remains_time: 555753040,
            },
            {
              start_time: 1779674400000,
              end_time: 1779692400000,
              remains_time: 4953012,
              current_interval_total_count: 150,
              current_interval_usage_count: 0,
              model_name: 'coding-plan-vlm',
              current_weekly_total_count: 0,
              current_weekly_usage_count: 0,
              weekly_start_time: 1779638400000,
              weekly_end_time: 1780243200000,
              weekly_remains_time: 555753012,
            },
          ],
          category_remains: [
            {
              category: 'text_generation',
              display_name: '文本生成',
              current_interval_total_count: 1500,
              current_interval_usage_count: 64,
              current_weekly_total_count: 0,
              current_weekly_usage_count: 0,
            },
          ],
          base_resp: { status_code: 0, status_msg: 'success' },
        }),
      })

      const result = await adapter.fetchUsage(validConfig)

      expect(result.error).toBeUndefined()
      expect(result.metrics).toHaveLength(2)
      expect(result.metrics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            label: '文本 5h 额度',
            usedQuota: 64,
            totalQuota: 1500,
            percentage: 4,
          }),
          expect.objectContaining({
            label: '图像 5h 额度',
            usedQuota: 0,
            totalQuota: 150,
            percentage: 0,
          }),
        ]),
      )
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.minimaxi.com/v1/token_plan/remains',
        expect.any(Object),
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

    it('should return empty metrics when model_remains is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          model_remains: [],
          base_resp: { status_code: 0, status_msg: 'success' },
        }),
      })

      const result = await adapter.fetchUsage(validConfig)

      expect(result.error).toBeUndefined()
      expect(result.metrics).toEqual([])
    })

    it('should return API key error when base_resp status code is 1004', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          base_resp: { status_code: 1004, status_msg: 'token plan api key invalid' },
        }),
      })

      const result = await adapter.fetchUsage(validConfig)

      expect(result.error).toContain('API Key 无效或已过期')
      expect(result.metrics).toEqual([])
    })

    it('should return status message when base_resp indicates business error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          base_resp: { status_code: 1234, status_msg: 'quota service unavailable' },
        }),
      })

      const result = await adapter.fetchUsage(validConfig)

      expect(result.error).toContain('quota service unavailable')
      expect(result.metrics).toEqual([])
    })

    it('should return format error when model_remains is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          base_resp: { status_code: 0, status_msg: 'success' },
        }),
      })

      const result = await adapter.fetchUsage(validConfig)

      expect(result.error).toContain('API 响应格式异常')
      expect(result.metrics).toEqual([])
    })

    it('should return format error when model_remains is not an array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          model_remains: {},
          base_resp: { status_code: 0, status_msg: 'success' },
        }),
      })

      const result = await adapter.fetchUsage(validConfig)

      expect(result.error).toContain('API 响应格式异常')
      expect(result.metrics).toEqual([])
    })

    it('should skip weekly metric when weekly total is zero', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          model_remains: [
            {
              model_name: 'MiniMax-M2.7',
              current_interval_usage_count: 151,
              current_interval_total_count: 1500,
              current_weekly_usage_count: 0,
              current_weekly_total_count: 0,
            },
          ],
          base_resp: { status_code: 0, status_msg: 'success' },
        }),
      })

      const result = await adapter.fetchUsage(validConfig)

      expect(result.error).toBeUndefined()
      expect(result.metrics).toHaveLength(1)
      expect(result.metrics[0].label).toBe('文本 5h 额度')
      expect(result.metrics[0].percentage).toBe(10)
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
