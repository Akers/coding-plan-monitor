# Contributing Guide

Thank you for contributing to Coding Plan Monitor. This document describes the development workflow, testing requirements, coding style, and commit conventions.

## 1. Development Principles

- **Spec first**: new features or behavior changes should be described with OpenSpec before implementation.
- **Test driven**: add failing tests before implementing features or bug fixes.
- **Minimal impact**: change only what is required for the current task.
- **Cross-side consistency**: keep TypeScript and Rust data models compatible when changing configuration or IPC models.
- **Security first**: never commit secrets, tokens, real config files, or local environment artifacts.

## 2. Branches and Worktrees

Use git worktrees for isolated development:

```bash
git worktree add .worktrees/<feature-name> -b feature/<feature-name>
```

`.worktrees/` is ignored by Git and should not be committed.

## 3. Code Layout

```text
src/                  Vue + TypeScript frontend
  components/         UI components
  providers/          Provider adapters
  services/           Business services and Tauri API wrappers
  stores/             Pinia stores
  types/              Shared TypeScript types
  views/              Page views
src-tauri/            Rust/Tauri desktop side
  src/commands/       IPC commands
  src/models.rs       Rust data models
openspec/specs/       Main specs
openspec/changes/     Active or archived changes
```

## 4. Testing Requirements

Before submitting changes, run:

```bash
npx vitest run
cd src-tauri && cargo test
```

Changes to UI, stores, services, providers, or Rust IPC should include corresponding tests. End-to-end behavior should be covered under `src/__tests__/integration/` when appropriate.

## 5. Coding Style

- TypeScript uses `strict`; avoid adding `any`.
- Vue components use `<script setup lang="ts">`.
- Rust IPC commands return `Result<T, String>` and should avoid context-free `unwrap()`.
- Provider integrations should implement the unified `ProviderAdapter` interface.
- Configuration fields must remain compatible between TypeScript camelCase and Rust serde camelCase.

## 6. Commit Messages

Use conventional commits where possible:

```text
feat: add provider adapter
fix: handle oauth callback error
test: add refresh scheduler integration tests
docs: update configuration guide
chore: ignore local worktrees
```

## 7. OpenSpec Workflow

Recommended flow for new capabilities:

1. Create an OpenSpec change.
2. Fill in proposal, design, specs, and tasks.
3. Split work into 2-5 minute tasks.
4. Implement with TDD.
5. Run OpenSpec verification and code review.
6. Sync main specs and archive the change.

Main specs live in `openspec/specs/`; archived changes live in `openspec/changes/archive/`.

## 8. Pre-submit Checklist

- [ ] No API keys, OAuth tokens, or real config files are committed
- [ ] `npx vitest run` passes
- [ ] `cargo test` passes
- [ ] New behavior is covered by tests
- [ ] README or docs are updated if needed
- [ ] OpenSpec task status is updated
