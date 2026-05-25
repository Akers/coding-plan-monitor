## Context

智谱（Zhipu AI）开放平台迁移了用户中心路径结构。项目中 `Config.vue` 的 `OAUTH_URLS.zhipu` 仍指向旧路径 `https://open.bigmodel.cn/user/api/paas/token`，该 URL 已返回 404。用户点击"登录授权"按钮后浏览器显示 404 页面，无法完成授权流程。

当前代码结构：
- `src/views/Config.vue:122-125` — `OAUTH_URLS` 常量定义了各供应商的 OAuth 跳转 URL
- `src/views/Config.vue:127-154` — `startOAuth()` 函数使用该 URL 打开浏览器
- `src/services/oauth.ts` — OAuth 服务层（调用 Tauri invoke）
- `src-tauri/src/commands/oauth.rs` — Rust 端本地回调服务器

## Goals / Non-Goals

**Goals:**
- 修复智谱供应商的 OAuth 授权 URL，使其指向当前有效的 API Keys 管理页面
- 确保现有 OAuth 流程（本地回调服务器 → 浏览器打开 → 回调接收 token）不受影响

**Non-Goals:**
- 不重构 OAuth 架构（当前架构已可用）
- 不新增供应商或认证方式
- 不处理火山引擎供应商的 URL（其 URL 当前可用）

## Decisions

### 1. 使用 `https://open.bigmodel.cn/usercenter/apikeys` 作为新的 OAuth URL

**选择**: `https://open.bigmodel.cn/usercenter/apikeys`

**依据**: 
- 智谱官方文档（docs.bigmodel.cn）引用该路径作为 API Keys 管理入口
- GitHub trufflesecurity 项目 issue #4662 确认该 URL 有效
- 多个第三方工具（Cline 等）的文档也引用此 URL

**备选方案**:
- `https://open.bigmodel.cn/`（主页）：过于宽泛，用户需要自行导航到 API Keys 页面，体验差
- 保持旧 URL + 增加容错提示：不解决根本问题，用户仍无法授权

### 2. 最小化变更范围

仅修改 `OAUTH_URLS` 常量中的 URL 字符串，不改动 OAuth 流程逻辑。变更影响面最小，风险最低。

## Risks / Trade-offs

- **[智谱平台再次迁移 URL]** → 缓解：将 URL 配置集中在 `OAUTH_URLS` 常量中，未来只需修改一处；可考虑后续将 URL 移至配置文件以支持热更新
- **[新 URL 不支持 OAuth 回调]** → 缓解：当前 OAuth 流程实际是"打开浏览器让用户获取 token"，本地回调服务器独立运行，不依赖外部页面的重定向行为。如需进一步改进，可在后续迭代中调整
