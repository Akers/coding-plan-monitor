## 1. URL 修复

- [x] 1.1 将 `src/views/Config.vue` 中 `OAUTH_URLS.zhipu` 的值从 `https://open.bigmodel.cn/user/api/paas/token` 更新为 `https://open.bigmodel.cn/usercenter/apikeys`

## 2. 测试更新

- [x] 2.1 更新相关测试文件中引用旧 URL 的断言，确保与新的 `https://open.bigmodel.cn/usercenter/apikeys` 一致（无需更新，测试文件未引用该 URL）
- [x] 2.2 运行测试套件确认所有测试通过
