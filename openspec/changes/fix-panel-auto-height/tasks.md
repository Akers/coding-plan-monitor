## 1. CSS 调整

- [x] 1.1 移除 `.metrics-list` 的 `overflow-y: auto`，改为内容自然撑开
- [x] 1.2 确认 `.panel-container` 的 `overflow: hidden` 保留（圆角裁剪需要）

## 2. 动态高度核心逻辑

- [x] 2.1 在 Panel.vue 中添加 `currentPanelHeight` ref，初始值 200
- [x] 2.2 添加 `updatePanelHeight` 函数：测量 `.panel-container` 的 scrollHeight，钳制在 [200, 500] 范围内，与当前 `currentPanelHeight` 差值 ≥ 5px 时才调用 `setPanelSize(320, newHeight)` 并更新 ref
- [x] 2.3 使用 ResizeObserver 监听 `.panel-container` 的尺寸变化，以 50ms 防抖调用 `updatePanelHeight`
- [x] 2.4 watch `currentMetrics`、`currentError`、`currentExtraInfo` 变化时触发 `updatePanelHeight`（使用 nextTick）

## 3. 替换硬编码高度

- [x] 3.1 `onMinimize` 中将硬编码 200 替换为 `currentPanelHeight.value`
- [x] 3.2 `checkSnapStatus` 中将硬编码 200 替换为 `currentPanelHeight.value`

## 4. 测试

- [x] 4.1 运行 `npm run build` 确认无 TS 错误
- [x] 4.2 运行 `npx vitest run` 确认全部测试通过
- [x] 4.3 运行 `openspec status --change "fix-panel-auto-height"` 确认所有 tasks 完成
