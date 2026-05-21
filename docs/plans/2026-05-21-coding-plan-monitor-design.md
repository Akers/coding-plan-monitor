# CodingPlan 额度监视器 - 设计文档

> 日期：2026-05-21
> 状态：已确认

## 1. 整体架构

采用 **Tauri 2.0 轻量混合架构**：

- **Rust 侧**：负责所有系统级操作（窗口管理、系统托盘、文件存储、面板吸附、OAuth 回调服务器、系统通知、开机自启）
- **TS 侧**：负责所有业务逻辑（HTTP 请求、数据解析、供应商适配器、定时刷新调度、轮播控制、限额通知触发）
- **通信**：通过 Tauri IPC Bridge 交互

```
┌─────────────────────────────────────────────┐
│  Tauri 2.0 窗口管理                          │
│  ┌─────────────┐  ┌──────────────────────┐   │
│  │  悬浮面板    │  │  配置窗口             │   │
│  │  (Vue 3)    │  │  (Vue 3)             │   │
│  └──────┬──────┘  └──────────┬───────────┘   │
│         │                    │               │
│  ┌──────┴────────────────────┴───────────┐   │
│  │        Tauri IPC Bridge               │   │
│  └──────┬────────────────────┬───────────┘   │
│         │                    │               │
│  ┌──────┴──────┐  ┌─────────┴────────────┐   │
│  │ Rust Core   │  │  TS Service Layer    │   │
│  │ - 窗口管理   │  │  - HTTP 请求         │   │
│  │ - 系统托盘   │  │  - 数据解析          │   │
│  │ - 文件存储   │  │  - 定时刷新          │   │
│  │ - 面板吸附   │  │  - 供应商适配器      │   │
│  │ - OAuth回调  │  │  - Token 管理        │   │
│  │ - 系统通知   │  │  - 轮播控制          │   │
│  │ - 开机自启   │  │  - 限额提醒触发      │   │
│  └─────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────┘
```

## 2. 数据模型

### 2.1 核心类型

```typescript
// 供应商类型
type ProviderId = 'zhipu' | 'minimax' | 'volcengine'

// 供应商配置
interface ProviderConfig {
  id: ProviderId
  name: string           // 显示名称
  authType: 'apikey' | 'oauth'
  apiKey?: string         // authType=apikey 时使用
  token?: string          // oauth 回调获取的 token
  tokenExpireAt?: number  // token 过期时间戳
  enabled: boolean        // 是否启用
}

// 单个额度维度
interface UsageMetric {
  label: string           // 维度名称（如"5小时额度"、"周额度"）
  usedQuota: number       // 已用额度
  totalQuota: number      // 总额度
  percentage: number      // 已用百分比
  unit: string            // 单位（tokens 等）
  resetIn?: string        // 重置倒计时（如"2h30m"、"3d"、"22d"）
}

// 额度信息
interface UsageInfo {
  providerId: ProviderId
  timestamp: number       // 数据获取时间
  metrics: UsageMetric[]  // 各维度的额度数据
  extraInfo?: Record<string, string>  // 附加信息（如今日Token消耗）
  error?: string          // 获取失败时的错误信息
}

// 应用配置
interface AppConfig {
  refreshInterval: number // 刷新间隔（秒），默认 30
  carouselInterval: number // 轮播间隔（秒），默认 10
  panelBgColor: string    // 面板背景色，默认 #333333
  panelOpacity: number    // 面板透明度 0-1，默认 0.8
  panelEdge: 'top' | 'bottom' | 'left' | 'right'  // 吸附边
  panelLocked: boolean    // 面板锁定，默认 false
  clickThrough: boolean   // 点击穿透，默认 false
  threshold1: number      // 阈值1，默认 50
  threshold2: number      // 阈值2，默认 80
  thresholdColor1: string // 阈值1颜色，默认绿色
  thresholdColor2: string // 阈值2颜色，默认黄色
  thresholdColor3: string // 阈值3颜色，默认红色
  alertEnabled: boolean   // 限额提醒，默认 true
  alertThreshold: number  // 提醒阈值，默认 80
  autoStart: boolean      // 开机自启，默认 false
  providers: ProviderConfig[]
}
```

### 2.2 供应商适配器接口

```typescript
interface ProviderAdapter {
  id: ProviderId
  name: string

  // 获取额度信息
  fetchUsage(config: ProviderConfig): Promise<UsageInfo>

  // OAuth 登录流程（仅 oauth 类型需要）
  startOAuth?(callbackPort: number): Promise<string>  // 返回 token

  // 验证配置是否有效
  validateConfig(config: ProviderConfig): boolean
}
```

## 3. 供应商展示规格

### 3.1 智谱 CodingPlan

| 维度 | 说明 |
|------|------|
| 5小时额度 | 进度条 + 百分比 + 已用/总额 + 重置倒计时 |
| 周额度 | 进度条 + 百分比 + 已用/总额 + 重置倒计时 |
| MCP 月额度 | 进度条 + 百分比 + 已用/总额 + 重置倒计时 |
| 今日 Token 消耗 | 纯数值显示（如 200.23M） |

- 限额查询页面：https://bigmodel.cn/coding-plan/personal/usage
- 鉴权：API Key 或 OAuth

### 3.2 MiniMax TokenPlan

| 维度 | 说明 |
|------|------|
| 文本生成 5h 额度 | 进度条 + 百分比 + 已用/总额 + 重置倒计时（model_name: MiniMax-M*） |
| 文本生成 周额度 | 进度条 + 百分比 + 已用/总额 + 重置倒计时（model_name: MiniMax-M*） |
| 图像生成 5h 额度 | 进度条 + 百分比 + 已用/总额 + 重置倒计时（model_name: coding-plan-vlm） |
| 图像生成 周额度 | 进度条 + 百分比 + 已用/总额 + 重置倒计时（model_name: coding-plan-vlm） |

- 限额查询 API：`https://www.minimaxi.com/v1/token_plan/remains`
- 鉴权：API Key（Bearer Token）

### 3.3 火山 CodingPlan

| 维度 | 说明 |
|------|------|
| 5小时额度 | 进度条 + 百分比 + 已用/总额 + 重置倒计时 |
| 周额度 | 进度条 + 百分比 + 已用/总额 + 重置倒计时 |
| MCP 月额度 | 进度条 + 百分比 + 已用/总额 + 重置倒计时 |
| 今日 Token 消耗 | 纯数值显示（如 200.23M） |

- 限额查询页面：https://console.volcengine.com/ark/...
- 鉴权：OAuth（浏览器授权 + Cookie/Header）

## 4. UI 设计

### 4.1 悬浮面板

```
┌────────────────────────────────────┐
│ ◀  [供应商名称]                 ▶  │  ← 自动轮播 + 手动左右切换
│────────────────────────────────────│
│  维度名称                          │
│  ████████████░░░░ 78.5%            │  ← 进度条 + 百分比
│  39,250 / 50,000 tokens   ↻ 2h30m │  ← 已用/总额 + 重置倒计时
│────────────────────────────────────│
│  ... 更多维度 ...                  │
│────────────────────────────────────│
│  附加信息行（如今日Token消耗）       │
│────────────────────────────────────│
│  🔄 30秒前更新              ⚙ 🔒 □ │  ← 刷新时间 + 设置 + 锁定 + 最小化
└────────────────────────────────────┘
```

- 宽度：~340px
- 高度：按维度数量动态调整（240-280px）
- 无边框、始终置顶
- 进度条颜色：< 阈值1 绿色 / ≥ 阈值1 且 < 阈值2 黄色 / ≥ 阈值2 红色
- 拖拽移动（未锁定时）
- 四边吸附（上/下/左/右）
- 贴边时最小化按钮可用，收起后显示展开箭头
- 非交互区域可开启点击穿透

### 4.2 配置窗口

选项卡式布局：

**通用设置**：
- 刷新间隔（秒）
- 轮播间隔（秒）
- 面板背景色
- 面板透明度
- 吸附边选择
- 面板锁定开关
- 点击穿透开关
- 开机自启动

**额度显示设置**：
- 阈值1/阈值2 数值
- 三级阈值颜色自定义
- 限额提醒开关 + 提醒阈值

**供应商管理**：
- 各供应商启用/禁用
- API Key 输入（带掩码）
- OAuth 登录按钮
- 验证配置

### 4.3 系统托盘

- 双击：显示/隐藏悬浮面板
- 右键菜单：显示/隐藏面板 | 打开配置 | 退出
- 图标状态：正常 / 低额度(警告) / 错误

## 5. IPC 接口

### Rust → TS 可调用的命令

```typescript
// 配置
load_config(): AppConfig
save_config(config: AppConfig): void

// 窗口控制
set_panel_position(x: number, y: number): void
set_panel_always_on_top(flag: boolean): void
set_click_through(flag: boolean): void
minimize_panel(): void
expand_panel(): void

// 系统托盘
update_tray_icon(status: 'normal' | 'warning' | 'error'): void

// OAuth
start_oauth_server(): number    // 返回回调端口号
stop_oauth_server(): void

// 通知
send_notification(title: string, body: string): void

// 自启动
set_auto_start(flag: boolean): void
```

### 事件监听（TS 侧）

```typescript
on_tray_toggle_panel(): void
on_tray_open_config(): void
on_config_saved(): void  // 配置窗口保存后通知面板
```

## 6. 错误处理

| 场景 | 处理方式 |
|------|----------|
| 网络请求失败 | 显示最后成功数据 + 红色"连接失败"标记 |
| API 返回 403 | 标记"需重新授权" + 引导登录按钮 |
| Token 过期 | 自动触发 OAuth 重新授权 |
| 配置文件损坏 | 使用默认配置启动 + 警告日志 |
| API 响应格式变化 | 返回 error 字段 + 面板显示"数据解析失败" |

## 7. 限额通知

- 每次获取新数据时检查各维度百分比
- ≥ 提醒阈值时发送系统通知
- 同一维度同一周期内只通知一次（防重复）
- 通知格式：`"{供应商名} {维度名} 已达 {百分比}%，请留意用量"`

## 8. 启动流程

```
应用启动 → Rust 加载配置 → 创建悬浮面板 + 配置窗口(隐藏) + 系统托盘
         → Vue 初始化 → 启动定时刷新 → 立即获取一次所有启用供应商数据
         → 面板显示数据
```

## 9. 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Tauri 2.0 |
| 前端框架 | Vue 3 + TypeScript |
| 状态管理 | Pinia |
| 构建工具 | Vite |
| 后端 | Rust（系统级）+ TypeScript（业务级） |
| 配置持久化 | JSON 文件 |

## 10. 项目目录结构

```
coding-plan-monitor/
├── src-tauri/                  # Rust 后端
│   ├── src/
│   │   ├── main.rs             # 入口
│   │   ├── commands/           # IPC 命令处理
│   │   │   ├── config.rs       # 配置读写
│   │   │   ├── window.rs       # 窗口控制
│   │   │   ├── oauth.rs        # OAuth 回调服务器
│   │   │   ├── notification.rs # 系统通知
│   │   │   └── autostart.rs    # 开机自启
│   │   ├── tray.rs             # 系统托盘
│   │   └── snap.rs             # 面板吸附逻辑
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                        # Vue 3 前端
│   ├── App.vue
│   ├── main.ts
│   ├── views/
│   │   ├── Panel.vue           # 悬浮面板
│   │   └── Config.vue          # 配置窗口
│   ├── components/
│   │   ├── UsageBar.vue        # 额度进度条
│   │   ├── ProviderTabs.vue    # 供应商标签栏
│   │   └── ConfigForm.vue      # 配置表单
│   ├── providers/              # 供应商适配器
│   │   ├── types.ts            # 接口定义
│   │   ├── zhipu.ts            # 智谱适配器
│   │   ├── minimax.ts          # MiniMax 适配器
│   │   └── volcengine.ts       # 火山适配器
│   ├── services/
│   │   ├── refresh.ts          # 定时刷新
│   │   ├── carousel.ts         # 轮播控制
│   │   └── alert.ts            # 限额提醒
│   └── stores/
│       ├── config.ts           # Pinia 配置状态
│       └── usage.ts            # Pinia 额度状态
├── package.json
├── vite.config.ts
└── tsconfig.json
```
