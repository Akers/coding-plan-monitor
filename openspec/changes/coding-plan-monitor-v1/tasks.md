## 1. 项目初始化与构建基础

- [ ] 1.1 初始化 Tauri 2.0 项目（`npm create tauri-app`，选择 Vue + TypeScript 模板）
- [ ] 1.2 安装前端依赖（Pinia、Vite 配置确认）
- [ ] 1.3 配置 `tauri.conf.json` 基础设置（窗口权限、系统托盘权限、通知权限、文件系统权限）
- [ ] 1.4 创建项目目录结构（src/views、src/components、src/providers、src/services、src/stores、src-tauri/src/commands）
- [ ] 1.5 验证项目可正常构建运行（`npm run tauri dev`）

## 2. 核心数据模型（data-model）

- [ ] 2.1 定义 TypeScript 类型：ProviderId、ProviderConfig、UsageMetric、UsageInfo、AppConfig
- [ ] 2.2 创建默认 AppConfig 工厂函数（默认值：刷新30s、轮播10s、背景#333333、透明度0.8、阈值50/80、提醒80%）
- [ ] 2.3 定义 Rust 侧对应的结构体（ProviderConfig、AppConfig），实现 Serialize/Deserialize
- [ ] 2.4 编写数据模型的单元测试（类型校验、默认值、JSON 序列化/反序列化）

## 3. 配置文件读写（system-integration 部分）

- [ ] 3.1 Rust 侧实现 `load_config` IPC 命令（读取 ~/.config/coding-plan-monitor/config.json，不存在则创建默认配置）
- [ ] 3.2 Rust 侧实现 `save_config` IPC 命令（写入配置文件）
- [ ] 3.3 TS 侧 Pinia config store（加载/保存/响应式配置状态）
- [ ] 3.4 配置文件损坏时使用默认配置并记录警告日志
- [ ] 3.5 编写配置读写的单元测试（正常读写、文件不存在、文件损坏）

## 4. 供应商适配器框架（provider-adapter）

- [ ] 4.1 定义 `ProviderAdapter` 接口（fetchUsage、validateConfig、可选 startOAuth）
- [ ] 4.2 实现适配器注册表（ProviderRegistry，通过 ProviderId 查找适配器实例）
- [ ] 4.3 实现 MiniMax 适配器（REST API 调用、Bearer Token 认证、按 model_name 区分文本/图像）
- [ ] 4.4 编写 MiniMax 适配器的单元测试（mock API 响应、成功/失败/认证错误场景）
- [ ] 4.5 实现智谱 CodingPlan 适配器（API/页面解析、5h/周/MCP月/今日Token消耗提取）
- [ ] 4.6 编写智谱适配器的单元测试（mock 响应、数据解析、403 授权失效）
- [ ] 4.7 实现火山 CodingPlan 适配器（API/页面解析、5h/周/MCP月/今日Token消耗提取）
- [ ] 4.8 编写火山适配器的单元测试

## 5. 系统托盘（system-integration 部分）

- [ ] 5.1 Rust 侧实现系统托盘图标（双击事件、右键菜单：显示/隐藏面板、配置窗口、退出）
- [ ] 5.2 托盘图标状态切换（normal/warning/error）
- [ ] 5.3 TS 侧监听托盘事件（toggle_panel、open_config）
- [ ] 5.4 验证托盘功能（双击切换、右键菜单各项可用）

## 6. 悬浮面板窗口（panel）

- [ ] 6.1 Rust 侧创建无边框置顶窗口（decorations: false, alwaysOnTop: true）
- [ ] 6.2 实现面板拖拽移动（Rust 侧 mousedown/mousemove 事件处理）
- [ ] 6.3 实现面板四边吸附（检测窗口位置到屏幕边缘距离，自动贴合）
- [ ] 6.4 实现面板最小化（收起到屏幕边沿，显示展开箭头按钮）
- [ ] 6.5 实现 `set_click_through` IPC 命令（Windows 下设置窗口点击穿透）
- [ ] 6.6 实现 `set_panel_always_on_top` 和 `set_panel_position` IPC 命令
- [ ] 6.7 编写窗口操作的集成测试

## 7. 悬浮面板 UI 组件（panel）

- [ ] 7.1 创建 Panel.vue 主视图（加载配置、加载额度数据、供应商轮播状态）
- [ ] 7.2 实现 ProviderTabs 组件（供应商标签栏、左右箭头、当前选中高亮）
- [ ] 7.3 实现 UsageBar 组件（进度条、百分比、已用/总额、重置倒计时、三级颜色）
- [ ] 7.4 实现面板底部信息栏（刷新时间、设置按钮、锁定按钮、最小化按钮）
- [ ] 7.5 面板动态高度适配（根据供应商维度数量调整窗口高度）
- [ ] 7.6 错误状态显示（连接失败标记、需重新授权按钮）
- [ ] 7.7 Pinia usage store（额度数据状态管理、缓存最后一次成功数据）
- [ ] 7.8 编写面板 UI 组件的单元测试

## 8. 配置窗口 UI（config-window）

- [ ] 8.1 Rust 侧创建配置窗口（独立 Tauri 窗口、初始隐藏）
- [ ] 8.2 创建 Config.vue 主视图（选项卡切换：通用设置/额度显示/供应商管理）
- [ ] 8.3 实现通用设置选项卡（刷新间隔、轮播间隔、背景色、透明度、吸附边、锁定、自启动）
- [ ] 8.4 实现额度显示设置选项卡（阈值1/2数值、三级颜色选择、限额提醒开关和阈值）
- [ ] 8.5 实现供应商管理选项卡（启用/禁用、API Key 输入掩码、OAuth 登录按钮、验证按钮）
- [ ] 8.6 保存/取消按钮（保存时调用 save_config IPC，取消时恢复原值）
- [ ] 8.7 配置保存后通过 Tauri 事件通知悬浮面板刷新
- [ ] 8.8 编写配置窗口 UI 组件的单元测试

## 9. 数据刷新调度（refresh-scheduler）

- [ ] 9.1 实现 refresh.ts 定时刷新服务（setInterval 调度、并发获取所有启用供应商数据）
- [ ] 9.2 实现 carousel.ts 轮播服务（自动切换供应商、手动切换重置计时器）
- [ ] 9.3 刷新失败容错（单个失败不影响其他，显示缓存数据 + 错误标记）
- [ ] 9.4 应用启动时立即刷新一次
- [ ] 9.5 编写刷新调度的单元测试（定时器、轮播切换、失败容错）

## 10. 限额通知（refresh-scheduler 部分）

- [ ] 10.1 实现 alert.ts 限额检测逻辑（检查各维度百分比、同一周期防重复）
- [ ] 10.2 Rust 侧实现 `send_notification` IPC 命令（调用系统通知 API）
- [ ] 10.3 TS 侧集成：刷新数据后调用 alert 检测，达到阈值时调用 send_notification
- [ ] 10.4 编写限额通知的单元测试（阈值检测、防重复、通知关闭时不发送）

## 11. OAuth 授权流程（system-integration 部分）

- [ ] 11.1 Rust 侧实现 `start_oauth_server` IPC 命令（随机端口启动 HTTP 服务器）
- [ ] 11.2 Rust 侧实现 `stop_oauth_server` IPC 命令
- [ ] 11.3 接收回调 URL 提取 token 并传递给 TS 侧
- [ ] 11.4 OAuth 超时处理（5分钟未完成自动关闭服务器）
- [ ] 11.5 TS 侧调用：供应商需要 OAuth 时触发 start_oauth_server，打开外部浏览器
- [ ] 11.6 编写 OAuth 流程的集成测试

## 12. 开机自启动（system-integration 部分）

- [ ] 12.1 Rust 侧实现 `set_auto_start` IPC 命令（Windows 注册表操作）
- [ ] 12.2 TS 侧集成：配置变更时调用 set_auto_start
- [ ] 12.3 验证开机自启动功能

## 13. 日志系统（system-integration 部分）

- [ ] 13.1 Rust 侧实现日志初始化（文件输出到 ~/.config/coding-plan-monitor/app.log）
- [ ] 13.2 日志轮转（超过 5MB 时备份）
- [ ] 13.3 关键路径添加日志（配置加载、刷新结果、错误、OAuth 流程）

## 14. 集成测试与验证

- [ ] 14.1 端到端测试：应用启动 → 悬浮面板显示 → 加载配置 → 刷新数据
- [ ] 14.2 端到端测试：配置窗口打开 → 修改配置 → 保存 → 面板更新
- [ ] 14.3 端到端测试：供应商轮播 → 手动切换 → 面板维度展示
- [ ] 14.4 端到端测试：额度达到阈值 → 系统通知触发
- [ ] 14.5 端到端测试：面板拖拽 → 吸附 → 最小化 → 展开
- [ ] 14.6 端到端测试：系统托盘双击/右键菜单
