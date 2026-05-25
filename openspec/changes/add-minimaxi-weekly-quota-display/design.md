## Context

MiniMax 的额度数据由 `MiniMaxAdapter` 调用 `https://www.minimaxi.com/v1/token_plan/remains` 获取，并从 `model_remains` 中选择文本模型（`MiniMax-M*`）和图像模型（`coding-plan-vlm`）生成 `UsageMetric`。面板本身通过 `UsageBar` 渲染 `UsageInfo.metrics`，因此是否显示某个额度维度主要由适配器是否生成对应 metric 决定。

当前适配器总是生成 5 小时窗口额度，但只有 `current_weekly_total_count > 0` 时才生成周额度。真实 MiniMax 响应可能包含周额度字段但总量为 0，导致悬浮面板只显示文本 5h 和图像 5h。该变更将周额度维度作为 MiniMax 文本/图像计划的固定展示项。

## Goals / Non-Goals

**Goals:**
- MiniMax 文本计划存在时，面板展示“文本 5h 额度”和“文本周额度”。
- MiniMax 图像计划存在时，面板展示“图像 5h 额度”和“图像周额度”。
- 周额度总量为 0 或字段缺失时仍生成周额度 metric，数值默认为 0，百分比为 0。
- 保持现有 `UsageMetric` 数据模型和 `UsageBar` 渲染机制不变。

**Non-Goals:**
- 不改变 MiniMax API 端点、认证方式或请求头。
- 不新增 UI 组件或调整面板布局策略。
- 不改变多文本模型、多图像模型的选择策略；本次仍沿用每类取第一个匹配计划。
- 不引入“无限制”“暂无额度”等新展示文案。

## Decisions

1. **在适配器层固定生成周额度 metric。**
   - 方案：修改 `addPlanMetrics`，移除 `weeklyTotal > 0` 的生成条件，对每个已识别计划固定追加周额度 metric。
   - 理由：现有 UI 已可渲染任意数量的 `UsageMetric`，变更适配器即可最小化影响范围。
   - 备选：在 UI 层补齐缺失周额度。该方案会把供应商 API 字段语义泄漏到展示层，不如适配器层集中处理。

2. **周额度缺失或为 0 时用 0/0 和 0% 表达。**
   - 方案：继续复用 `createMetric` 的默认计算逻辑：`total <= 0` 时 percentage 为 0。
   - 理由：不需要扩展 `UsageMetric`，且行为与现有 total 为 0 的百分比计算一致。
   - 备选：隐藏周额度或展示特殊文案。隐藏与本次需求冲突，特殊文案需要新增 UI 语义和测试范围。

3. **通过适配器单元测试验证，不增加面板渲染测试。**
   - 方案：更新 MiniMax adapter tests，断言成功响应、真实响应、周额度为 0、字段缺失时 metrics 数量与标签。
   - 理由：面板渲染逻辑已经基于 `metrics` 数组通用渲染；本变更的行为边界在适配器输出。
   - 备选：增加组件测试。若后续发现布局承载 4 个进度条有问题，再独立增加 UI 测试。

## Risks / Trade-offs

- **周额度为 0 时用户可能误解为已无额度** → 使用现有 0/0 和 0% 表达，不额外解释；如产品需要更明确文案，另开 UI 文案变更。
- **面板高度增加** → 该变更最多从 2 个 MiniMax metric 增加到 4 个，沿用现有滚动/布局能力；若视觉溢出再由 UI 变更处理。
- **字段缺失被默认为 0 可能掩盖 API 异常** → 仅对已识别计划的周额度字段采用默认值，不改变 `model_remains` 格式异常的错误处理。

## Migration Plan

- 修改适配器后无需数据迁移或配置迁移。
- 回滚方式：恢复 `current_weekly_total_count > 0` 条件即可回到旧行为。

## Open Questions

- 是否需要将“文本周额度”“图像周额度”标签统一加空格为“文本 周额度”“图像 周额度”？本变更保持现有标签风格，避免无关 UI 文案变化。
