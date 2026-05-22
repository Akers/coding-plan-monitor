/**
 * 核心数据模型类型定义
 * 用于 Coding Plan Monitor 的所有数据结构
 */

// ============================================================
// ProviderId - 供应商标识符
// ============================================================

/** 所有支持的供应商 ID */
export const PROVIDER_IDS = ['zhipu', 'minimax', 'volcengine'] as const

/** 供应商 ID 联合类型 */
export type ProviderId = (typeof PROVIDER_IDS)[number]

/** 运行时校验是否为合法 ProviderId */
export function isProviderId(value: string): value is ProviderId {
  return (PROVIDER_IDS as readonly string[]).includes(value)
}

// ============================================================
// ProviderConfig - 供应商配置
// ============================================================

/** 鉴权方式 */
export type AuthType = 'apikey' | 'oauth'

/** 供应商配置 */
export interface ProviderConfig {
  /** 供应商 ID */
  providerId: ProviderId
  /** 是否启用 */
  enabled: boolean
  /** 鉴权方式 */
  authType: AuthType
  /** API Key（authType 为 apikey 时使用） */
  apiKey?: string
  /** OAuth Token（authType 为 oauth 时使用） */
  token?: string
  /** OAuth Token 过期时间（Unix 时间戳毫秒） */
  tokenExpireAt?: number
}

// ============================================================
// UsageMetric - 单个额度维度
// ============================================================

/** 单个额度维度数据 */
export interface UsageMetric {
  /** 维度名称（如 "5h 额度"、"周额度"） */
  label: string
  /** 已用额度 */
  usedQuota: number
  /** 总额度 */
  totalQuota: number
  /** 使用百分比 (0-100) */
  percentage: number
  /** 单位（如 "次"、"tokens"） */
  unit: string
  /** 距离重置的秒数（可选） */
  resetIn?: number
}

// ============================================================
// UsageInfo - 供应商额度信息
// ============================================================

/** 供应商额度信息（成功或失败） */
export interface UsageInfo {
  /** 供应商 ID */
  providerId: ProviderId
  /** 数据获取时间戳（毫秒） */
  timestamp: number
  /** 额度维度数组 */
  metrics: UsageMetric[]
  /** 附加信息（可选） */
  extraInfo?: string
  /** 错误信息（获取失败时） */
  error?: string
}

// ============================================================
// AppConfig - 应用配置
// ============================================================

/** 面板吸附边 */
export type PanelEdge = 'top' | 'bottom' | 'left' | 'right'

/** 应用配置 */
export interface AppConfig {
  /** 数据刷新间隔（秒） */
  refreshInterval: number
  /** 供应商轮播间隔（秒） */
  carouselInterval: number
  /** 面板背景色（十六进制） */
  panelBgColor: string
  /** 面板透明度 (0-1) */
  panelOpacity: number
  /** 面板吸附边 */
  panelEdge: PanelEdge
  /** 面板是否锁定位置 */
  panelLocked: boolean
  /** 是否启用点击穿透 */
  clickThrough: boolean
  /** 一级阈值百分比（绿色→黄色） */
  threshold1: number
  /** 二级阈值百分比（黄色→红色） */
  threshold2: number
  /** 一级阈值颜色（低于 threshold1） */
  thresholdColor1: string
  /** 二级阈值颜色（threshold1 ~ threshold2） */
  thresholdColor2: string
  /** 三级阈值颜色（高于 threshold2） */
  thresholdColor3: string
  /** 是否启用限额提醒 */
  alertEnabled: boolean
  /** 限额提醒阈值百分比 */
  alertThreshold: number
  /** 是否开机自启动 */
  autoStart: boolean
  /** OAuth 回调端口，默认 9527 */
  oauthPort?: number
  /** 供应商配置列表 */
  providers: ProviderConfig[]
}

// ============================================================
// 工厂函数
// ============================================================

/** 创建默认应用配置 */
export function createDefaultConfig(): AppConfig {
  return {
    refreshInterval: 30,
    carouselInterval: 10,
    panelBgColor: '#333333',
    panelOpacity: 0.8,
    panelEdge: 'top',
    panelLocked: false,
    clickThrough: false,
    threshold1: 50,
    threshold2: 80,
    thresholdColor1: '#4caf50',
    thresholdColor2: '#ff9800',
    thresholdColor3: '#f44336',
    alertEnabled: true,
    alertThreshold: 80,
    autoStart: false,
    providers: [],
  }
}
