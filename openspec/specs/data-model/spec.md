## Purpose

定义 Coding Plan Monitor 的跨前端与 Rust IPC 使用的数据模型，包括供应商、配置、额度维度与运行状态数据。

## Requirements

### Requirement: ProviderId 类型定义
系统 SHALL 定义 `ProviderId` 联合类型，包含所有支持的供应商标识符。

#### Scenario: ProviderId 包含所有供应商
- **WHEN** 系统引用 ProviderId 类型
- **THEN** 该类型 SHALL 包含 'zhipu'、'minimax'、'volcengine' 三个字符串字面量

### Requirement: ProviderConfig 数据模型
系统 SHALL 定义供应商配置数据模型，包含鉴权信息和启用状态。

#### Scenario: API Key 类型供应商配置
- **WHEN** 供应商的 authType 为 'apikey'
- **THEN** ProviderConfig SHALL 包含非空的 apiKey 字段

#### Scenario: OAuth 类型供应商配置
- **WHEN** 供应商的 authType 为 'oauth'
- **THEN** ProviderConfig SHALL 包含 token 和 tokenExpireAt 字段

### Requirement: UsageMetric 数据模型
系统 SHALL 定义单个额度维度的数据模型，包含已用额度、总额度、百分比、单位和重置倒计时。

#### Scenario: UsageMetric 包含完整维度信息
- **WHEN** 适配器返回一个维度的额度数据
- **THEN** UsageMetric SHALL 包含 label、usedQuota、totalQuota、percentage、unit 和可选的 resetIn 字段

### Requirement: UsageInfo 数据模型
系统 SHALL 定义供应商额度信息数据模型，包含多个维度和可选的附加信息。

#### Scenario: UsageInfo 包含多个维度
- **WHEN** 适配器成功获取额度数据
- **THEN** UsageInfo SHALL 包含 providerId、timestamp、metrics 数组和可选的 extraInfo

#### Scenario: UsageInfo 包含错误信息
- **WHEN** 适配器获取额度数据失败
- **THEN** UsageInfo SHALL 包含 error 字段描述失败原因

### Requirement: AppConfig 数据模型
系统 SHALL 定义应用配置数据模型，包含刷新间隔、面板外观、阈值、供应商列表等所有可配置项。

#### Scenario: AppConfig 包含所有配置项
- **WHEN** 系统加载应用配置
- **THEN** AppConfig SHALL 包含 refreshInterval、carouselInterval、panelBgColor、panelOpacity、panelEdge、panelLocked、clickThrough、threshold1、threshold2、thresholdColor1/2/3、alertEnabled、alertThreshold、autoStart 和 providers 数组

### Requirement: 数据模型序列化与反序列化
所有数据模型 SHALL 支持 JSON 序列化和反序列化，用于 IPC 通信和配置文件读写。

#### Scenario: 数据模型 JSON 序列化
- **WHEN** TS 侧通过 IPC 传递数据模型到 Rust 侧
- **THEN** 数据 SHALL 能正确序列化为 JSON 并在 Rust 侧反序列化

#### Scenario: 配置文件 JSON 反序列化
- **WHEN** Rust 侧读取 JSON 配置文件
- **THEN** 配置数据 SHALL 能正确反序列化为 AppConfig 结构
