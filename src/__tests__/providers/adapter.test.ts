import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { ProviderAdapter, ProviderRegistry } from '@/providers/types'
import { createProviderRegistry } from '@/providers/registry'
import type { ProviderConfig, UsageInfo, UsageMetric } from '@/types/data-model'

// ============================================================
// 测试用 Mock 适配器
// ============================================================
function createMockAdapter(id: string): ProviderAdapter {
  return {
    id: id as any,
    name: `Mock ${id}`,
    authType: 'apikey',
    async fetchUsage(config: ProviderConfig): Promise<UsageInfo> {
      return {
        providerId: id as any,
        timestamp: Date.now(),
        metrics: [
          {
            label: '测试额度',
            usedQuota: 10,
            totalQuota: 100,
            percentage: 10,
            unit: '次',
          },
        ],
      }
    },
    validateConfig(config: ProviderConfig): boolean {
      return config.authType === 'apikey' ? !!config.apiKey : !!config.token
    },
  }
}

describe('ProviderAdapter interface', () => {
  it('should define fetchUsage returning UsageInfo', async () => {
    const adapter = createMockAdapter('minimax')
    const config: ProviderConfig = {
      providerId: 'minimax',
      enabled: true,
      authType: 'apikey',
      apiKey: 'test-key',
    }

    const result = await adapter.fetchUsage(config)

    expect(result.providerId).toBe('minimax')
    expect(result.timestamp).toBeGreaterThan(0)
    expect(result.metrics).toHaveLength(1)
    expect(result.metrics[0].label).toBe('测试额度')
  })

  it('should define validateConfig for apikey auth', () => {
    const adapter = createMockAdapter('minimax')

    const valid: ProviderConfig = {
      providerId: 'minimax',
      enabled: true,
      authType: 'apikey',
      apiKey: 'sk-xxx',
    }
    const invalid: ProviderConfig = {
      providerId: 'minimax',
      enabled: true,
      authType: 'apikey',
    }

    expect(adapter.validateConfig(valid)).toBe(true)
    expect(adapter.validateConfig(invalid)).toBe(false)
  })

  it('should define validateConfig for oauth auth', () => {
    const adapter = createMockAdapter('zhipu')

    const valid: ProviderConfig = {
      providerId: 'zhipu',
      enabled: true,
      authType: 'oauth',
      token: 'oauth-token',
      tokenExpireAt: Date.now() + 3600000,
    }
    const invalid: ProviderConfig = {
      providerId: 'zhipu',
      enabled: true,
      authType: 'oauth',
    }

    expect(adapter.validateConfig(valid)).toBe(true)
    expect(adapter.validateConfig(invalid)).toBe(false)
  })

  it('should handle fetchUsage errors gracefully', async () => {
    const adapter: ProviderAdapter = {
      id: 'zhipu',
      name: 'Mock Error',
      authType: 'oauth',
      async fetchUsage(): Promise<UsageInfo> {
        return {
          providerId: 'zhipu',
          timestamp: Date.now(),
          metrics: [],
          error: '认证失败：Token 已过期',
        }
      },
      validateConfig: () => true,
    }

    const result = await adapter.fetchUsage({} as ProviderConfig)
    expect(result.error).toBe('认证失败：Token 已过期')
    expect(result.metrics).toEqual([])
  })
})

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry

  beforeEach(() => {
    registry = createProviderRegistry()
  })

  it('should register and retrieve adapter by id', () => {
    const adapter = createMockAdapter('minimax')
    registry.register(adapter)

    const found = registry.get('minimax')
    expect(found).toBe(adapter)
  })

  it('should return undefined for unknown provider', () => {
    const found = registry.get('unknown')
    expect(found).toBeUndefined()
  })

  it('should list all registered adapters', () => {
    registry.register(createMockAdapter('zhipu'))
    registry.register(createMockAdapter('minimax'))
    registry.register(createMockAdapter('volcengine'))

    const all = registry.getAll()
    expect(all).toHaveLength(3)
    expect(all.map((a) => a.id)).toEqual(['zhipu', 'minimax', 'volcengine'])
  })

  it('should overwrite adapter on re-register', () => {
    const adapter1 = createMockAdapter('zhipu')
    const adapter2 = { ...createMockAdapter('zhipu'), name: 'Updated Zhipu' }

    registry.register(adapter1)
    registry.register(adapter2)

    const found = registry.get('zhipu')
    expect(found?.name).toBe('Updated Zhipu')
    expect(registry.getAll()).toHaveLength(1)
  })
})
