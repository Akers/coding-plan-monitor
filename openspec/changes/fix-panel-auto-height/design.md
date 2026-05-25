## Context

悬浮面板是一个 Tauri WebView 窗口，当前窗口高度硬编码为 200px（`tauri.conf.json`），CSS 中 `.metrics-list` 使用 `overflow-y: auto` 让超出内容滚动。随着各供应商监控维度增加（如 MiniMax 已有 4 个维度），200px 已不足以完整显示。后端已有 `set_panel_size` Tauri 命令可用于动态调整窗口大小。

核心约束：
- 窗口宽度固定 320px，仅调整高度
- 必须保持吸附、最小化、拖拽等既有功能不受影响
- 高度变化不应导致窗口闪烁或抖动

## Goals / Non-Goals

**Goals:**
- 窗口高度根据实际内容自动调整，在最小高度（200px）和最大高度之间动态变化
- 内容切换（供应商切换、数据刷新）时平滑更新高度
- 吸附和最小化使用实际窗口高度，不再硬编码

**Non-Goals:**
- 不改变窗口宽度
- 不改变 `tauri.conf.json` 中的 `resizable` 设置（保持 `false`，由代码控制尺寸）
- 不增加 maxHeight 配置项（使用固定上限即可）
- 不改 Tauri Rust 后端代码（已有 `set_panel_size` 足够）

## Decisions

### 1. 使用 ResizeObserver + watch 组合检测内容变化

**选择：** 在 Panel.vue 中用 `ResizeObserver` 监听 `.panel-container` 的尺寸变化，结合 `watch` 监听 `currentMetrics`、`currentError`、`currentExtraInfo` 等响应式数据变化。

**替代方案：**
- MutationObserver：只监听 DOM 结构变化，不监听尺寸变化，不适合
- 手动在每次数据更新后调用：耦合度高，容易遗漏
- CSS-only 方案（`height: auto`）：Tauri 窗口不受 CSS 控制，必须通过 `set_panel_size` 设置

**理由：** ResizeObserver 是浏览器原生 API，能精确捕获内容变化引起的尺寸变化，且性能开销低。watch 用于在 Vue 响应式数据变化时触发首次测量。

### 2. 最小/最大高度约束

**选择：** 最小高度 200px（与现有配置一致），最大高度 500px（约 10-12 个 UsageBar 的高度，覆盖所有供应商最大维度数）。

**理由：** 200px 是当前已有值，保证空状态和少量维度时不会过小。500px 上限防止面板占据过多屏幕空间。

### 3. 防抖处理

**选择：** 使用 50ms 防抖避免快速连续高度调整（如轮播切换时）。

**理由：** 供应商切换时 DOM 更新和 ResizeObserver 可能短时间多次触发，防抖减少不必要的 Tauri IPC 调用。

### 4. 消除 `.metrics-list` 滚动

**选择：** 移除 `.metrics-list` 的 `overflow-y: auto`，改为 `overflow: visible`（或直接移除 overflow 属性），让内容自然撑开面板容器高度。

**理由：** 面板窗口高度将动态调整以适应内容，不再需要滚动。`.panel-container` 的 `overflow: hidden` 保留用于圆角裁剪。

### 5. 动态高度传递

**选择：** 将实际窗口高度存为 Vue ref，供 `onMinimize` 和 `checkSnapStatus` 使用，替代硬编码 200。

**理由：** 最小化和吸附计算需要知道实际窗口高度。存为 ref 可在模板和逻辑中统一使用。

## Risks / Trade-offs

- **高度频繁变化导致窗口抖动** → 使用防抖 + 最小高度差阈值（仅当高度变化 ≥ 5px 时才调用 `set_panel_size`），减少视觉抖动
- **供应商切换时内容瞬间变化** → 防抖 50ms 足够覆盖 Vue 的同步 DOM 更新
- **最大高度 500px 在小屏幕上过大** → 可接受风险，后续可加屏幕高度百分比上限
- **吸附后窗口高度变化导致位置偏移** → 高度变化时保持窗口顶部/底部位置不变（取决于吸附边）
