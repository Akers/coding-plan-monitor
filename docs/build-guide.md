# 构建指南

本文档说明 Coding Plan Monitor 的开发环境准备、测试、前端构建与 Tauri 桌面应用打包流程。

## 1. 环境要求

- Node.js 20+（建议 LTS）
- npm 10+
- Rust stable toolchain
- Tauri 2.0 系统依赖
- Windows：WebView2 Runtime

请先按照 [Tauri 官方前置条件](https://tauri.app/start/prerequisites/) 安装对应平台依赖。

## 2. 安装依赖

在项目根目录执行：

```bash
npm install
```

Rust 依赖会在执行 Tauri 命令或 `cargo` 命令时自动解析。

## 3. 开发模式

启动完整桌面开发环境：

```bash
npm run tauri dev
```

仅启动前端 Vite 开发服务器：

```bash
npm run dev
```

前端开发服务器默认由 Tauri 配置读取，当前 `src-tauri/tauri.conf.json` 中的 `devUrl` 为 `http://localhost:1420`。

## 4. 测试

运行 TypeScript/Vue 测试：

```bash
npx vitest run
```

运行 Rust 测试：

```bash
cd src-tauri
cargo test
```

当前主分支验证基线：

- Vitest：30 个测试文件，247 个测试
- Cargo：34 个测试

## 5. 前端构建

```bash
npm run build
```

该命令会执行 TypeScript 类型检查并生成 Vite 前端产物到 `dist/`。

## 6. 桌面应用打包

```bash
npm run tauri build
```

Tauri 会先执行 `npm run build`，再根据当前平台生成安装包或可执行文件。产物通常位于：

```text
src-tauri/target/release/bundle/
```

## 7. 常见问题

### 找不到 `vitest/config` 或 `@vitejs/plugin-vue`

说明前端依赖未安装或 `node_modules/` 不完整。执行：

```bash
npm install
```

### Tauri dev 启动失败

请检查：

1. Rust toolchain 是否可用：`rustc --version`
2. Node 依赖是否安装：`npm install`
3. 系统是否满足 Tauri 前置条件
4. Windows 是否安装 WebView2 Runtime

### 构建包图标缺失

请检查 `src-tauri/icons/` 下是否存在 `tauri.conf.json` 中声明的图标文件。
