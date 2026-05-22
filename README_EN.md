# Coding Plan Monitor

> A Tauri 2.0 + Vue 3 desktop floating panel for monitoring quota usage across AI Coding Plan providers such as Zhipu, MiniMax, and Volcengine.

[中文](./README.md) · [Build Guide](./docs/en/build-guide.md) · [User Manual](./docs/en/user-manual.md) · [Configuration Guide](./docs/en/configuration-guide.md) · [Contributing Guide](./docs/en/contributing-guide.md)

## Overview

Coding Plan Monitor is a desktop quota monitoring tool in the ModelIDE ecosystem. It displays usage metrics, progress, error states, and quota alerts for multiple AI Coding Plan providers in a lightweight floating panel. It is designed for developers and teams that use more than one Coding Plan provider.

The application uses a hybrid Rust + TypeScript architecture. Rust handles desktop capabilities such as tray integration, window management, configuration files, OAuth callbacks, autostart, logging, and system notifications. TypeScript handles provider adapters, refresh scheduling, state management, and the Vue UI.

## Features

- **Multi-provider quota monitoring**: supports Zhipu, MiniMax, and Volcengine.
- **Unified adapter framework**: provider querying, validation, and error handling through `ProviderAdapter`.
- **Floating panel**: borderless, always-on-top, draggable, snap-to-edge, collapsible, transparent, and click-through capable.
- **Multi-metric display**: shows 5-hour quota, weekly quota, MCP monthly quota, token usage, and provider-specific metrics.
- **Auto refresh and carousel**: periodically refreshes usage data and rotates enabled providers.
- **Quota alerts**: sends system notifications and updates tray state when usage reaches configured thresholds.
- **Configuration window**: includes general settings, quota display settings, and provider management.
- **OAuth callback flow**: receives OAuth callbacks through a temporary local HTTP server.
- **System integration**: supports tray menu, autostart, file logging, and persistent configuration.

## Tech Stack

- Desktop framework: Tauri 2.0
- Frontend: Vue 3, TypeScript, Vue Router, Pinia, Vite
- Backend: Rust, Tauri plugins
- Testing: Vitest, Vue Test Utils, Cargo Test

## Installation

### Prerequisites

- Node.js 20+ (LTS recommended)
- Rust stable toolchain
- Tauri 2.0 system prerequisites
- WebView2 Runtime on Windows

### Install Dependencies

```bash
npm install
```

For platform-specific dependencies, see the [Tauri prerequisites](https://tauri.app/start/prerequisites/).

## Quick Start

Start the desktop development app:

```bash
npm run tauri dev
```

Start the frontend dev server only:

```bash
npm run dev
```

Run tests:

```bash
npx vitest run
cd src-tauri && cargo test
```

Build the desktop app:

```bash
npm run tauri build
```

## Documentation

| Document | Description |
|---|---|
| [Build Guide](./docs/en/build-guide.md) | Development setup, testing, build, and packaging |
| [User Manual](./docs/en/user-manual.md) | Floating panel, tray, configuration window, and common operations |
| [Configuration Guide](./docs/en/configuration-guide.md) | Configuration fields, provider credentials, thresholds, and config file location |
| [Contributing Guide](./docs/en/contributing-guide.md) | Development workflow, tests, commit style, and OpenSpec constraints |

## Current Status

- Version: `0.1.0`
- Default window: floating panel `panel`
- Config file: `~/.config/coding-plan-monitor/config.json`
- OpenSpec specs: `openspec/specs/`
- Archived change: `openspec/changes/archive/2026-05-22-coding-plan-monitor-v1/`

## License

This project is open sourced under the [MIT License](./LICENSE).
