## Context

当前 `MiniMaxAdapter` 使用 `fetch` 调用 `https://www.minimaxi.com/v1/token_plan/remains`，但 `parseResponse` 方法期望的 JSON 结构为 `{ data: { plan_info_list: [...] } }`。根据用户实测 curl 响应，真实响应格式为：

```json
{
  "model_remains": [
    {
      "model_name": "MiniMax-M*",
      "current_interval_total_count": 1500,
      "current_interval_usage_count": 151,
      "current_weekly_total_count": 0,
      "current_weekly_usage_count": 0,
      "start_time": 1778616000000,
      "end_time": 1778630400000,
      "remains_time": 12241883,
      "weekly_start_time": 1778457600000,
      "weekly_end_time": 1779062400000,
      "weekly_remains_time": 444241883
    }
  ],
  "base_resp": { "status_code": 0, "status_msg": "success" }
}
```

关键差异：
- 响应包裹在顶层 `model_remains` 数组中，不是 `data.plan_info_list`
- 字段名不同：`current_interval_total_count` / `current_interval_usage_count` 替代了 `five_hours_total` / `five_hours_remaining`
- 存在 `base_resp` 状态码，其中 `status_code: 1004` 表示 API Key 无效
- API 域名应保持为实测可用的 `www.minimaxi.com`

## Goals / Non-Goals

**Goals:**
- 修复 MiniMax 适配器解析逻辑，使其正确处理 MiniMax Token Plan API 真实响应
- 正确区分已用量（`usage_count`）和总量（`total_count`）
- 支持 `base_resp` 错误码，提供更精准的错误提示
- 保持 API 请求域名为 `www.minimaxi.com`
- 保持与其他供应商适配器的接口一致

**Non-Goals:**
- 不重构其他供应商适配器
- 不修改 UI 层展示逻辑
- 不增加 OAuth 认证流程
- 不增加对新 API 端点（如 `platform.minimax.io`）的支持

## Decisions

### 决策 1：API URL 保持为 `www.minimaxi.com`

**选择**：`https://www.minimaxi.com/v1/token_plan/remains`

**理由**：用户提供的实测 curl 使用 `www.minimaxi.com` 能返回包含 `model_remains`、`category_remains` 和 `base_resp` 的有效 TokenPlan 响应；此前切换到 `api.minimaxi.com` 后真实程序仍显示 API 响应错误，因此应以实测可用端点为准。

**替代方案**：切换到 `api.minimaxi.com`。该方案已在真实程序中反馈未修复问题，暂不采用。

### 决策 2：解析逻辑重写为 `model_remains` 数组遍历

**选择**：解析 `model_remains` 数组，按 `model_name` 匹配规则分类（`MiniMax-M*` 为文本，`coding-plan-vlm` 为图像）。

**理由**：与真实 API 响应结构一致，字段语义清晰：`current_interval_usage_count` = 已用量，`current_interval_total_count` = 总量。

**替代方案**：同时兼容旧格式 `data.plan_info_list`。不采用，因为旧格式从未被 API 实际返回过。

### 决策 3：`base_resp` 错误码处理

**选择**：在 `parseResponse` 入口检查 `base_resp.status_code`，非零时返回对应错误信息（如 `1004` → "API Key 无效或已过期"）。

**理由**：MiniMax API 通过 `base_resp` 返回业务级错误，HTTP 状态码可能仍为 200。当前代码缺少此检查。

### 决策 4：保持周额度展示逻辑

**选择**：当 `current_weekly_total_count` 为 0 时，不生成周额度 metric（表示无周额度限制）。

**理由**：MiniMax 免费或特殊套餐可能无周额度限制，`total_count = 0` 时展示无意义。

## Risks / Trade-offs

- **[API 响应格式可能再次变更]** → 保持 `parseResponse` 方法内聚，异常时返回明确错误信息，便于快速定位和修复
- **[model_name 匹配规则可能不够精确]** → 使用 `startsWith('MiniMax-M')` 前缀匹配覆盖 MiniMax-M1/M2/M2.5/M2.7 等变体
- **[破坏现有测试]** → 测试数据需全部更新为真实 API 响应格式，这是预期内的必要变更
