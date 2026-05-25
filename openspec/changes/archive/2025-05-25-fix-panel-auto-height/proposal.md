## Why

悬浮面板的 Tauri 窗口高度硬编码为 200px 且 `resizable: false`，当某个供应商的监控维度超过面板最小高度能容纳的数量时（例如 MiniMax 现在固定显示 4 个维度：文本 5h、文本周额度、图像 5h、图像周额度），超出部分被 `overflow-y: auto` 截断为滚动条，用户必须手动滚动才能看到完整内容。面板应自动拉伸窗口高度以完整显示所有监控项。

## What Changes

- 面板内容区域在内容变化后测量实际渲染高度，通过已有的 `set_panel_size` Tauri 命令动态调整窗口高度
- 保持窗口宽度 320px 不变，高度在最小高度（200px）和最大高度（如 500px）之间自适应
- 消除 `metrics-list` 的 `overflow-y: auto` 滚动行为，内容自然撑开
- `snapPanelToEdge` / `checkSnapStatus` 等使用硬编码 320×200 的地方改用实际窗口尺寸
- 最小化时使用当前实际窗口高度而非硬编码 200px

## Capabilities

### New Capabilities

_无_

### Modified Capabilities

- `panel`: 新增"面板高度自适应"需求——面板窗口高度 SHALL 根据内容动态调整，保持在最小高度和最大高度之间

## Impact

- `src/views/Panel.vue` — 添加 ResizeObserver/watch 逻辑，内容变化时调用 `setPanelSize`
- `src/services/panel.ts` — `snapPanelToEdge` / `calcMinimizedPosition` 等函数可能需要接收动态高度
- `src-tauri/tauri.conf.json` — 初始窗口高度保持 200px 作为最小高度（不需要改 resizable）
- 面板 CSS — `.metrics-list` 移除 `overflow-y: auto`，`.panel-container` 调整 `overflow` 策略
