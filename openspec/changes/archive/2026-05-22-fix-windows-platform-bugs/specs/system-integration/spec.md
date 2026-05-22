## MODIFIED Requirements

### Requirement: 系统托盘图标与菜单
系统 SHALL 在系统托盘区仅显示一个图标，通过程序化方式创建并绑定事件，提供左键点击事件和右键菜单。

#### Scenario: 系统托盘图标显示
- **WHEN** 应用启动完成
- **THEN** 系统 SHALL 在系统托盘区显示且仅显示一个应用图标

#### Scenario: 左键点击托盘图标切换面板显示
- **WHEN** 用户左键点击系统托盘图标
- **THEN** 系统 SHALL 切换悬浮面板的显示/隐藏状态

#### Scenario: 右键菜单操作
- **WHEN** 用户右键点击系统托盘图标
- **THEN** 系统 SHALL 显示包含"显示面板"、"配置"和"退出"的菜单，且右键菜单 SHALL 能正常响应点击

#### Scenario: 通过菜单退出应用
- **WHEN** 用户点击托盘右键菜单中的"退出"
- **THEN** 应用 SHALL 完全退出
