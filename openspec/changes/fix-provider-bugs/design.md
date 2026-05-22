## Context

coding-plan-monitor 是一个基于 Tauri + Vue 的桌面应用，用于监控多个 AI Coding Plan 供应商的额度使用情况。当前存在两个阻塞性 BUG：

1. MiniMax 适配器的 API URL 配置错误（域名和路径均不对），导致所有 MiniMax 查询必定返回 404
2. OAuth 登录授权流程中，`stopOAuth()` 在首次调用时因无运行中的服务器而抛出异常，整个 `startOAuth()` 被 catch 静默吞掉，导致按钮无反应

相关代码横跨 TypeScript 前端（`src/providers/`、`src/views/`、`src/services/`）和 Rust 后端（`src-tauri/src/commands/`）。

## Goals / Non-Goals

**Goals:**
- 修正 MiniMax API URL，使 MiniMax 供应商能正常查询额度数据
- 修复 OAuth 登录授权首次点击无反应的问题，确保智谱和火山供应商的 OAuth 流程正常工作
- 最小化修改范围，仅修正必需代码

**Non-Goals:**
- 不重构 MiniMax 适配器的整体架构
- 不修改 OAuth 服务器核心逻辑
- 不处理 Token 过期时间硬编码问题（非本次 BUG 范围）
- 不优化 OAuth 服务器并发竞态问题

## Decisions

### Decision 1: MiniMax URL 修正方式

**选择**: 直接替换 `minimax.ts` 中的 `apiUrl` 常量

**理由**: URL 是硬编码的字符串常量，直接修正即可。不需要改为从配置文件读取——当前其他供应商（智谱、火山）的 API URL 也是硬编码的，保持一致。

**备选方案**: 将 URL 提取到配置文件 → 过度设计，与现有代码风格不一致，且增加维护成本。

### Decision 2: MiniMax 请求头补充

**选择**: 在 MiniMax 适配器请求头中添加 `User-Agent` 和 `Accept`

**理由**: 用户提供的可用 curl 命令包含这两个头。部分 API 服务器会对缺少 User-Agent 的请求返回非标准响应。添加后可提高兼容性，且不影响现有功能。

### Decision 3: OAuth stopOAuth 容错方案

**选择**: 在 Rust 端修改 `stop_oauth_server` 命令，当无运行中的服务器时返回 `Ok(())` 而非 `Err`

**理由**: 
- "停止一个不存在的服务器" 语义上等价于 "服务器已停止"，返回成功更合理
- 修改 Rust 端比在 TypeScript 端用 try-catch 包装更优雅，因为所有调用者都受益
- 不需要修改 TypeScript 端的 `stopOAuth` 函数签名

**备选方案 A**: 在 `Config.vue` 的 `startOAuth()` 中用独立 try-catch 包装 `stopOAuth()` → 可行但侵入性更大，且需要所有调用者都处理这个边界
**备选方案 B**: 在 TypeScript `stopOAuth()` 中捕获异常并忽略 → 可行但将错误处理推到中间层

## Risks / Trade-offs

- **[MiniMax API 变更风险]** → 缓解：使用用户已验证的最新可用 URL（`www.minimaxi.com/v1/token_plan/remains`），与官方文档一致
- **[OAuth 停止幂等性]** → 无风险：将 stop 改为幂等操作（不存在时返回 Ok）是通用最佳实践
- **[请求头变更]** → 低风险：添加 User-Agent 和 Accept 不影响现有 API 行为
