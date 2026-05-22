## Purpose

定义额度数据刷新、供应商轮播、阈值检测、通知与手动刷新行为。

## Requirements

### Requirement: 定时自动刷新额度数据
系统 SHALL 按配置的刷新间隔（默认30秒）自动获取所有启用供应商的额度数据。

#### Scenario: 定时刷新触发
- **WHEN** 到达配置的刷新间隔时间
- **THEN** 系统 SHALL 对所有启用的供应商并发调用适配器获取最新额度数据

#### Scenario: 单个供应商刷新失败不影响其他
- **WHEN** 某个供应商的额度获取失败
- **THEN** 其他供应商的刷新 SHALL 继续正常执行，失败供应商显示错误状态

#### Scenario: 修改刷新间隔立即生效
- **WHEN** 用户在配置中修改刷新间隔
- **THEN** 系统 SHALL 取消当前定时器并按新间隔重新启动

### Requirement: 自动轮播供应商
系统 SHALL 按配置的轮播间隔（默认10秒）自动切换面板显示的供应商。

#### Scenario: 轮播切换到下一个供应商
- **WHEN** 轮播计时器到达配置的间隔
- **THEN** 面板 SHALL 切换到下一个启用的供应商并显示其额度数据

#### Scenario: 手动切换后重置轮播计时
- **WHEN** 用户手动切换供应商
- **THEN** 轮播计时器 SHALL 重置，从切换时刻重新开始计时

#### Scenario: 仅一个启用供应商时不轮播
- **WHEN** 只有一个供应商处于启用状态
- **THEN** 面板 SHALL 固定显示该供应商，不进行轮播切换

### Requirement: 限额阈值检测与通知
系统 SHALL 在每次获取新数据时检测各维度额度是否达到提醒阈值。

#### Scenario: 额度达到提醒阈值时发送通知
- **WHEN** 某个供应商的某个维度额度百分比大于等于提醒阈值（默认80%）且限额提醒已开启
- **THEN** 系统 SHALL 发送系统通知，格式为"{供应商名} {维度名} 已达 {百分比}%，请留意用量"

#### Scenario: 同一周期内不重复通知
- **WHEN** 某个维度的额度已在当前周期内发送过提醒通知
- **THEN** 系统 SHALL 不再为同一维度的同一周期重复发送通知

#### Scenario: 限额提醒关闭时不通知
- **WHEN** 用户关闭了限额提醒开关
- **THEN** 系统 SHALL 不发送任何限额通知

### Requirement: 应用启动时立即刷新
应用启动后 SHALL 立即获取一次所有启用供应商的额度数据。

#### Scenario: 启动时首次数据获取
- **WHEN** 应用启动完成且 Vue 前端初始化完成
- **THEN** 系统 SHALL 立即对所有启用的供应商发起额度查询

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

### Requirement: 手动触发刷新
系统 SHALL 支持通过面板右键菜单手动触发即时刷新。

#### Scenario: 右键菜单触发刷新
- **WHEN** 用户在面板右键菜单中选择"刷新"
- **THEN** 系统 SHALL 立即刷新所有启用供应商的额度数据并更新面板
