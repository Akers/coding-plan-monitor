import type { ProviderId, ProviderConfig, UsageInfo, UsageMetric } from '@/types/data-model'
import type { ProviderAdapter } from './types'

/**
 * 基于 HTML 页面解析的 OAuth 适配器基类
 * 智谱、火山等使用相同页面解析模式的供应商可继承此类
 */
export abstract class BaseHtmlOAuthAdapter implements ProviderAdapter {
  abstract get id(): ProviderId
  abstract get name(): string
  protected abstract get pageUrl(): string
  authType = 'oauth' as const

  validateConfig(config: ProviderConfig): boolean {
    if (!config.token) return false
    if (config.tokenExpireAt && config.tokenExpireAt < Date.now()) return false
    return true
  }

  async fetchUsage(config: ProviderConfig): Promise<UsageInfo> {
    if (!config.token) {
      return this.errorResult('Token 未配置，请先完成 OAuth 授权')
    }

    if (config.tokenExpireAt && config.tokenExpireAt < Date.now()) {
      return this.errorResult('Token 已过期，请重新授权')
    }

    try {
      const response = await fetch(this.pageUrl, {
        headers: {
          Authorization: `Bearer ${config.token}`,
          'Content-Type': 'text/html',
        },
      })

      if (!response.ok) {
        if (response.status === 403) {
          return this.errorResult('授权已失效，请重新授权')
        }
        return this.errorResult(`请求失败: HTTP ${response.status}`)
      }

      const html = await response.text()
      return this.parseHtml(html)
    } catch (err) {
      return this.errorResult(
        `网络错误: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  protected abstract parseHtml(html: string): UsageInfo

  protected createMetric(
    label: string,
    used: number,
    total: number,
    unit: string,
  ): UsageMetric {
    const percentage = total > 0 ? Math.round((used / total) * 100) : 0
    return {
      label,
      usedQuota: used,
      totalQuota: total,
      percentage,
      unit,
    }
  }

  protected errorResult(error: string): UsageInfo {
    return {
      providerId: this.id as any,
      timestamp: Date.now(),
      metrics: [],
      error,
    }
  }
}
