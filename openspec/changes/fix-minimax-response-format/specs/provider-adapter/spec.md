## MODIFIED Requirements

### Requirement: MiniMax TokenPlan 适配器
系统 SHALL 实现 MiniMax TokenPlan 适配器，通过 REST API 获取文本生成和图像生成的额度数据。适配器 SHALL 调用 `https://api.minimaxi.com/v1/token_plan/remains` 端点并正确解析 `model_remains` 数组格式。

#### Scenario: MiniMax 额度查询成功
- **WHEN** 使用有效的 API Key 调用 MiniMax 适配器（Bearer Token 认证），且 API 返回 `base_resp.status_code` 为 0
- **THEN** 返回的 UsageInfo SHALL 包含 5 小时窗口额度（`current_interval_usage_count` / `current_interval_total_count`）和周额度（`current_weekly_usage_count` / `current_weekly_total_count`）维度，按 `model_name` 区分文本生成（`MiniMax-M*`）和图像生成（`coding-plan-vlm`）

#### Scenario: MiniMax 数据按 model_name 区分
- **WHEN** MiniMax API 返回包含多个 `model_name` 的 `model_remains` 数组
- **THEN** 适配器 SHALL 将 `model_name` 以 `MiniMax-M` 开头的数据归类为文本生成，将 `coding-plan-vlm` 归类为图像生成

#### Scenario: MiniMax 无周额度限制
- **WHEN** `current_weekly_total_count` 为 0
- **THEN** 适配器 SHALL 不生成周额度 metric

#### Scenario: MiniMax API Key 无效
- **WHEN** 使用无效的 API Key 调用 MiniMax API，且 API 返回 `base_resp.status_code` 为 1004
- **THEN** 适配器 SHALL 返回包含 "API Key 无效或已过期" 错误信息的 UsageInfo

#### Scenario: MiniMax API 返回业务错误
- **WHEN** MiniMax API 返回 HTTP 200 但 `base_resp.status_code` 非零（非 1004）
- **THEN** 适配器 SHALL 返回包含 `base_resp.status_msg` 错误信息的 UsageInfo

#### Scenario: MiniMax API 响应格式不符预期
- **WHEN** MiniMax API 返回的 JSON 中不包含 `model_remains` 数组
- **THEN** 适配器 SHALL 返回包含 "API 响应格式异常" 错误信息的 UsageInfo

#### Scenario: MiniMax API 请求 URL 正确
- **WHEN** 适配器调用 MiniMax API
- **THEN** 请求 URL SHALL 为 `https://api.minimaxi.com/v1/token_plan/remains`
