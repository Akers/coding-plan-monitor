## Why

MiniMax 当前悬浮面板只展示“文本 5h 额度”和“图像 5h 额度”，即使接口响应中包含周额度相关字段，用户也无法在面板中看到文本每周额度与图像每周额度。增加周额度展示可让用户在同一面板中了解短窗口额度和周周期额度，避免只凭 5 小时额度误判可用资源。

## What Changes

- MiniMax 适配器在识别到文本模型或图像模型计划时，必须为该计划同时生成 5h 额度 metric 和周额度 metric。
- MiniMax 面板展示应包含最多四个维度：文本 5h 额度、文本周额度、图像 5h 额度、图像周额度。
- 当 MiniMax API 返回的周额度总量为 0 或周额度字段缺失时，仍生成对应周额度 metric，数值按 0 处理，百分比保持 0。
- 增加/调整测试，覆盖文本与图像周额度均存在、周额度为 0、周额度字段缺失、真实响应字段解析等场景。

## Capabilities

### New Capabilities

### Modified Capabilities
- `provider-adapter`: MiniMax TokenPlan 适配器的成功解析要求需要明确始终为文本和图像计划生成周额度 metric，包括周额度为 0 或字段缺失的场景。

## Impact

- 影响代码：`src/providers/minimax.ts`、MiniMax 适配器相关测试。
- 影响规格：`openspec/specs/provider-adapter/spec.md` 的 MiniMax 行为要求。
- 影响 UI：`Panel.vue` 与 `UsageBar.vue` 无需新增显示机制，但会接收更多 MiniMax metrics 并在悬浮面板中渲染。
- 不引入新的外部依赖，不改变 MiniMax API 端点、鉴权方式或配置模型。
