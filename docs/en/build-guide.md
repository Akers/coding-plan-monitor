# Build Guide

This document describes how to set up the development environment, run tests, build the frontend, and package the Tauri desktop application.

## 1. Requirements

- Node.js 20+ (LTS recommended)
- npm 10+
- Rust stable toolchain
- Tauri 2.0 system prerequisites
- Windows: WebView2 Runtime

Follow the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for platform-specific dependencies.

## 2. Install Dependencies

Run from the project root:

```bash
npm install
```

Rust dependencies are resolved when running Tauri or Cargo commands.

## 3. Development Mode

Start the full desktop development app:

```bash
npm run tauri dev
```

Start the frontend Vite dev server only:

```bash
npm run dev
```

The Tauri config currently uses `http://localhost:1420` as `devUrl` in `src-tauri/tauri.conf.json`.

## 4. Tests

Run TypeScript/Vue tests:

```bash
npx vitest run
```

Run Rust tests:

```bash
cd src-tauri
cargo test
```

Current baseline on `master`:

- Vitest: 30 test files, 247 tests
- Cargo: 34 tests

## 5. Frontend Build

```bash
npm run build
```

This runs TypeScript checks and produces the frontend assets in `dist/`.

## 6. Desktop Packaging

```bash
npm run tauri build
```

Tauri runs the frontend build first, then generates platform-specific bundles. Outputs are usually located at:

```text
src-tauri/target/release/bundle/
```

## 7. Troubleshooting

### `vitest/config` or `@vitejs/plugin-vue` cannot be resolved

Frontend dependencies are missing or incomplete. Run:

```bash
npm install
```

### Tauri dev fails to start

Check:

1. Rust toolchain: `rustc --version`
2. Node dependencies: `npm install`
3. Tauri platform prerequisites
4. WebView2 Runtime on Windows

### Bundle icons are missing

Check that `src-tauri/icons/` contains all icon files declared in `tauri.conf.json`.
