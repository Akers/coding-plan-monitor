import type { UsageInfo, UsageMetric } from '@/types/data-model'
import { BaseHtmlOAuthAdapter } from './base-html-oauth-adapter'

/**
 * 火山 CodingPlan 适配器
 * 通过页面解析获取5小时额度、周额度、MCP月额度和今日Token消耗
 * 使用 OAuth Token 认证
 */
export class VolcengineAdapter extends BaseHtmlOAuthAdapter {
  get id() { return 'volcengine' as const }
  get name() { return '火山 CodingPlan' }
  protected get pageUrl() { return 'https://www.volcengine.com/coding-plan/usage' }

  protected parseHtml(html: string): UsageInfo {
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
}
