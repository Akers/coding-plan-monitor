# Coding Plan Monitor

> 一个基于 Tauri 2.0 + Vue 3 的桌面悬浮面板，用于集中监控智谱、MiniMax、火山等 AI Coding Plan 供应商的额度使用情况。

[English](./README_EN.md) · [构建指南](./docs/build-guide.md) · [使用手册](./docs/user-manual.md) · [配置指南](./docs/configuration-guide.md) · [贡献指南](./docs/contributing-guide.md)

## 项目简介

Coding Plan Monitor 是 ModelIDE 模型训练平台生态中的桌面端额度监控工具。它以轻量悬浮面板的形式展示多个 AI Coding Plan 供应商的额度维度、使用百分比、错误状态和限额提醒，适合需要同时使用多家 Coding Plan 服务的开发者与团队。

项目采用 Rust + TypeScript 混合架构：Rust 负责系统托盘、窗口管理、配置文件、OAuth 回调、自启动、日志与系统通知等桌面能力；TypeScript 负责供应商适配器、刷新调度、状态管理与 Vue UI。

## 核心功能

- **多供应商额度监控**：支持智谱、MiniMax、火山三个供应商。
- **统一适配器框架**：通过 `ProviderAdapter` 接口统一额度查询、配置校验与错误处理。
- **悬浮面板**：无边框、置顶、透明度可调，支持拖拽、四边吸附、最小化与点击穿透。
- **多维度额度展示**：按供应商展示 5 小时额度、周额度、MCP 月额度、Token 消耗等维度。
- **自动刷新与轮播**：按配置间隔刷新额度，并在启用多个供应商时自动轮播。
- **限额提醒**：额度达到阈值时发送系统通知，并同步更新托盘状态。
- **配置窗口**：提供通用设置、额度显示和供应商管理三个配置页。
- **OAuth 回调**：通过本地临时 HTTP 服务接收 OAuth 授权回调。
- **系统集成**：支持系统托盘、开机自启动、文件日志和配置持久化。

## 技术栈

- 桌面框架：Tauri 2.0
- 前端：Vue 3、TypeScript、Vue Router、Pinia、Vite
- 后端：Rust、Tauri plugins
- 测试：Vitest、Vue Test Utils、Cargo Test

## 安装指南

### 环境要求

- Node.js 20+（建议使用 LTS）
- Rust stable toolchain
- Tauri 2.0 所需系统依赖
- Windows 环境需安装 WebView2 Runtime

### 安装依赖

```bash
npm install
```

如需了解各平台依赖，请参考 [Tauri 官方前置条件文档](https://tauri.app/start/prerequisites/)。

## 快速开始

启动桌面开发环境：

```bash
npm run tauri dev
```

仅启动前端开发服务器：

```bash
npm run dev
```

运行测试：

```bash
npx vitest run
cd src-tauri && cargo test
```

打包桌面应用：

```bash
npm run tauri build
```

## 文档索引

| 文档 | 说明 |
|---|---|
| [构建指南](./docs/build-guide.md) | 开发环境、测试、构建和打包说明 |
| [使用手册](./docs/user-manual.md) | 悬浮面板、托盘、配置窗口和常见操作 |
| [配置指南](./docs/configuration-guide.md) | 配置项、供应商鉴权、阈值和配置文件说明 |
| [贡献指南](./docs/contributing-guide.md) | 开发流程、测试要求、提交规范和 OpenSpec 约束 |

## 当前状态

- 版本：`0.1.0`
- 默认主窗口：悬浮面板 `panel`
- 配置文件：`~/.config/coding-plan-monitor/config.json`
- OpenSpec 规格：见 `openspec/specs/`
- 归档变更：见 `openspec/changes/archive/2026-05-22-coding-plan-monitor-v1/`

## 许可证

本项目基于 [MIT License](./LICENSE) 开源。
