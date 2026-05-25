import type { ProviderConfig, UsageInfo, UsageMetric } from '@/types/data-model'
import type { ProviderAdapter } from './types'

interface MiniMaxResponse {
  model_remains?: MiniMaxRemain[]
  base_resp?: {
    status_code?: number
    status_msg?: string
  }
}

interface MiniMaxRemain {
  model_name?: string
  current_interval_total_count?: number
  current_interval_usage_count?: number
  current_weekly_total_count?: number
  current_weekly_usage_count?: number
}

/**
 * MiniMax TokenPlan 适配器
 * 通过 REST API 获取文本生成和图像生成的额度数据
 * 使用 Bearer Token 认证
 */
export class MiniMaxAdapter implements ProviderAdapter {
  id = 'minimax' as const
  name = 'MiniMax TokenPlan'
  authType = 'apikey' as const

  private readonly apiUrl = 'https://www.minimaxi.com/v1/token_plan/remains'

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
          'User-Agent': 'coding-plan-monitor',
          'Accept': '*/*',
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

  private parseResponse(data: MiniMaxResponse): UsageInfo {
    const statusCode = data?.base_resp?.status_code
    if (statusCode && statusCode !== 0) {
      if (statusCode === 1004) {
        return this.errorResult('API Key 无效或已过期')
      }
      return this.errorResult(data.base_resp?.status_msg || `请求失败: ${statusCode}`)
    }

    const planList = data?.model_remains
    if (!Array.isArray(planList)) {
      return this.errorResult('API 响应格式异常')
    }

    const metrics: UsageMetric[] = []

    // Separate text and image models
    const textPlans = planList.filter(
      (p) => p.model_name?.startsWith('MiniMax-M'),
    )
    const imagePlans = planList.filter(
      (p) => p.model_name === 'coding-plan-vlm',
    )

    // Use first text plan for text metrics
    if (textPlans.length > 0) {
      this.addPlanMetrics(metrics, textPlans[0], '文本')
    }

    // Use first image plan for image metrics
    if (imagePlans.length > 0) {
      this.addPlanMetrics(metrics, imagePlans[0], '图像')
    }

    return {
      providerId: 'minimax',
      timestamp: Date.now(),
      metrics,
    }
  }

  private addPlanMetrics(
    metrics: UsageMetric[],
    plan: MiniMaxRemain,
    labelPrefix: '文本' | '图像',
  ): void {
    metrics.push(
      this.createMetric(
        `${labelPrefix} 5h 额度`,
        plan.current_interval_usage_count ?? 0,
        plan.current_interval_total_count ?? 0,
      ),
    )

    metrics.push(
      this.createMetric(
        `${labelPrefix}周额度`,
        plan.current_weekly_usage_count ?? 0,
        plan.current_weekly_total_count ?? 0,
      ),
    )
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
