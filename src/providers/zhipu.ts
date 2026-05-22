import type { UsageInfo, UsageMetric } from '@/types/data-model'
import { BaseHtmlOAuthAdapter } from './base-html-oauth-adapter'

/**
 * 智谱 CodingPlan 适配器
 * 通过页面解析获取5小时额度、周额度、MCP月额度和今日Token消耗
 * 使用 OAuth Token 认证
 */
export class ZhipuAdapter extends BaseHtmlOAuthAdapter {
  get id() { return 'zhipu' as const }
  get name() { return '智谱 CodingPlan' }
  protected get pageUrl() { return 'https://open.bigmodel.cn/coding-plan/usage' }

  protected parseHtml(html: string): UsageInfo {
    const metrics: UsageMetric[] = []

    // Strip HTML tags for easier regex matching
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')

    // Parse 5h quota: e.g. "3/5次"
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

    // Parse weekly quota: e.g. "150/500次"
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

    // Parse monthly MCP quota: e.g. "2000/10000tokens"
    const monthlyMatch = text.match(
      /MCP月额度[：:]\D*?([\d,]+)\s*[／/]\s*([\d,]+)\s*tokens/,
    )
    if (monthlyMatch) {
      const used = parseInt(monthlyMatch[1].replace(/,/g, ''))
      const total = parseInt(monthlyMatch[2].replace(/,/g, ''))
      metrics.push(this.createMetric('MCP月额度', used, total, 'tokens'))
    }

    // Parse today's token consumption (text info, not a progress bar)
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
      providerId: 'zhipu',
      timestamp: Date.now(),
      metrics,
    }
  }
}
