## MODIFIED Requirements

### Requirement: MiniMax TokenPlan 适配器
系统 SHALL 实现 MiniMax TokenPlan 适配器，通过 REST API `https://www.minimaxi.com/v1/token_plan/remains` 获取文本生成和图像生成的额度数据。请求头 MUST 包含 `Authorization`（Bearer Token）、`Content-Type`、`User-Agent` 和 `Accept`。

#### Scenario: MiniMax 额度查询成功
- **WHEN** 使用有效的 API Key 调用 MiniMax 适配器（Bearer Token 认证）
- **THEN** 适配器 SHALL 向 `https://www.minimaxi.com/v1/token_plan/remains` 发起 GET 请求，请求头包含 `Authorization: Bearer <apiKey>`、`Content-Type: application/json`、`User-Agent: coding-plan-monitor`、`Accept: */*`，并返回包含4个维度的 UsageInfo：文本生成5h额度、文本生成周额度、图像生成5h额度、图像生成周额度

#### Scenario: MiniMax 数据按 model_name 区分
- **WHEN** MiniMax API 返回包含多个 model_name 的数据
- **THEN** 适配器 SHALL 将 model_name 为 "MiniMax-M*" 的数据归类为文本生成，将 "coding-plan-vlm" 归类为图像生成

#### Scenario: MiniMax API Key 无效
- **WHEN** 使用无效的 API Key 调用 MiniMax API
- **THEN** 适配器 SHALL 返回认证失败的错误信息
