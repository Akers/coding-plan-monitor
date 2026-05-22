import type { ProviderConfig, UsageInfo, UsageMetric } from '@/types/data-model'
import type { ProviderAdapter } from './types'

/**
 * MiniMax TokenPlan 适配器
 * 通过 REST API 获取文本生成和图像生成的额度数据
 * 使用 Bearer Token 认证
 */
export class MiniMaxAdapter implements ProviderAdapter {
  id = 'minimax' as const
  name = 'MiniMax TokenPlan'
  authType = 'apikey' as const

  private readonly apiUrl = 'https://api.minimax.chat/v1/token_plan'

  validateConfig(config: ProviderConfig): boolean {
    return !!config.apiKey && config.apiKey.length > 0
  }

  async fetchUsage(config: ProviderConfig): Promise<UsageInfo> {
    if (!config.apiKey) {
      return this.errorResult('API Key 未配置')
    }

    try {
      const response = await fetch(this.apiUrl, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          return this.errorResult('认证失败：API Key 无效')
        }
        return this.errorResult(`请求失败: HTTP ${response.status}`)
      }

      const data = await response.json()
      return this.parseResponse(data)
    } catch (err) {
      return this.errorResult(
        `网络错误: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  private parseResponse(data: any): UsageInfo {
    const planList = data?.data?.plan_info_list
    if (!Array.isArray(planList)) {
      return this.errorResult('API 响应格式异常')
    }

    const metrics: UsageMetric[] = []

    // Separate text and image models
    const textPlans = planList.filter(
      (p: any) => p.model_name?.startsWith('MiniMax-M'),
    )
    const imagePlans = planList.filter(
      (p: any) => p.model_name === 'coding-plan-vlm',
    )

    // Use first text plan for text metrics
    if (textPlans.length > 0) {
      const tp = textPlans[0]
      metrics.push(
        this.createMetric(
          '文本 5h 额度',
          tp.five_hours_total - tp.five_hours_remaining,
          tp.five_hours_total,
        ),
      )
      metrics.push(
        this.createMetric(
          '文本周额度',
          tp.weekly_total - tp.weekly_remaining,
          tp.weekly_total,
        ),
      )
    }

    // Use first image plan for image metrics
    if (imagePlans.length > 0) {
      const ip = imagePlans[0]
      metrics.push(
        this.createMetric(
          '图像 5h 额度',
          ip.five_hours_total - ip.five_hours_remaining,
          ip.five_hours_total,
        ),
      )
      metrics.push(
        this.createMetric(
          '图像周额度',
          ip.weekly_total - ip.weekly_remaining,
          ip.weekly_total,
        ),
      )
    }

    return {
      providerId: 'minimax',
      timestamp: Date.now(),
      metrics,
    }
  }

  private createMetric(
    label: string,
    used: number,
    total: number,
  ): UsageMetric {
    const percentage = total > 0 ? Math.round((used / total) * 100) : 0
    return {
      label,
      usedQuota: used,
      totalQuota: total,
      percentage,
      unit: '次',
    }
  }

  private errorResult(error: string): UsageInfo {
    return {
      providerId: 'minimax',
      timestamp: Date.now(),
      metrics: [],
      error,
    }
  }
}
