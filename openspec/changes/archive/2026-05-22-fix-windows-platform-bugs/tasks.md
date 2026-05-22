## 1. 悬浮面板最小高度修复

- [x] 1.1 在 `src/views/Panel.vue` 的 `.panel-container` 样式中添加 `min-height: 100vh` 属性，确保无供应商配置时背景色填满窗口高度

## 2. 双系统托盘图标修复

- [x] 2.1 从 `src-tauri/tauri.conf.json` 中移除 `app.trayIcon` 配置块（保留 `app.windows` 和 `app.security`），避免 Tauri 框架自动创建与代码手动创建的重复托盘图标

## 3. OAuth 授权空白页修复

- [x] 3.1 在 `src-tauri/src/commands/oauth.rs` 中新增 `open_url_in_browser` Rust 命令，使用平台原生方式（Windows: `cmd /c start`，macOS: `open`，Linux: `xdg-open`）在系统默认浏览器中打开指定 URL
- [x] 3.2 在 `src-tauri/src/lib.rs` 的 `invoke_handler` 中注册新的 `open_url_in_browser` 命令
- [x] 3.3 修改 `src/services/oauth.ts` 的 `openOAuthUrl` 函数，从调用 `@tauri-apps/plugin-shell` 的 `open()` 改为调用 `invoke('open_url_in_browser', { url })` Rust 命令
- [x] 3.4 修改 `src-tauri/src/commands/oauth.rs` 的 `start_oauth_server`，将现有的 "OAuth server already running" 错误改为先自动停止旧服务器再启动新服务器
- [x] 3.5 修改 `src/views/Config.vue` 的 `startOAuth` 函数，在调用 `startOAuthService` 之前先调用 `stopOAuth()`，确保旧的 OAuth 服务器被清理

## 4. 配置面板保存/取消关闭窗口

- [x] 4.1 修改 `src/views/Config.vue` 的 `save` 方法，在 `saveConfig()` 和 `tauriEmit` 之后调用 `getCurrentWindow().close()` 关闭配置窗口
- [x] 4.2 修改 `src/views/Config.vue` 的 `cancel` 方法，在 `cancelChanges()` 之后调用 `getCurrentWindow().close()` 关闭配置窗口
- [x] 4.3 在 `src/views/Config.vue` 中从 `@tauri-apps/api/window` 导入 `getCurrentWindow`

## 5. 悬浮面板数据不刷新修复

- [x] 5.1 修改 `src/views/Panel.vue` 的 `onMounted`，在加载配置和设置供应商列表之后，初始化 `ProviderRegistry`（注册 ZhipuAdapter、MiniMaxAdapter、VolcengineAdapter）并调用 `startRefreshScheduler`
- [x] 5.2 修改 `src/views/Panel.vue` 的 `config-saved` 事件监听器，在重新加载配置和更新供应商列表后调用 `restartRefreshScheduler`
- [x] 5.3 修改 `src/views/Panel.vue` 的 `onUnmounted`，添加 `stopRefreshScheduler()` 调用以清理定时器
- [x] 5.4 在 `src/views/Panel.vue` 中添加必要的导入：`createProviderRegistry`、`ZhipuAdapter`、`MiniMaxAdapter`、`VolcengineAdapter`、`startRefreshScheduler`、`stopRefreshScheduler`、`restartRefreshScheduler`
