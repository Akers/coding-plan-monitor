## Why

MiniMax 供应商在用户配置 API Key 后，悬浮面板始终显示"API 响应格式异常"。原因是 `MiniMaxAdapter.parseResponse()` 期望的 JSON 结构 `data.plan_info_list` 与 MiniMax Token Plan API 的真实响应结构不匹配——实际 API 返回的是顶层 `model_remains` 数组加 `base_resp` 状态对象，导致解析分支永远走到错误路径。

## What Changes

- 修改 `MiniMaxAdapter.parseResponse()` 以适配 MiniMax Token Plan API 的真实响应格式（`model_remains` 数组）
- 正确解析 `current_interval_usage_count`（已用量）和 `current_interval_total_count`（总量）字段
- 增加 `base_resp.status_code` 错误码处理（如 `status_code: 1004` 表示 API Key 无效）
- 兼容 5 小时窗口额度（`current_interval_*`）和周额度（`current_weekly_*`）两种维度
- 更新 API URL 从 `www.minimaxi.com` 到 `api.minimaxi.com`（正确的 API 域名）
- 更新对应单元测试以覆盖真实 API 响应格式

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `provider-adapter`: MiniMax 适配器需适配真实 Token Plan API 响应结构，修复解析逻辑和错误处理

## Impact

- **受影响文件**：`src/providers/minimax.ts`（核心解析逻辑）、`src/__tests__/providers/minimax.test.ts`（测试用例）
- **API 变更**：MiniMax API 请求域名从 `www.minimaxi.com` 调整为 `api.minimaxi.com`；请求路径不变
- **向后兼容**：旧格式的测试数据需要全部更新为新格式；运行时行为从报错变为正常展示
- **无破坏性变更**：不影响其他供应商（zhipu、volcengine）的适配器
