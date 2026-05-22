# 贡献指南

感谢你参与 Coding Plan Monitor 开发。本文档说明项目开发流程、测试要求、代码风格和提交建议。

## 1. 开发原则

- **规范先行**：新增功能或行为变更应先通过 OpenSpec 描述需求、设计与任务。
- **测试驱动**：新增功能和修复缺陷应先补测试，再实现最小可行代码。
- **最小影响**：只修改完成当前需求所必需的代码，避免无关重构。
- **跨端一致**：涉及配置或数据模型时，需要确保 TypeScript 与 Rust 结构兼容。
- **安全优先**：不要提交密钥、token、真实配置文件或本地环境产物。

## 2. 分支与工作区

推荐使用 git worktree 隔离开发：

```bash
git worktree add .worktrees/<feature-name> -b feature/<feature-name>
```

`.worktrees/` 已加入 `.gitignore`，不要提交 worktree 目录。

## 3. 代码结构

```text
src/                  Vue + TypeScript 前端
  components/         UI 组件
  providers/          供应商适配器
  services/           业务服务与 Tauri API 封装
  stores/             Pinia store
  types/              共享 TS 类型
  views/              页面视图
src-tauri/            Rust/Tauri 桌面端
  src/commands/       IPC 命令
  src/models.rs       Rust 数据模型
openspec/specs/       主规格
openspec/changes/     活跃或归档变更
```

## 4. 测试要求

提交前至少运行：

```bash
npx vitest run
cd src-tauri && cargo test
```

涉及 UI、store、service、provider 或 Rust IPC 的变更，应补充对应测试。涉及端到端行为时，应补充 `src/__tests__/integration/` 下的集成测试。

## 5. 代码风格

- TypeScript 使用 `strict` 类型检查，避免新增 `any`。
- Vue 组件使用 `<script setup lang="ts">`。
- Rust IPC 命令返回 `Result<T, String>`，避免无上下文 `unwrap()`。
- 供应商接入应实现统一 `ProviderAdapter` 接口。
- 配置字段需保持 TS camelCase 与 Rust serde camelCase 兼容。

## 6. 提交信息

建议使用约定式提交：

```text
feat: add provider adapter
fix: handle oauth callback error
test: add refresh scheduler integration tests
docs: update configuration guide
chore: ignore local worktrees
```

## 7. OpenSpec 流程

新增能力建议遵循：

1. 创建 OpenSpec 变更。
2. 补充 proposal、design、specs、tasks。
3. 拆分 2-5 分钟粒度任务。
4. 按 TDD 实施。
5. 运行 OpenSpec 验收和代码评审。
6. 同步主规格并归档变更。

主规格位于 `openspec/specs/`，归档变更位于 `openspec/changes/archive/`。

## 8. 提交前检查清单

- [ ] 没有提交 API Key、OAuth Token 或真实配置文件
- [ ] `npx vitest run` 通过
- [ ] `cargo test` 通过
- [ ] 新增行为有测试覆盖
- [ ] README 或 docs 已按需更新
- [ ] OpenSpec 任务状态已更新
