## Why

开发者在使用多个 AI Coding Plan 供应商（智谱、MiniMax、火山）时，需要频繁切换浏览器标签页查看各供应商的额度使用情况，没有统一的桌面级监控工具来实时追踪额度消耗。需要一个跨平台桌面应用，以悬浮面板形式持续展示各供应商的额度信息，帮助开发者合理安排用量，避免额度耗尽导致工作中断。

## What Changes

- 新建 Tauri 2.0 桌面应用项目，包含悬浮面板、配置窗口和系统托盘三大 UI 组件
- 实现多供应商适配器模式，统一对接智谱 CodingPlan、MiniMax TokenPlan、火山 CodingPlan 的额度查询
- 实现定时自动刷新和供应商自动轮播机制
- 实现悬浮面板的四边吸附、拖拽移动、最小化/展开功能
- 实现配置持久化（JSON 文件），支持供应商管理、面板外观、额度阈值等配置
- 实现基于阈值的进度条颜色分级显示和限额系统通知提醒
- 实现 OAuth 浏览器授权流程（用于不支持 API Key 的供应商）
- 支持面板锁定和点击穿透模式

## Capabilities

### New Capabilities

- `panel`: 悬浮面板 UI 组件——无边框置顶窗口、供应商维度额度展示、进度条颜色分级、拖拽移动、四边吸附、最小化/展开、锁定/点击穿透
- `config-window`: 配置窗口 UI——选项卡式布局（通用设置/额度显示/供应商管理）、配置表单、实时预览
- `provider-adapter`: 供应商适配器框架——统一接口定义、智谱/MiniMax/火山三个适配器实现、API 调用与页面解析、数据模型转换
- `refresh-scheduler`: 数据刷新调度——定时自动刷新、自动轮播供应商、刷新失败容错、限额阈值检测与通知触发
- `system-integration`: 系统集成——系统托盘、系统通知、开机自启动、配置文件读写、OAuth 本地回调服务器
- `data-model`: 核心数据模型——供应商配置、额度信息、应用配置的类型定义与校验

### Modified Capabilities

（无，本项目为全新项目）

## Impact

- **新技术栈引入**：Tauri 2.0 + Vue 3 + TypeScript + Pinia + Vite
- **系统级依赖**：Windows 系统托盘 API、系统通知 API、文件系统访问、本地 HTTP 服务器（OAuth 回调）
- **外部 API 依赖**：
  - 智谱 CodingPlan 额度查询页面/API
  - MiniMax TokenPlan REST API（`/v1/token_plan/remains`）
  - 火山 CodingPlan 额度查询页面/API
- **配置文件**：`~/.config/coding-plan-monitor/config.json`
- **平台优先级**：Windows 11 优先，后续适配 macOS/Linux
