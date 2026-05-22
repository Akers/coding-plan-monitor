## ADDED Requirements

### Requirement: 选项卡式配置布局
配置窗口 SHALL 使用选项卡布局，包含"通用设置"、"额度显示"和"供应商管理"三个选项卡。

#### Scenario: 切换选项卡
- **WHEN** 用户点击不同的选项卡标题
- **THEN** 配置窗口 SHALL 显示对应选项卡的内容区域

### Requirement: 通用设置选项卡
通用设置选项卡 SHALL 包含刷新间隔、轮播间隔、面板外观、吸附边、锁定和自启动等配置项。

#### Scenario: 修改刷新间隔
- **WHEN** 用户在通用设置中修改刷新间隔数值
- **THEN** 系统 SHALL 按新间隔定时刷新额度数据

#### Scenario: 修改面板背景色
- **WHEN** 用户选择新的面板背景色
- **THEN** 悬浮面板 SHALL 立即应用新的背景色

#### Scenario: 修改面板透明度
- **WHEN** 用户拖动透明度滑块
- **THEN** 悬浮面板 SHALL 实时调整透明度

#### Scenario: 切换吸附边
- **WHEN** 用户选择不同的吸附边（上/下/左/右）
- **THEN** 悬浮面板 SHALL 移动到对应边吸附

#### Scenario: 切换面板锁定
- **WHEN** 用户切换面板锁定开关
- **THEN** 悬浮面板 SHALL 立即启用或禁用拖拽移动

#### Scenario: 切换开机自启动
- **WHEN** 用户切换开机自启动开关
- **THEN** 系统 SHALL 注册或取消系统自启动

### Requirement: 额度显示设置选项卡
额度显示选项卡 SHALL 包含阈值配置、阈值颜色自定义和限额提醒设置。

#### Scenario: 修改额度阈值
- **WHEN** 用户修改阈值1或阈值2的数值
- **THEN** 悬浮面板的进度条 SHALL 按新阈值重新着色

#### Scenario: 自定义阈值颜色
- **WHEN** 用户为三级阈值选择不同颜色
- **THEN** 进度条 SHALL 使用新的颜色方案

#### Scenario: 开关限额提醒
- **WHEN** 用户开启限额提醒并设置提醒阈值
- **THEN** 系统在额度达到阈值时 SHALL 发送系统通知

### Requirement: 供应商管理选项卡
供应商管理选项卡 SHALL 列出所有支持的供应商，允许启用/禁用、配置 API Key 或 OAuth 登录。

#### Scenario: 启用/禁用供应商
- **WHEN** 用户勾选或取消勾选供应商的启用复选框
- **THEN** 该供应商 SHALL 被加入或移出轮播列表

#### Scenario: 输入 API Key
- **WHEN** 用户在供应商配置中输入 API Key
- **THEN** API Key SHALL 以掩码形式显示（如 ••••••），并保存到配置文件

#### Scenario: OAuth 登录授权
- **WHEN** 用户点击"登录授权"按钮
- **THEN** 系统 SHALL 打开外部浏览器进行 OAuth 授权，授权成功后自动获取 token

#### Scenario: 验证供应商配置
- **WHEN** 用户点击"验证"按钮
- **THEN** 系统 SHALL 使用当前配置尝试获取额度数据，并显示验证成功或失败结果

### Requirement: 配置保存与取消
配置窗口 SHALL 提供"保存"和"取消"按钮。

#### Scenario: 保存配置
- **WHEN** 用户点击"保存"按钮
- **THEN** 所有配置变更 SHALL 保存到配置文件，并通知悬浮面板应用新配置

#### Scenario: 取消配置
- **WHEN** 用户点击"取消"按钮
- **THEN** 所有未保存的变更 SHALL 被丢弃，配置窗口恢复到上次保存的状态

### Requirement: 从系统托盘打开配置窗口
系统 SHALL 支持从系统托盘右键菜单打开配置窗口。

#### Scenario: 通过托盘菜单打开配置
- **WHEN** 用户点击系统托盘右键菜单中的"配置窗口"
- **THEN** 配置窗口 SHALL 显示并加载当前配置
