## Why

智谱供应商的"登录授权"按钮点击后，浏览器打开的 URL `https://open.bigmodel.cn/user/api/paas/token` 返回 404 页面。该 URL 是智谱平台旧版路径，已被平台迁移到新的用户中心路径。用户无法完成 OAuth 授权流程。

## What Changes

- 将 `Config.vue` 中 `OAUTH_URLS.zhipu` 从失效的 `https://open.bigmodel.cn/user/api/paas/token` 更新为当前有效的 `https://open.bigmodel.cn/usercenter/apikeys`
- 更新对应的测试用例中的 URL 断言

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `config-window`: 登录授权按钮对应的跳转 URL 配置变更

## Impact

- **代码**: `src/views/Config.vue` 第 123 行（OAUTH_URLS 常量）
- **测试**: 相关测试文件中的 URL 断言需同步更新
- **用户影响**: 修复后用户可正常跳转到智谱 API Keys 管理页面完成授权
- **风险**: 低风险，仅变更一个 URL 常量字符串
