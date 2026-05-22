import type { ProviderId, ProviderConfig, UsageInfo } from '@/types/data-model'

/**
 * 供应商适配器接口
 * 所有供应商适配器 MUST 实现该接口
 */
export interface ProviderAdapter {
  /** 供应商 ID */
  id: ProviderId
  /** 适配器显示名称 */
  name: string
  /** 鉴权方式 */
  authType: 'apikey' | 'oauth'

  /**
   * 获取额度使用数据
   * @param config 供应商配置（含鉴权信息）
   * @returns 额度信息（成功返回 metrics，失败返回 error）
   */
  fetchUsage(config: ProviderConfig): Promise<UsageInfo>

  /**
   * 验证配置是否有效
   * @param config 供应商配置
   * @returns 配置是否可用于 fetchUsage
   */
  validateConfig(config: ProviderConfig): boolean
}

/**
 * 供应商注册表接口
 */
export interface ProviderRegistry {
  /** 注册适配器 */
  register(adapter: ProviderAdapter): void
  /** 根据 ID 获取适配器 */
  get(id: ProviderId): ProviderAdapter | undefined
  /** 获取所有已注册适配器 */
  getAll(): ProviderAdapter[]
}
