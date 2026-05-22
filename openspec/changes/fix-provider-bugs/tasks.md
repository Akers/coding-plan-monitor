## 1. MiniMax API URL 修正

- [ ] 1.1 将 `src/providers/minimax.ts` 中的 `apiUrl` 从 `https://api.minimax.chat/v1/token_plan` 修正为 `https://www.minimaxi.com/v1/token_plan/remains`
- [ ] 1.2 在 MiniMax 适配器请求头中添加 `User-Agent: coding-plan-monitor` 和 `Accept: */*`
- [ ] 1.3 验证 MiniMax 适配器使用正确 URL 后能成功返回额度数据（使用有效 API Key 测试）

## 2. OAuth 登录授权修复

- [ ] 2.1 修改 `src-tauri/src/commands/oauth.rs` 中的 `stop_oauth_server` 函数，当无运行中的 OAuth 服务器时返回 `Ok(())` 而非 `Err`
- [ ] 2.2 验证首次点击智谱供应商的"登录授权"按钮能正常打开浏览器授权页面
- [ ] 2.3 验证首次点击火山供应商的"登录授权"按钮能正常打开浏览器授权页面
- [ ] 2.4 验证多次点击"登录授权"按钮时 OAuth 服务器能正确停止并重启
