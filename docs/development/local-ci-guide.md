# 本地 CI 完整指南

> **目标**：在本地运行与远程 GitHub Actions 100% 一致的质量检查，避免浪费 CI 分钟数

**更新时间**: 2025-10-28

---

## 📋 目录

1. [环境配置](#环境配置)
2. [快速开始](#快速开始)
3. [详细使用](#详细使用)
4. [常见问题](#常见问题)
5. [最佳实践](#最佳实践)

---

## 🔧 环境配置

### 1. Node.js 版本对齐

**要求**: Node.js 20.x（与 CI 保持一致）

#### 检查当前版本

```bash
node --version
# 应该显示: v20.x.x
```

#### 如果版本不对，使用 nvm 切换

```bash
# 安装 nvm（如果还没安装）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重启终端后，安装 Node.js 20
nvm install 20

# 切换到 Node.js 20
nvm use 20

# 设置为默认版本
nvm alias default 20

# 验证
node --version  # 应该显示 v20.x.x
```

#### 自动切换版本（推荐）

项目已包含 `.nvmrc` 文件，每次进入项目目录时自动切换：

```bash
# 在 ~/.zshrc 或 ~/.bashrc 中添加
autoload -U add-zsh-hook
load-nvmrc() {
  if [[ -f .nvmrc && -r .nvmrc ]]; then
    nvm use
  fi
}
add-zsh-hook chpwd load-nvmrc
load-nvmrc
```

### 2. pnpm 版本对齐

**要求**: pnpm 10.13.1（与 CI 保持一致）

```bash
# 检查当前版本
pnpm --version

# 如果版本不对，安装指定版本
npm install -g pnpm@10.13.1

# 验证
pnpm --version  # 应该显示: 10.13.1
```

### 3. 依赖安装

```bash
# 使用 frozen-lockfile 确保版本一致（与 CI 相同）
pnpm install --frozen-lockfile
```

---

## 🚀 快速开始

### 方式 1: 使用本地 CI 脚本（推荐）

```bash
# 运行完整检查（与远程 CI 100% 一致）
pnpm ci:local

# 快速检查（跳过 E2E 和性能测试）
pnpm ci:local:quick

# 自动修复可修复的问题
pnpm ci:local:fix
```

### 方式 2: 使用 Git Hooks（自动检查）

项目已配置 `lefthook`，会在以下时机自动运行检查：

```bash
# pre-commit: 提交前检查
git commit -m "feat: new feature"
# 自动运行: format-check, type-check, quality-check, etc.

# pre-push: 推送前检查
git push
# 自动运行: build-check, test:coverage, quality-gate, etc.
```

### 方式 3: 使用 act（完全模拟 GitHub Actions）

```bash
# 安装 act
brew install act

# 运行完整 CI 工作流
act push

# 运行特定任务
act -j basic-checks
```

---

## 📖 详细使用

### 本地 CI 脚本功能

#### 完整模式（默认）

```bash
pnpm ci:local
```

**检查项目**：
1. ✅ Node.js 版本检查（v20.x）
2. ✅ pnpm 版本检查（10.13.1）
3. ✅ TypeScript 类型检查
4. ✅ 测试文件类型检查
5. ✅ 代码格式检查（Prettier）
6. ✅ 代码质量检查（ESLint）
7. ✅ 构建检查（Next.js Build）
8. ✅ 单元测试（覆盖率模式）
9. ✅ E2E 测试（Playwright）
10. ✅ 性能检查（包大小）
11. ✅ 安全检查（依赖审计）
12. ✅ 翻译质量检查
13. ✅ 架构检查（依赖关系 + 循环依赖）

**预计耗时**: 5-10 分钟

#### 快速模式

```bash
pnpm ci:local:quick
```

**跳过项目**：
- ⏭️ E2E 测试（耗时较长）
- ⏭️ 性能检查（需要 headless Chrome）

**预计耗时**: 2-3 分钟

#### 自动修复模式

```bash
pnpm ci:local:fix
```

**自动修复**：
- 🔧 代码格式问题（Prettier）
- 🔧 部分代码质量问题（ESLint --fix）

**使用流程**：
```bash
# 1. 运行检查
pnpm ci:local

# 2. 如果失败，尝试自动修复
pnpm ci:local:fix

# 3. 重新检查
pnpm ci:local
```

---

## 🔍 单独运行检查

如果只想运行特定检查：

```bash
# 格式检查
pnpm format:check

# 代码质量检查
pnpm lint:check

# 类型检查
pnpm type-check

# 构建检查
pnpm build:check

# 单元测试
pnpm test:coverage

# E2E 测试
pnpm test:e2e

# 性能检查
pnpm size:check

# 安全检查
pnpm security:audit

# 翻译检查
pnpm validate:translations

# 架构检查
pnpm arch:check && pnpm circular:check
```

---

## ❓ 常见问题

### Q1: 本地检查通过，但远程 CI 失败？

**可能原因**：
1. Node.js 版本不一致
2. pnpm 版本不一致
3. 依赖版本不一致（pnpm-lock.yaml 未同步）
4. 环境变量差异（通常不影响质量检查）

**解决方案**：
```bash
# 1. 检查版本
node --version  # 应该是 v20.x.x
pnpm --version  # 应该是 10.13.1

# 2. 重新安装依赖
rm -rf node_modules
pnpm install --frozen-lockfile

# 3. 重新运行检查
pnpm ci:local
```

### Q2: E2E 测试在本地失败？

**可能原因**：
- Playwright 浏览器未安装
- 端口被占用

**解决方案**：
```bash
# 安装 Playwright 浏览器
pnpm exec playwright install

# 检查端口占用
lsof -i :3000

# 使用 CI 模式运行
CI=1 pnpm test:e2e
```

### Q3: 性能检查失败？

**可能原因**：
- 包大小超出限制
- Chrome 未安装

**解决方案**：
```bash
# 查看包大小详情
pnpm size:check

# 分析包大小
pnpm build && pnpm analyze
```

### Q4: Git Hooks 不工作？

**解决方案**：
```bash
# 重新安装 hooks
pnpm hooks:install

# 验证安装
lefthook version

# 手动运行 pre-commit 检查
lefthook run pre-commit
```

---

## 💡 最佳实践

### 1. 提交前工作流

```bash
# 1. 写代码
# ...

# 2. 运行快速检查
pnpm ci:local:quick

# 3. 如果失败，自动修复
pnpm ci:local:fix

# 4. 重新检查
pnpm ci:local:quick

# 5. 提交代码（会自动运行 pre-commit hooks）
git add .
git commit -m "feat: new feature"

# 6. 推送前运行完整检查（可选）
pnpm ci:local

# 7. 推送（会自动运行 pre-push hooks）
git push
```

### 2. 每日开发流程

```bash
# 早上开始工作
cd tucsenberg-web-frontier
nvm use  # 自动切换到 Node.js 20

# 更新依赖（如果有变更）
git pull
pnpm install --frozen-lockfile

# 开发...
pnpm dev

# 提交前检查
pnpm ci:local:quick

# 提交
git commit -m "..."
git push
```

### 3. 节省 CI 分钟数策略

```bash
# ✅ 推荐：本地先检查，通过后再推送
pnpm ci:local && git push

# ❌ 不推荐：直接推送，依赖远程 CI
git push  # 如果失败，浪费 CI 分钟数
```

**节省效果**：
- 本地检查：免费 + 快速（2-10 分钟）
- 远程 CI：消耗配额 + 较慢（5-15 分钟）
- **节省**: 50-80% 的 CI 分钟数

### 4. 使用 act 进行深度测试

```bash
# 完全模拟 GitHub Actions 环境
act push

# 只运行基础检查
act -j basic-checks

# 使用特定镜像（更快）
act -P ubuntu-latest=catthehacker/ubuntu:act-latest
```

---

## 📊 检查对比表

| 检查项 | 本地脚本 | Git Hooks | act | 远程 CI |
|--------|---------|-----------|-----|---------|
| **速度** | ⚡⚡⚡ | ⚡⚡⚡ | ⚡⚡ | ⚡ |
| **准确性** | 99% | 99% | 99.9% | 100% |
| **成本** | 免费 | 免费 | 免费 | 可能收费 |
| **环境** | 本地 | 本地 | Docker | GitHub |
| **自动化** | 手动 | 自动 | 手动 | 自动 |

---

## 🎯 总结

**核心原则**：
1. ✅ 本地环境与 CI 环境保持一致（Node.js 20 + pnpm 10.13.1）
2. ✅ 提交前运行本地检查，避免浪费 CI 分钟数
3. ✅ 使用 Git Hooks 自动化检查流程
4. ✅ 远程 CI 作为最终验证，而非主要检查手段

**效果**：
- 💰 节省 50-80% 的 CI 分钟数
- ⏱️ 更快的反馈速度（秒级 vs 分钟级）
- ✅ 更高的代码质量（提交前就发现问题）
- 🚀 更高的开发效率

---

## 📚 相关文档

- [GitHub Actions 工作流配置](.github/workflows/ci.yml)
- [Git Hooks 配置](lefthook.yml)
- [质量门禁配置](scripts/quality-gate.js)
- [项目规范](../../shrimp-rules.md)

---

**最后更新**: 2025-10-28  
**维护者**: Shawn Jones

