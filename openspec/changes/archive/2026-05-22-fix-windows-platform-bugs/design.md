## Context

本项目是一个基于 Tauri 2.x 的跨平台桌面应用（Coding Plan Monitor），用于监控多个 AI 供应商的 API 额度使用情况。前端使用 Vue 3 + Pinia + TypeScript，后端使用 Rust + Tauri 2。

当前应用在 macOS 上运行正常，但在 Windows 平台测试中发现了 5 个功能性 BUG，涉及悬浮面板、系统托盘、OAuth 授权、配置面板和数据刷新等核心功能模块。

关键代码位置：
- **悬浮面板**：`src/views/Panel.vue`、`src/components/panel/PanelFooter.vue`
- **配置面板**：`src/views/Config.vue`
- **系统托盘**：`src-tauri/src/lib.rs`、`src-tauri/tauri.conf.json`
- **OAuth 服务**：`src/services/oauth.ts`、`src-tauri/src/commands/oauth.rs`
- **刷新调度**：`src/services/refresh.ts`、`src/stores/usage.ts`

## Goals / Non-Goals

**Goals:**
- 修复 Windows 平台上的 5 个 BUG，使应用基本功能恢复正常
- 确保悬浮面板在无供应商配置时背景填满高度
- 确保只有一个系统托盘图标且右键菜单正常
- 确保 OAuth 授权能正确打开浏览器页面
- 确保配置面板的保存/取消按钮正确关闭窗口
- 确保配置供应商后面板数据能自动刷新

**Non-Goals:**
- 不新增功能特性
- 不重构现有架构
- 不处理 macOS/Linux 平台特有问题
- 不优化性能

## Decisions

### Decision 1: 悬浮面板最小高度 — CSS min-height

**选择**：在 `.panel-container` 样式中添加 `min-height: 100vh`。

**理由**：当前面板使用 `height: 100%`，但窗口在 Windows 上透明渲染时，如果没有内容撑开，背景可能不会填满。`min-height: 100vh` 确保面板容器始终至少占满整个视口高度。

**替代方案**：
- 在 Tauri 窗口配置中固定高度 → 不灵活，不同内容量无法自适应
- 在 `.empty-state` 中设置固定高度 → 间接解决但不够直接

### Decision 2: 双托盘图标 — 移除 tauri.conf.json 中的 trayIcon 配置

**选择**：从 `tauri.conf.json` 的 `app` 节移除 `trayIcon` 配置块。

**理由**：`tauri.conf.json` 中的 `app.trayIcon` 配置会让 Tauri 框架在 setup 之前自动创建一个默认托盘图标。同时 `lib.rs` 的 `setup()` 中又通过 `TrayIconBuilder` 手动创建了带事件处理的托盘图标 `("main-tray")`。这导致两个托盘图标出现，且只有手动创建的那个绑定了事件处理器。移除配置文件中的声明，仅保留代码中的程序化创建即可。

**替代方案**：
- 移除代码中的手动创建，仅用配置 → 无法绑定自定义事件处理器
- 在 setup 中删除已存在的默认图标再重建 → 不稳定且不必要

### Decision 3: OAuth 空白页 — 使用 WebviewWindow 替代 shell.open

**选择**：不使用 `@tauri-apps/plugin-shell` 的 `open()` 函数，改为在 Rust 侧使用 `open::that()` crate 或 `std::process::Command` 直接调用系统浏览器打开 URL。

**理由**：`@tauri-apps/plugin-shell` 的 `open()` 在 Tauri 2 的安全模型下，可能因为缺少 scope 配置而在 Windows 上打开 `about:blank`。直接在 Rust 侧使用系统命令打开浏览器更可靠。

**替代方案**：
- 配置 shell plugin scope 允许所有 URL → 安全风险
- 使用 Tauri 的 WebviewWindow 打开授权页 → 不适合外部 OAuth 流程

### Decision 4: OAuth 服务器重启 — 强制停止旧服务器再启动

**选择**：在 `startOAuth` 的 TS 侧，先调用 `stopOAuth()`，再调用 `startOAuthService()`，并添加重试机制。

**理由**：当用户关闭授权页面后，如果 OAuth 服务器线程尚未超时退出（5分钟超时），再次点击"登录授权"会因 `start_oauth_server` 检测到服务器仍在运行而返回错误。先停止旧服务器可以确保新服务器能正常启动。

**替代方案**：
- 降低超时时间 → 治标不治本
- 改用端口复用 → 复杂度增加

### Decision 5: 配置面板关闭 — 使用 Tauri window API

**选择**：在 `Config.vue` 的 `save()` 和 `cancel()` 方法中，操作完成后调用 `getCurrentWindow().close()` 关闭配置窗口。

**理由**：配置面板是独立窗口，保存/取消后应关闭窗口返回悬浮面板。使用 Tauri 的 `getCurrentWindow().close()` API 是关闭 Tauri 窗口的标准方式。

**替代方案**：
- 使用 Rust 命令关闭 → 多一层间接调用
- 隐藏而非关闭 → 内存浪费

### Decision 6: 面板数据不刷新 — 在 Panel.vue 中启动 refreshScheduler

**选择**：在 `Panel.vue` 的 `onMounted` 中初始化 `ProviderRegistry` 并调用 `startRefreshScheduler()`，在 `config-saved` 事件监听中调用 `restartRefreshScheduler()`。

**理由**：当前 `Panel.vue` 的 `onMounted` 只加载配置和设置供应商列表，但从未启动刷新调度器。`refresh.ts` 中定义了 `startRefreshScheduler()` 和 `restartRefreshScheduler()` 函数，但没有任何地方调用它们。这是数据不刷新的根本原因。

**替代方案**：
- 在 App.vue 中全局启动 → Panel 和 Config 共享路由，Config 不需要刷新器
- 在 Pinia store 中自动启动 → 职责不清晰

## Risks / Trade-offs

- **[Risk] 移除 trayIcon 配置可能影响其他平台** → Tauri 代码中的 TrayIconBuilder 是跨平台的，不会受影响。已在 macOS 上验证程序化创建托盘正常。

- **[Risk] Rust 侧打开浏览器需要区分平台** → 使用 `open::that()` 或条件编译 `#[cfg(target_os = "windows")]` 使用 `cmd /c start`，`#[cfg(target_os = "macos")]` 使用 `open`。

- **[Risk] 强制停止 OAuth 服务器可能丢失正在进行的授权** → 可接受：用户主动点击重新授权意味着放弃上一次流程。

- **[Risk] 在 config-saved 事件中重启调度器可能导致短时间重复刷新** → `restartRefreshScheduler` 内部先 `stopRefreshScheduler()` 再 `startRefreshScheduler()`，不会重复。
