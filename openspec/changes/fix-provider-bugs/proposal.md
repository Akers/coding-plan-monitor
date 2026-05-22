## Why

MiniMax 供应商 API URL 配置错误导致所有查询请求返回 HTTP 404，用户无法获取余额信息；智谱和火山供应商的 OAuth 登录授权按钮在首次点击时无反应，原因是 `stopOAuth()` 在无运行中服务器时会抛出异常，导致整个 `startOAuth()` 函数被 catch 静默吞掉。

## What Changes

- 修正 MiniMax 适配器 API URL：将 `https://api.minimax.chat/v1/token_plan` 更正为 `https://www.minimaxi.com/v1/token_plan/remains`（域名和路径均需修正）
- 补充 MiniMax 请求头：添加 `User-Agent` 和 `Accept` 头以提高 API 兼容性
- 修复 OAuth 流程中的静默失败问题：确保 `stopOAuth()` 在无运行中服务器时不阻断后续 OAuth 启动流程
- 使 `stop_oauth_server` Rust 命令在无运行中服务器时返回成功而非错误

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `provider-adapter`: MiniMax 适配器的 API 端点 URL 和请求头需要修正，以匹配正确的 MiniMax API 规范
- `config-window`: OAuth 登录授权流程需要容错处理，确保首次点击时不会因 stopOAuth 失败而静默中断

## Impact

- **源码文件**：`src/providers/minimax.ts`（URL 和请求头修正）、`src/views/Config.vue`（OAuth 容错）、`src-tauri/src/commands/oauth.rs`（stop 命令返回值）
- **行为变更**：MiniMax 查询从必定失败变为正常工作；OAuth 首次点击从静默失败变为正常启动浏览器
- **无 API 变更**：不涉及新增或删除对外接口
- **无依赖变更**：不引入新依赖
