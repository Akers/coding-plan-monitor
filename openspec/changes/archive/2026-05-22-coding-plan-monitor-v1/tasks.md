# coding-plan-monitor-v1 实施任务清单

> 每个 `- [ ]` 为一个 2-5 分钟微任务，严格按 TDD 流程执行（先写失败测试 → 最小实现 → 重构）。
> 标记方式：`- [x]` 已完成，`- [ ]` 待执行，`- [-]` 进行中。

---

## 1. 项目初始化与构建基础

### 1.1 Tauri 项目脚手架
- [x] 1.1.1 用 `npm create tauri-app@latest` 初始化项目，选择 Vue + TypeScript 模板
- [x] 1.1.2 验证 `npm run tauri dev` 可正常启动空白窗口
- [x] 1.1.3 安装 Pinia：`npm install pinia`，在 `src/main.ts` 注册
- [x] 1.1.4 验证 Pinia 集成：创建一个临时 store，确认 devtools 可见

### 1.2 项目目录结构
- [x] 1.2.1 创建前端目录：`src/types/`、`src/providers/`、`src/services/`、`src/stores/`、`src/views/`、`src/components/panel/`、`src/components/config/`
- [x] 1.2.2 创建 Tauri 端目录：`src-tauri/src/commands/`（如不存在）
- [x] 1.2.3 创建测试目录：`src/__tests__/`、`src/__tests__/providers/`、`src/__tests__/services/`、`src/__tests__/components/`
- [x] 1.2.4 安装测试依赖：`npm install -D vitest @vue/test-utils happy-dom`，配置 `vitest.config.ts`

### 1.3 Tauri 权限配置
- [x] 1.3.1 在 `tauri.conf.json` 添加系统托盘权限（tray 图标、菜单）
- [x] 1.3.2 添加通知权限
- [x] 1.3.3 添加文件系统权限（app_data_dir 读写）
- [x] 1.3.4 添加 shell.open 权限（打开外部浏览器）
- [x] 1.3.5 验证所有权限配置后项目可正常构建

### 1.4 前端基础配置
- [x] 1.4.1 配置 `vite.config.ts` 路径别名（`@` → `src/`）
- [x] 1.4.2 创建 `src/App.vue` 骨架（仅 router-view 占位）
- [x] 1.4.3 创建 `src/router/index.ts` 基础路由（`/` → Panel，`/config` → Config）
- [x] 1.4.4 验证路由切换正常工作

---

## 2. 核心数据模型（data-model）

### 2.1 TypeScript 类型定义
- [x] 2.1.1 编写测试：`src/__tests__/types/provider.test.ts`——验证 ProviderId 联合类型包含 'zhipu'|'minimax'|'volcengine'
- [x] 2.1.2 实现：`src/types/provider.ts`——定义 `ProviderId`、`AuthType`、`ProviderConfig` 类型
- [x] 2.1.3 编写测试：验证 `UsageMetric` 包含 label/usedQuota/totalQuota/percentage/unit/resetIn
- [x] 2.1.4 实现：`src/types/usage.ts`——定义 `UsageMetric`、`UsageInfo` 类型
- [x] 2.1.5 编写测试：验证 `AppConfig` 包含全部字段（refreshInterval、carouselInterval、panelBgColor 等）
- [x] 2.1.6 实现：`src/types/config.ts`——定义 `AppConfig`、`PanelEdge`、`ThresholdConfig` 类型

### 2.2 默认配置工厂
- [x] 2.2.1 编写测试：验证 `getDefaultConfig()` 返回正确默认值（刷新30s、轮播10s、背景#333333、透明度0.8、阈值50/80、提醒80%）
- [x] 2.2.2 实现：`src/types/config.ts` 中添加 `getDefaultConfig()` 函数
- [x] 2.2.3 编写测试：验证 JSON 序列化再反序列化后数据完整
- [x] 2.2.4 验证所有类型测试通过：`npx vitest run src/__tests__/types/`

### 2.3 Rust 侧数据结构
- [x] 2.3.1 实现：`src-tauri/src/models.rs`——定义 Rust 侧 `ProviderConfig`、`AppConfig` 结构体（Serialize/Deserialize）
- [x] 2.3.2 编写 Rust 测试：验证 Rust 结构体 JSON 反序列化匹配 TS 类型
- [x] 2.3.3 实现：`src-tauri/src/models.rs`——添加 `get_default_config()` Rust 函数
- [x] 2.3.4 编写 Rust 测试：验证默认配置序列化与 TS 侧一致
- [x] 2.3.5 在 `src-tauri/src/lib.rs` 中 `mod models;` 并验证编译

---

## 3. 配置文件读写（system-integration）

### 3.1 Rust 侧配置加载
- [x] 3.1.1 编写 Rust 测试：`load_config` 在配置文件存在时正确读取
- [x] 3.1.2 实现：`src-tauri/src/commands/config.rs`——`load_config` 命令（读取 JSON 文件）
- [x] 3.1.3 编写 Rust 测试：`load_config` 在文件不存在时创建默认配置
- [x] 3.1.4 实现：文件不存在时创建目录和默认配置文件的逻辑
- [x] 3.1.5 编写 Rust 测试：`load_config` 在 JSON 格式错误时返回默认配置
- [x] 3.1.6 实现：JSON 解析失败的容错处理

### 3.2 Rust 侧配置保存
- [x] 3.2.1 编写 Rust 测试：`save_config` 正确写入 JSON 文件
- [x] 3.2.2 实现：`src-tauri/src/commands/config.rs`——`save_config` 命令
- [x] 3.2.3 编写 Rust 测试：保存后重新加载，数据一致
- [x] 3.2.4 在 `src-tauri/src/lib.rs` 注册 `load_config`/`save_config` 命令
- [x] 3.2.5 验证从 TS 侧通过 `invoke('load_config')` / `invoke('save_config')` 调用成功

### 3.3 TS 侧 Pinia Config Store
- [x] 3.3.1 编写测试：`useConfigStore` 初始状态为 null
- [x] 3.3.2 实现：`src/stores/config.ts`——定义 `useConfigStore`（state: config, actions: load/save）
- [x] 3.3.3 编写测试：`loadConfig()` 调用 IPC 并设置 state
- [x] 3.3.4 实现：`loadConfig` action 调用 `invoke('load_config')`
- [x] 3.3.5 编写测试：`saveConfig()` 调用 IPC 保存并保持 state
- [x] 3.3.6 实现：`saveConfig` action 调用 `invoke('save_config')`
- [x] 3.3.7 验证所有配置读写测试通过

---

## 4. 供应商适配器框架（provider-adapter）

### 4.1 统一适配器接口
- [x] 4.1.1 编写测试：验证 `ProviderAdapter` 接口定义包含 `fetchUsage`、`validateConfig` 方法签名
- [x] 4.1.2 实现：`src/providers/types.ts`——定义 `ProviderAdapter` interface
- [x] 4.1.3 编写测试：验证适配器注册表可通过 ProviderId 获取适配器
- [x] 4.1.4 实现：`src/providers/registry.ts`——`ProviderRegistry` 类（register/get/listAll）

### 4.2 MiniMax 适配器
- [x] 4.2.1 编写测试：MiniMax 适配器 `validateConfig` 在 apiKey 非空时返回 true
- [x] 4.2.2 实现：`src/providers/minimax.ts`——骨架 + `validateConfig`
- [x] 4.2.3 编写测试：mock MiniMax API 成功响应，验证返回 4 个 UsageMetric（文本5h/文本周/图像5h/图像周）
- [x] 4.2.4 实现：`fetchUsage`——调用 `/v1/token_plan/remains`、Bearer 认证、按 model_name 分类
- [x] 4.2.5 编写测试：mock 401 响应，验证返回认证失败错误
- [x] 4.2.6 实现：HTTP 错误处理（401/403/网络错误）
- [x] 4.2.7 编写测试：mock 异常 model_name 数据，验证适配器容错
- [x] 4.2.8 实现：未知 model_name 的容错处理
- [x] 4.2.9 将 MiniMax 适配器注册到 ProviderRegistry
- [x] 4.2.10 验证所有 MiniMax 测试通过

### 4.3 智谱 CodingPlan 适配器
- [x] 4.3.1 编写测试：智谱适配器 `validateConfig` 在 apiKey 非空时返回 true
- [x] 4.3.2 实现：`src/providers/zhipu.ts`——骨架 + `validateConfig`
- [x] 4.3.3 编写测试：mock 智谱 API 成功响应，验证返回 4 个数据（5h额度进度条、周额度进度条、MCP月额度进度条、今日Token消耗纯文本）
- [x] 4.3.4 实现：`fetchUsage`——API 调用与页面解析逻辑
- [x] 4.3.5 编写测试：mock 403 响应，验证返回授权失效错误标识
- [x] 4.3.6 实现：403 授权失效的特殊错误处理
- [x] 4.3.7 编写测试：mock 网络超时，验证错误返回
- [x] 4.3.8 实现：网络异常容错
- [x] 4.3.9 将智谱适配器注册到 ProviderRegistry
- [x] 4.3.10 验证所有智谱测试通过

### 4.4 火山 CodingPlan 适配器
- [x] 4.4.1 编写测试：火山适配器 `validateConfig` 在有 token 时返回 true
- [x] 4.4.2 实现：`src/providers/volcengine.ts`——骨架 + `validateConfig`
- [x] 4.4.3 编写测试：mock 火山 API 成功响应，验证返回 4 个数据（5h/周/MCP月/今日Token消耗）
- [x] 4.4.4 实现：`fetchUsage`——API 调用与解析逻辑
- [x] 4.4.5 编写测试：mock 无有效 token 场景，验证返回需 OAuth 授权错误
- [x] 4.4.6 实现：检测无 token 时返回 OAuth 需求标识
- [x] 4.4.7 将火山适配器注册到 ProviderRegistry
- [x] 4.4.8 验证所有火山测试通过

### 4.5 适配器框架集成验证
- [x] 4.5.1 编写测试：注册表 `listAll()` 返回 3 个适配器
- [x] 4.5.2 编写测试：通过每个 ProviderId 获取适配器并验证类型
- [x] 4.5.3 验证所有适配器框架测试通过

---

## 5. Pinia Usage Store

### 5.1 额度数据状态管理
- [x] 5.1.1 编写测试：`useUsageStore` 初始 state 为空 Map
- [x] 5.1.2 实现：`src/stores/usage.ts`——定义 state（usageMap: Map<ProviderId, UsageInfo>、lastRefreshAt）
- [x] 5.1.3 编写测试：`fetchProviderUsage(providerId)` 调用适配器并存入 state
- [x] 5.1.4 实现：`fetchProviderUsage` action——从注册表获取适配器、调用 fetchUsage、存入 usageMap
- [x] 5.1.5 编写测试：`fetchProviderUsage` 失败时保留上次成功数据
- [x] 5.1.6 实现：失败时保留缓存、设置 error 标记
- [x] 5.1.7 编写测试：`fetchAllUsage()` 并发调用所有启用供应商
- [x] 5.1.8 实现：`fetchAllUsage` action——并发调用 + 更新 lastRefreshAt
- [x] 5.1.9 验证所有 usage store 测试通过

---

## 6. 系统托盘（system-integration）

### 6.1 Rust 侧托盘基础
- [x] 6.1.1 准备托盘图标文件（正常/警告/错误三种状态的 PNG）
- [x] 6.1.2 实现：`src-tauri/src/tray.rs`——系统托盘初始化（图标、菜单项：显示/隐藏面板、配置窗口、退出）
- [x] 6.1.3 实现：双击托盘图标触发 `toggle_panel` 事件
- [x] 6.1.4 实现：右键菜单各选项触发对应事件（show_panel / hide_panel / open_config / quit）
- [x] 6.1.5 在 `src-tauri/src/lib.rs` 注册托盘插件
- [x] 6.1.6 验证：启动应用，托盘图标显示，右键菜单可用

### 6.2 托盘图标状态切换
- [x] 6.2.1 实现：`update_tray_icon` 命令——接收状态参数（normal/warning/error），切换托盘图标
- [x] 6.2.2 TS 侧监听额度变化，根据阈值状态调用 `update_tray_icon`
- [x] 6.2.3 验证：模拟不同额度状态，托盘图标正确切换

### 6.3 退出处理
- [x] 6.3.1 实现：托盘"退出应用"菜单项处理——保存配置后退出
- [x] 6.3.2 实现：窗口关闭时最小化到托盘而非退出
- [x] 6.3.3 验证：关闭窗口后应用仍在托盘运行

---

## 7. 悬浮面板窗口（panel - Rust 侧）

### 7.1 面板窗口创建
- [x] 7.1.1 实现：`src-tauri/src/commands/panel.rs`——`create_panel_window` 命令（无边框、置顶、固定宽度）
- [x] 7.1.2 配置面板窗口属性（decorations: false, alwaysOnTop: true, width: 320, resizable: false）
- [x] 7.1.3 在 `src-tauri/src/lib.rs` 注册面板窗口创建命令
- [x] 7.1.4 验证：启动后面板窗口显示为无边框置顶

### 7.2 面板拖拽移动
- [x] 7.2.1 实现：`start_drag` IPC 命令——开始拖拽（记录起始位置）
- [x] 7.2.2 实现：面板 Vue 侧 mousedown 事件发送 `start_drag`
- [x] 7.2.3 验证：可拖拽移动面板位置

### 7.3 四边吸附
- [x] 7.3.1 实现：`snap_to_edge` IPC 命令——接收吸附方向（top/bottom/left/right），移动窗口到屏幕边缘
- [x] 7.3.2 实现：拖拽释放时自动检测是否接近边缘（阈值 20px），触发吸附
- [x] 7.3.3 验证：拖到边缘时自动贴合

### 7.4 最小化与展开
- [x] 7.4.1 实现：`minimize_panel` 命令——收起到屏幕边沿，调整窗口大小为仅显示展开按钮
- [x] 7.4.2 实现：`expand_panel` 命令——展开恢复到正常大小
- [x] 7.4.3 非贴边时最小化按钮不可用
- [x] 7.4.4 验证：贴边最小化 → 点击展开按钮恢复

### 7.5 点击穿透
- [x] 7.5.1 实现：`set_click_through` IPC 命令——Windows 下 WS_EX_TRANSPARENT 样式切换
- [x] 7.5.2 验证：开启后点击穿透到下层窗口，关闭后恢复交互

### 7.6 面板位置与置顶
- [x] 7.6.1 实现：`set_panel_position` 命令——设置面板坐标
- [x] 7.6.2 实现：`set_panel_always_on_top` 命令——切换置顶状态
- [x] 7.6.3 验证位置和置顶命令工作正常

---

## 8. 悬浮面板 UI 组件（panel - Vue 侧）

### 8.1 Panel.vue 主视图
- [x] 8.1.1 编写测试：Panel.vue 渲染时加载配置和额度数据
- [x] 8.1.2 实现：`src/views/Panel.vue`——组合所有面板子组件
- [x] 8.1.3 编写测试：Panel.vue 响应配置变化更新样式
- [x] 8.1.4 实现：面板背景色、透明度、尺寸响应式绑定

### 8.2 ProviderTabs 组件
- [x] 8.2.1 编写测试：ProviderTabs 渲染所有启用供应商标签
- [x] 8.2.2 实现：`src/components/panel/ProviderTabs.vue`——标签栏 + 当前选中高亮
- [x] 8.2.3 编写测试：点击左/右箭头切换供应商
- [x] 8.2.4 实现：左右箭头切换逻辑 + emit 事件
- [x] 8.2.5 编写测试：仅一个供应商时箭头隐藏
- [x] 8.2.6 实现：条件渲染箭头

### 8.3 UsageBar 组件
- [x] 8.3.1 编写测试：UsageBar 渲染进度条、百分比、已用/总额
- [x] 8.3.2 实现：`src/components/panel/UsageBar.vue`——进度条 + 百分比 + 已用/总额文字
- [x] 8.3.3 编写测试：percentage < 50 时进度条颜色为绿色
- [x] 8.3.4 编写测试：50 <= percentage < 80 时颜色为黄色
- [x] 8.3.5 编写测试：percentage >= 80 时颜色为红色
- [x] 8.3.6 实现：三级颜色计算逻辑（基于配置阈值）
- [x] 8.3.7 编写测试：有 resetIn 时显示倒计时
- [x] 8.3.8 实现：重置倒计时显示

### 8.4 ExtraInfo 组件
- [x] 8.4.1 编写测试：ExtraInfo 渲染纯文本附加信息
- [x] 8.4.2 实现：`src/components/panel/ExtraInfo.vue`——纯文本行显示
- [x] 8.4.3 编写测试：无 extraInfo 时不渲染
- [x] 8.4.4 实现：条件渲染

### 8.5 面板底部信息栏
- [x] 8.5.1 编写测试：底部栏显示"X秒前更新"或"X分钟前更新"
- [x] 8.5.2 实现：`src/components/panel/PanelFooter.vue`——刷新时间 + 操作按钮
- [x] 8.5.3 编写测试：点击设置按钮 emit 'open-config'
- [x] 8.5.4 实现：设置按钮点击事件
- [x] 8.5.5 编写测试：锁定按钮切换状态
- [x] 8.5.6 实现：锁定/解锁切换
- [x] 8.5.7 编写测试：非贴边时最小化按钮不可用
- [x] 8.5.8 实现：最小化按钮可用性条件逻辑

### 8.6 错误状态显示
- [x] 8.6.1 编写测试：数据获取失败时显示红色"连接失败"标记
- [x] 8.6.2 实现：`src/components/panel/ErrorBadge.vue`——连接失败标记组件
- [x] 8.6.3 编写测试：授权失效时显示"需重新授权"按钮
- [x] 8.6.4 实现：`src/components/panel/AuthExpired.vue`——授权失效提示 + 登录按钮

### 8.7 面板动态高度
- [x] 8.7.1 编写测试：不同维度数量渲染不同高度
- [x] 8.7.2 实现：根据维度数量动态调整窗口高度（通过 IPC 调用 Rust 侧 resize）
- [x] 8.7.3 验证面板高度随维度数量自适应

---

## 9. 配置窗口 UI（config-window）

### 9.1 Rust 侧配置窗口创建
- [x] 9.1.1 实现：`create_config_window` 命令——创建独立 Tauri 窗口（初始隐藏）
- [x] 9.1.2 实现：配置窗口属性（有边框、非置顶、固定大小 600x500）
- [x] 9.1.3 注册配置窗口命令
- [x] 9.1.4 验证：通过 IPC 可打开配置窗口

### 9.2 Config.vue 主视图
- [x] 9.2.1 编写测试：Config.vue 渲染三个选项卡
- [x] 9.2.2 实现：`src/views/Config.vue`——选项卡容器（通用设置/额度显示/供应商管理）
- [x] 9.2.3 编写测试：点击选项卡切换内容区域
- [x] 9.2.4 实现：选项卡切换逻辑

### 9.3 通用设置选项卡
- [x] 9.3.1 编写测试：通用设置渲染刷新间隔、轮播间隔输入框
- [x] 9.3.2 实现：`src/components/config/GeneralSettings.vue`——刷新间隔 + 轮播间隔输入
- [x] 9.3.3 编写测试：修改面板背景色触发预览更新
- [x] 9.3.4 实现：背景色选择器（color input）
- [x] 9.3.5 编写测试：透明度滑块调整
- [x] 9.3.6 实现：透明度滑块（range 0-1）
- [x] 9.3.7 编写测试：吸附边选择（上/下/左/右）
- [x] 9.3.8 实现：吸附边下拉选择
- [x] 9.3.9 编写测试：锁定开关切换
- [x] 9.3.10 实现：锁定 toggle 开关
- [x] 9.3.11 编写测试：自启动开关切换
- [x] 9.3.12 实现：自启动 toggle 开关

### 9.4 额度显示设置选项卡
- [x] 9.4.1 编写测试：额度设置渲染阈值1/2数值输入
- [x] 9.4.2 实现：`src/components/config/DisplaySettings.vue`——阈值1/2 数值输入
- [x] 9.4.3 编写测试：三级颜色选择器
- [x] 9.4.4 实现：三级颜色 color input
- [x] 9.4.5 编写测试：限额提醒开关和阈值输入
- [x] 9.4.6 实现：限额提醒 toggle + 阈值输入

### 9.5 供应商管理选项卡
- [x] 9.5.1 编写测试：渲染 3 个供应商卡片（智谱/MiniMax/火山）
- [x] 9.5.2 实现：`src/components/config/ProviderSettings.vue`——供应商列表卡片
- [x] 9.5.3 编写测试：启用/禁用供应商复选框
- [x] 9.5.4 实现：启用/禁用 toggle
- [x] 9.5.5 编写测试：API Key 输入框以掩码形式显示
- [x] 9.5.6 实现：API Key input（type=password 掩码显示）
- [x] 9.5.7 编写测试：点击"验证"按钮触发配置验证
- [x] 9.5.8 实现：验证按钮——调用 `validateConfig` 显示结果
- [x] 9.5.9 编写测试：点击"登录授权"按钮触发 OAuth 流程
- [x] 9.5.10 实现：OAuth 登录按钮——调用 `start_oauth_server` + 打开浏览器

### 9.6 保存/取消按钮
- [x] 9.6.1 编写测试：点击"保存"调用 `saveConfig` 并通知面板
- [x] 9.6.2 实现：保存按钮逻辑——调用 configStore.saveConfig() + emit 事件通知面板
- [x] 9.6.3 编写测试：点击"取消"恢复原始值
- [x] 9.6.4 实现：取消按钮——恢复编辑前快照
- [x] 9.6.5 实现：保存成功后通过 Tauri `emit` 通知面板窗口刷新配置
- [x] 9.6.6 验证：保存配置 → 面板实时更新

---

## 10. 数据刷新调度（refresh-scheduler）

### 10.1 定时刷新服务
- [x] 10.1.1 编写测试：`RefreshService` 按指定间隔触发刷新
- [x] 10.1.2 实现：`src/services/refresh.ts`——`RefreshService` 类（start/stop/setInterval）
- [x] 10.1.3 编写测试：修改间隔后旧定时器取消、新定时器启动
- [x] 10.1.4 实现：`setInterval` 方法——取消旧定时器、创建新定时器
- [x] 10.1.5 编写测试：`stop()` 清除定时器
- [x] 10.1.6 实现：`stop` 方法
- [x] 10.1.7 编写测试：并发获取所有启用供应商，单个失败不影响其他
- [x] 10.1.8 实现：并发 fetchAllUsage + 单个失败容错
- [x] 10.1.9 验证定时刷新测试通过

### 10.2 轮播服务
- [x] 10.2.1 编写测试：`CarouselService` 按间隔切换当前供应商
- [x] 10.2.2 实现：`src/services/carousel.ts`——`CarouselService` 类（start/stop/next/prev/setInterval）
- [x] 10.2.3 编写测试：手动切换后重置计时器
- [x] 10.2.4 实现：`next`/`prev` 方法重置计时器
- [x] 10.2.5 编写测试：仅一个供应商时不轮播
- [x] 10.2.6 实现：单供应商跳过轮播逻辑
- [x] 10.2.7 验证轮播服务测试通过

### 10.3 应用启动时立即刷新
- [x] 10.3.1 编写测试：应用初始化时立即调用 `fetchAllUsage`
- [x] 10.3.2 实现：在 Panel.vue `onMounted` 中启动 RefreshService 并立即触发首次刷新
- [x] 10.3.3 验证：启动后立即看到额度数据

### 10.4 手动刷新
- [x] 10.4.1 编写测试：面板右键菜单"刷新"触发即时刷新
- [x] 10.4.2 实现：面板右键菜单 + "刷新" 选项调用 `fetchAllUsage`
- [x] 10.4.3 验证手动刷新功能

---

## 11. 限额通知（refresh-scheduler 部分）

### 11.1 限额检测逻辑
- [x] 11.1.1 编写测试：维度百分比 >= 阈值时检测到超限
- [x] 11.1.2 实现：`src/services/alert.ts`——`checkAlerts` 函数（检查各维度百分比）
- [x] 11.1.3 编写测试：同一周期内同一维度不重复通知
- [x] 11.1.4 实现：已通知集合（Set<`${providerId}:${metricLabel}`>），周期内去重
- [x] 11.1.5 编写测试：限额提醒关闭时不发送通知
- [x] 11.1.6 实现：检查 alertEnabled 开关

### 11.2 Rust 侧通知命令
- [x] 11.2.1 实现：`src-tauri/src/commands/notification.rs`——`send_notification` 命令（调用系统通知 API）
- [x] 11.2.2 注册通知命令
- [x] 11.2.3 验证：从 TS 侧调用通知，Windows 弹出系统通知

### 11.3 TS 侧集成
- [x] 11.3.1 编写测试：刷新数据后调用 `checkAlerts`，超限时调用 `send_notification`
- [x] 11.3.2 实现：在 `fetchAllUsage` 完成后调用 `checkAlerts`
- [x] 11.3.3 编写测试：通知格式为"{供应商名} {维度名} 已达 {百分比}%，请留意用量"
- [x] 11.3.4 实现：通知文本格式化
- [x] 11.3.5 验证限额通知完整流程

---

## 12. OAuth 授权流程（system-integration）

### 12.1 Rust 侧 OAuth 服务器
- [x] 12.1.1 实现：`src-tauri/src/commands/oauth.rs`——`start_oauth_server` 命令（随机端口启动 HTTP 服务器）
- [x] 12.1.2 实现：`stop_oauth_server` 命令
- [x] 12.1.3 实现：回调 URL `/callback` 路由，提取 token
- [x] 12.1.4 实现：token 提取后通过 Tauri 事件传递给 TS 侧
- [x] 12.1.5 实现：5分钟超时自动关闭服务器
- [x] 12.1.6 注册 OAuth 命令

### 12.2 TS 侧 OAuth 调用
- [x] 12.2.1 编写测试：调用 `start_oauth_server` 返回回调 URL
- [x] 12.2.2 实现：OAuth 服务函数——调用 IPC 获取回调 URL、用 `shell.open` 打开浏览器
- [x] 12.2.3 编写测试：监听 `oauth-callback` 事件获取 token
- [x] 12.2.4 实现：监听回调事件、保存 token 到配置
- [x] 12.2.5 编写测试：超时后返回错误
- [x] 12.2.6 实现：超时处理逻辑
- [x] 12.2.7 验证 OAuth 完整流程（启动服务器 → 浏览器授权 → 回调接收 token）

---

## 13. 开机自启动（system-integration）

- [x] 13.1 实现：`src-tauri/src/commands/autostart.rs`——`set_auto_start` 命令（Windows 注册表操作）
- [x] 13.2 注册自启动命令
- [x] 13.3 TS 侧集成：配置中 `autoStart` 变更时调用 `set_auto_start`
- [x] 13.4 验证：开启自启动后 Windows 注册表有对应项

---

## 14. 日志系统（system-integration）

- [x] 14.1 实现：`src-tauri/src/logger.rs`——日志初始化（文件输出到 app.log）
- [x] 14.2 实现日志轮转（超过 5MB 时备份为 app.log.1）
- [x] 14.3 在配置加载路径添加日志（加载成功/失败/默认配置使用）
- [x] 14.4 在 OAuth 流程关键节点添加日志
- [x] 14.5 在面板窗口操作添加日志
- [x] 14.6 验证日志文件正常生成和轮转

---

## 15. 集成验证

- [x] 15.1 启动应用 → 悬浮面板显示 → 加载默认配置 → 首次刷新数据
- [x] 15.2 打开配置窗口 → 修改刷新间隔 → 保存 → 面板按新间隔刷新
- [x] 15.3 配置 MiniMax API Key → 验证 → 额度数据显示在面板
- [x] 15.4 多供应商启用 → 轮播自动切换 → 手动箭头切换
- [x] 15.5 模拟额度超阈值 → 系统通知弹出 → 托盘图标变警告
- [x] 15.6 面板拖拽到边缘 → 吸附 → 最小化 → 展开
- [x] 15.7 系统托盘双击切换面板 → 右键菜单各项可用
- [x] 15.8 配置窗口取消 → 配置恢复原值
