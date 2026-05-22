## Purpose

定义不同 AI Coding Plan 供应商额度数据获取适配器的统一接口、供应商特定行为和注册发现机制。

## Requirements

### Requirement: 统一供应商适配器接口
系统 SHALL 定义统一的 `ProviderAdapter` 接口，所有供应商适配器 MUST 实现该接口。

#### Scenario: 适配器获取额度数据
- **WHEN** 系统调用适配器的 `fetchUsage` 方法
- **THEN** 适配器 SHALL 返回包含多个 `UsageMetric` 的 `UsageInfo` 对象

#### Scenario: 适配器验证配置
- **WHEN** 系统调用适配器的 `validateConfig` 方法
- **THEN** 适配器 SHALL 返回当前配置是否有效（API Key 非空或 Token 未过期）

### Requirement: 智谱 CodingPlan 适配器
系统 SHALL 实现智谱 CodingPlan 适配器，获取5小时额度、周额度、MCP月额度和今日Token消耗。

#### Scenario: 智谱额度查询成功
- **WHEN** 使用有效的 API Key 调用智谱适配器
- **THEN** 返回的 UsageInfo SHALL 包含4个数据：5小时额度（进度条）、周额度（进度条）、MCP月额度（进度条）、今日Token消耗（纯文本）

#### Scenario: 智谱额度查询失败
- **WHEN** 智谱 API 返回错误或网络异常
- **THEN** 适配器 SHALL 返回带有 error 字段的 UsageInfo，包含错误描述

#### Scenario: 智谱授权失效
- **WHEN** 智谱 API 返回 403 状态码
- **THEN** 适配器 SHALL 返回标识授权失效的错误，触发重新授权流程

### Requirement: MiniMax TokenPlan 适配器
系统 SHALL 实现 MiniMax TokenPlan 适配器，通过 REST API 获取文本生成和图像生成的额度数据。

#### Scenario: MiniMax 额度查询成功
- **WHEN** 使用有效的 API Key 调用 MiniMax 适配器（Bearer Token 认证）
- **THEN** 返回的 UsageInfo SHALL 包含4个维度：文本生成5h额度、文本生成周额度、图像生成5h额度、图像生成周额度

#### Scenario: MiniMax 数据按 model_name 区分
- **WHEN** MiniMax API 返回包含多个 model_name 的数据
- **THEN** 适配器 SHALL 将 model_name 为 "MiniMax-M*" 的数据归类为文本生成，将 "coding-plan-vlm" 归类为图像生成

#### Scenario: MiniMax API Key 无效
- **WHEN** 使用无效的 API Key 调用 MiniMax API
- **THEN** 适配器 SHALL 返回认证失败的错误信息

### Requirement: 火山 CodingPlan 适配器
系统 SHALL 实现火山 CodingPlan 适配器，获取5小时额度、周额度、MCP月额度和今日Token消耗。

#### Scenario: 火山额度查询成功
- **WHEN** 使用有效授权调用火山适配器
- **THEN** 返回的 UsageInfo SHALL 包含4个数据：5小时额度、周额度、MCP月额度、今日Token消耗

#### Scenario: 火山需要 OAuth 授权
- **WHEN** 火山适配器检测到没有有效的授权凭证
- **THEN** 系统 SHALL 引导用户通过浏览器进行 OAuth 授权获取授权头

### Requirement: 适配器注册与发现
系统 SHALL 维护一个适配器注册表，通过供应商 ID 查找对应的适配器实例。

#### Scenario: 通过 ID 获取适配器
- **WHEN** 系统需要查询某个供应商的额度
- **THEN** 系统 SHALL 从注册表中根据 ProviderId 获取对应的适配器实例

#### Scenario: 列出所有已注册适配器
- **WHEN** 系统初始化时
- **THEN** 所有已实现的适配器 SHALL 自动注册到注册表
