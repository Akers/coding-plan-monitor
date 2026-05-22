import type { ProviderConfig, UsageInfo, UsageMetric } from '@/types/data-model'
import type { ProviderAdapter } from './types'

/**
 * 火山 CodingPlan 适配器
 * 通过页面解析获取5小时额度、周额度、MCP月额度和今日Token消耗
 * 使用 OAuth Token 认证
 */
export class VolcengineAdapter implements ProviderAdapter {
  id = 'volcengine' as const
  name = '火山 CodingPlan'
  authType = 'oauth' as const

  private readonly pageUrl = 'https://www.volcengine.com/coding-plan/usage'

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

  private parseHtml(html: string): UsageInfo {
    const metrics: UsageMetric[] = []

    // Strip HTML tags for easier regex matching
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')

    // Parse 5h quota
    const fiveHMatch = text.match(
      /5小时额度[：:]\D*?(\d+)\s*[／/]\s*(\d+)\s*次/,
    )
    if (fiveHMatch) {
      metrics.push(
        this.createMetric(
          '5h 额度',
          parseInt(fiveHMatch[1]),
          parseInt(fiveHMatch[2]),
          '次',
        ),
      )
    }

    // Parse weekly quota
    const weeklyMatch = text.match(/周额度[：:]\D*?(\d+)\s*[／/]\s*(\d+)\s*次/)
    if (weeklyMatch) {
      metrics.push(
        this.createMetric(
          '周额度',
          parseInt(weeklyMatch[1]),
          parseInt(weeklyMatch[2]),
          '次',
        ),
      )
    }

    // Parse monthly MCP quota
    const monthlyMatch = text.match(
      /MCP月额度[：:]\D*?([\d,]+)\s*[／/]\s*([\d,]+)\s*tokens/,
    )
    if (monthlyMatch) {
      const used = parseInt(monthlyMatch[1].replace(/,/g, ''))
      const total = parseInt(monthlyMatch[2].replace(/,/g, ''))
      metrics.push(this.createMetric('MCP月额度', used, total, 'tokens'))
    }

    // Parse today's token consumption
    const todayMatch = text.match(
      /今日Token消耗[：:]\D*?([\d,]+)\s*tokens/,
    )
    if (todayMatch) {
      const value = parseInt(todayMatch[1].replace(/,/g, ''))
      metrics.push({
        label: '今日Token消耗',
        usedQuota: value,
        totalQuota: 0,
        percentage: 0,
        unit: 'tokens',
      })
    }

    return {
      providerId: 'volcengine',
      timestamp: Date.now(),
      metrics,
    }
  }

  private createMetric(
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

  private errorResult(error: string): UsageInfo {
    return {
      providerId: 'volcengine',
      timestamp: Date.now(),
      metrics: [],
      error,
    }
  }
}
