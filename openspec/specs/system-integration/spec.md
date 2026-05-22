## Purpose

定义桌面应用与操作系统集成相关能力，包括系统托盘、通知、自启动、配置文件、OAuth 回调与日志。

## Requirements

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

### Requirement: 托盘图标状态指示
托盘图标 SHALL 根据当前额度状态显示不同的视觉状态。

#### Scenario: 正常状态
- **WHEN** 所有启用供应商的额度均低于提醒阈值
- **THEN** 托盘图标 SHALL 显示正常状态

#### Scenario: 警告状态
- **WHEN** 任一启用供应商的任一维度额度达到提醒阈值
- **THEN** 托盘图标 SHALL 切换为警告状态

#### Scenario: 错误状态
- **WHEN** 所有启用的供应商数据获取均失败
- **THEN** 托盘图标 SHALL 切换为错误状态

### Requirement: 系统通知
系统 SHALL 通过操作系统原生通知 API 发送限额提醒通知。

#### Scenario: 发送系统通知
- **WHEN** 检测到额度达到提醒阈值
- **THEN** 系统 SHALL 调用操作系统通知 API 发送包含供应商和额度信息的通知

### Requirement: 开机自启动
系统 SHALL 支持注册和取消操作系统开机自启动。

#### Scenario: 注册开机自启动
- **WHEN** 用户在配置中开启开机自启动
- **THEN** 系统 SHALL 在操作系统注册自启动项

#### Scenario: 取消开机自启动
- **WHEN** 用户在配置中关闭开机自启动
- **THEN** 系统 SHALL 从操作系统移除自启动项

### Requirement: 配置文件读写
系统 SHALL 通过 Rust 侧读写 JSON 格式的配置文件。

#### Scenario: 加载配置文件
- **WHEN** 应用启动
- **THEN** 系统 SHALL 从 `~/.config/coding-plan-monitor/config.json` 加载配置

#### Scenario: 配置文件不存在时使用默认值
- **WHEN** 配置文件不存在
- **THEN** 系统 SHALL 使用内置默认配置创建配置文件

#### Scenario: 配置文件损坏时使用默认值
- **WHEN** 配置文件内容不是合法 JSON
- **THEN** 系统 SHALL 使用默认配置启动并记录警告日志

#### Scenario: 保存配置到文件
- **WHEN** 用户在配置窗口点击保存
- **THEN** 系统 SHALL 将当前配置写入 `~/.config/coding-plan-monitor/config.json`

### Requirement: OAuth 本地回调服务器
系统 SHALL 支持在本地启动临时 HTTP 服务器接收 OAuth 授权回调，并能在服务器仍运行时安全停止并重新启动。

#### Scenario: 启动 OAuth 回调服务器
- **WHEN** 供应商需要 OAuth 授权且用户触发登录
- **THEN** Rust 侧 SHALL 先停止已有的 OAuth 服务器（如有），然后在本地端口启动新的 HTTP 服务器，并在系统默认浏览器中打开授权页面

#### Scenario: 接收 OAuth 回调
- **WHEN** 供应商 OAuth 重定向到 `http://localhost:<port>/callback`
- **THEN** 系统 SHALL 从回调 URL 中提取 token，关闭 HTTP 服务器，并将 token 传递给 TS 侧

#### Scenario: OAuth 超时处理
- **WHEN** OAuth 授权超过5分钟未完成
- **THEN** 系统 SHALL 关闭 HTTP 服务器并通知 TS 侧授权超时

#### Scenario: 浏览器打开授权页面
- **WHEN** OAuth 服务器启动成功
- **THEN** 系统 SHALL 使用系统默认浏览器打开授权 URL，不得打开 about:blank 页面

#### Scenario: 重复触发 OAuth 登录
- **WHEN** 用户在前一次 OAuth 流程未完成时再次点击登录授权
- **THEN** 系统 SHALL 先停止旧服务器，再启动新服务器并重新打开浏览器

### Requirement: 日志记录
系统 SHALL 将运行日志写入文件，用于问题排查。

#### Scenario: 日志写入文件
- **WHEN** 应用运行过程中产生日志
- **THEN** 日志 SHALL 写入 `~/.config/coding-plan-monitor/app.log`

#### Scenario: 日志轮转
- **WHEN** 日志文件超过 5MB
- **THEN** 系统 SHALL 进行日志轮转，保留最近一个备份文件
