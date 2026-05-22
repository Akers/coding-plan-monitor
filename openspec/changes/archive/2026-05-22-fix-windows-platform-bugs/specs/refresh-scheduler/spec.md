## ADDED Requirements

### Requirement: 悬浮面板启动时初始化刷新调度器
悬浮面板 SHALL 在初始化时创建供应商注册表并启动刷新调度器，确保数据能自动获取和更新。

#### Scenario: 面板挂载时启动刷新
- **WHEN** 悬浮面板 Vue 组件挂载完成（onMounted）
- **THEN** 系统 SHALL 初始化 ProviderRegistry，注册所有适配器，并调用 startRefreshScheduler 启动定时刷新

#### Scenario: 配置变更后重启刷新
- **WHEN** 悬浮面板接收到 config-saved 事件
- **THEN** 系统 SHALL 重新加载配置，更新启用的供应商列表，并调用 restartRefreshScheduler 重启刷新调度器

#### Scenario: 面板卸载时停止刷新
- **WHEN** 悬浮面板 Vue 组件即将卸载（onUnmounted）
- **THEN** 系统 SHALL 调用 stopRefreshScheduler 停止定时刷新，释放资源
