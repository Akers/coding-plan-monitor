## MODIFIED Requirements

### Requirement: 供应商管理选项卡
供应商管理选项卡 SHALL 列出所有支持的供应商，允许启用/禁用、配置 API Key 或 OAuth 登录。OAuth 登录 SHALL 正确打开外部浏览器，且授权 URL SHALL 指向供应商当前有效的管理页面。

#### Scenario: 启用/禁用供应商
- **WHEN** 用户勾选或取消勾选供应商的启用复选框
- **THEN** 该供应商 SHALL 被加入或移出轮播列表

#### Scenario: 输入 API Key
- **WHEN** 用户在供应商配置中输入 API Key
- **THEN** API Key SHALL 以掩码形式显示（如 ••••••），并保存到配置文件

#### Scenario: OAuth 登录授权
- **WHEN** 用户点击"登录授权"按钮
- **THEN** 系统 SHALL 在外部浏览器中打开供应商的授权页面（非 about:blank，非 404 页面），授权成功后自动获取 token

#### Scenario: OAuth 授权中断后重试
- **WHEN** 用户关闭了 OAuth 授权页面后再次点击"登录授权"按钮
- **THEN** 系统 SHALL 能够重新启动 OAuth 服务器并在浏览器中重新打开授权页面

#### Scenario: 验证供应商配置
- **WHEN** 用户点击"验证"按钮
- **THEN** 系统 SHALL 使用当前配置尝试获取额度数据，并显示验证成功或失败结果
