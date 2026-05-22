## MODIFIED Requirements

### Requirement: OAuth 本地回调服务器
系统 SHALL 支持在本地启动临时 HTTP 服务器接收 OAuth 授权回调，并能在服务器仍运行时安全停止并重新启动。

#### Scenario: 启动 OAuth 回调服务器
- **WHEN** 供应商需要 OAuth 授权且用户触发登录
- **THEN** Rust 侧 SHALL 先停止已有的 OAuth 服务器（如有），然后在本地端口启动新的 HTTP 服务器，并在系统默认浏览器中打开授权页面

#### Scenario: 接收 OAuth 回调
- **WHEN** 供应商 OAuth 重定向到 `http://localhost:<port>/callback`
- **THEN** 系统 SHALL 从回调 URL 中提取 token，关闭 HTTP 服务器，并将 token 传递给 TS 侧

#### Scenario: OAuth 超时处理
- **WHEN** OAuth 授权超过5分钟未完成
- **THEN** 系统 SHALL 关闭 HTTP 服务器并通知 TS 侧授权超时

#### Scenario: 浏览器打开授权页面
- **WHEN** OAuth 服务器启动成功
- **THEN** 系统 SHALL 使用系统默认浏览器打开授权 URL，不得打开 about:blank 页面

#### Scenario: 重复触发 OAuth 登录
- **WHEN** 用户在前一次 OAuth 流程未完成时再次点击登录授权
- **THEN** 系统 SHALL 先停止旧服务器，再启动新服务器并重新打开浏览器
