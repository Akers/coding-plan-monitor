import type { ProviderId } from '@/types/data-model'
import type { ProviderAdapter, ProviderRegistry } from './types'

/**
 * 创建供应商注册表
 */
export function createProviderRegistry(): ProviderRegistry {
  const adapters = new Map<ProviderId, ProviderAdapter>()

  return {
    register(adapter: ProviderAdapter): void {
      adapters.set(adapter.id, adapter)
    },

    get(id: ProviderId): ProviderAdapter | undefined {
      return adapters.get(id)
    },

    getAll(): ProviderAdapter[] {
      return Array.from(adapters.values())
    },
  }
}
