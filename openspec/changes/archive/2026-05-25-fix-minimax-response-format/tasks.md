## 1. API URL 与类型定义修正

- [x] 1.1 保持 `MiniMaxAdapter.apiUrl` 为实测可用端点 `https://www.minimaxi.com/v1/token_plan/remains`
- [x] 1.2 更新 `parseResponse` 方法的参数类型定义，使用真实 API 响应结构：顶层 `model_remains` 数组 + `base_resp` 对象

## 2. 解析逻辑重写

- [x] 2.1 在 `parseResponse` 入口检查 `base_resp.status_code`，非零时返回对应错误信息（`1004` → "API Key 无效或已过期"，其他 → `status_msg`）
- [x] 2.2 检查 `model_remains` 是否为数组，非数组时返回 "API 响应格式异常"
- [x] 2.3 按 `model_name` 匹配规则分类：`startsWith('MiniMax-M')` 为文本，`coding-plan-vlm` 为图像
- [x] 2.4 使用 `current_interval_usage_count`（已用量）和 `current_interval_total_count`（总量）生成 5h 窗口额度 metric
- [x] 2.5 当 `current_weekly_total_count > 0` 时，使用 `current_weekly_usage_count` / `current_weekly_total_count` 生成周额度 metric；为 0 时跳过

## 3. 单元测试更新

- [x] 3.1 更新成功响应测试的 mock 数据为真实 API 格式（`model_remains` + `base_resp`），验证 4 个 metric 正确生成
- [x] 3.2 新增 `base_resp.status_code = 1004` 场景测试，验证返回 "API Key 无效或已过期"
- [x] 3.3 新增 `base_resp.status_code` 非零（非 1004）场景测试，验证返回 `status_msg` 内容
- [x] 3.4 新增 `model_remains` 不存在或非数组场景测试，验证返回 "API 响应格式异常"
- [x] 3.5 新增 `current_weekly_total_count = 0` 场景测试，验证不生成周额度 metric
- [x] 3.6 更新 API URL 测试断言为 `https://www.minimaxi.com/v1/token_plan/remains`
- [x] 3.7 保留现有 HTTP 错误（401、404）和网络错误测试不变

## 4. 验证

- [x] 4.1 运行 `npx vitest run src/__tests__/providers/minimax.test.ts` 确保所有测试通过
- [x] 4.2 运行 `npx vitest run` 确保全量测试未引入回归（全量 30 文件、255 个测试全部通过）
