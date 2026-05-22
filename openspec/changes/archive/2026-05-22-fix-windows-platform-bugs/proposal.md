## Why

在 Windows 平台测试中发现了 5 个功能性 BUG，严重影响用户体验：悬浮面板背景不填满高度、出现双系统托盘图标、OAuth 授权打开空白页、配置面板保存/取消不关闭窗口、配置供应商后面板数据不刷新。这些问题阻塞了 Windows 平台的基本使用流程，需要立即修复。

## What Changes

- **悬浮面板最小高度**：为 `.panel-container` 添加 `min-height`，确保无供应商时背景色填满整个窗口高度
- **双托盘图标**：移除 `tauri.conf.json` 中 `app.trayIcon` 配置，避免 Tauri 框架自动创建托盘与应用代码手动创建的托盘冲突
- **OAuth 空白页**：修复 `@tauri-apps/plugin-shell` 的 `open()` 调用，确保在 Windows 上正确打开外部浏览器；增加 OAuth 服务器重启逻辑，解决关闭授权页后再次点击无反应的问题
- **配置面板关闭行为**：保存后调用窗口关闭 API；取消时恢复快照并关闭窗口
- **面板数据不刷新**：在 `Panel.vue` 的 `onMounted` 中初始化并启动 `refreshScheduler`，并在 `config-saved` 事件中重启调度器

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `panel`: 修复面板容器最小高度和数据刷新调度器未启动的问题
- `system-integration`: 修复双托盘图标问题，移除 tauri.conf.json 中的重复托盘配置
- `config-window`: 修复保存/取消按钮的关闭窗口行为
- `provider-adapter`: 修复 OAuth 流程在 Windows 上的浏览器打开和服务器重启问题
- `refresh-scheduler`: 确保 Panel.vue 正确启动和重启刷新调度器

## Impact

- **前端文件**：`Panel.vue`、`Config.vue`、`oauth.ts`
- **配置文件**：`tauri.conf.json`
- **Rust 后端**：`commands/oauth.rs`（OAuth 服务器状态清理逻辑）
- **受影响功能**：悬浮面板渲染、系统托盘、OAuth 授权、配置面板交互、数据刷新
