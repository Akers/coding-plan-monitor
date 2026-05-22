## MODIFIED Requirements

### Requirement: 配置保存与取消
配置窗口 SHALL 提供"保存"和"取消"按钮，且两个按钮 SHALL 在操作完成后关闭配置窗口。

#### Scenario: 保存配置
- **WHEN** 用户点击"保存"按钮
- **THEN** 所有配置变更 SHALL 保存到配置文件，通知悬浮面板应用新配置，并关闭配置窗口

#### Scenario: 取消配置
- **WHEN** 用户点击"取消"按钮
- **THEN** 所有未保存的变更 SHALL 被丢弃，配置恢复到上次保存的状态，并关闭配置窗口

#### Scenario: 保存按钮禁用状态
- **WHEN** 配置未发生任何修改（dirty 为 false）
- **THEN** 保存按钮 SHALL 显示为禁用状态

## MODIFIED Requirements

### Requirement: 供应商管理选项卡
供应商管理选项卡 SHALL 列出所有支持的供应商，允许启用/禁用、配置 API Key 或 OAuth 登录。OAuth 登录 SHALL 正确打开外部浏览器。

#### Scenario: OAuth 登录授权
- **WHEN** 用户点击"登录授权"按钮
- **THEN** 系统 SHALL 在外部浏览器中打开供应商的授权页面（非 about:blank），授权成功后自动获取 token

#### Scenario: OAuth 授权中断后重试
- **WHEN** 用户关闭了 OAuth 授权页面后再次点击"登录授权"按钮
- **THEN** 系统 SHALL 能够重新启动 OAuth 服务器并在浏览器中重新打开授权页面
