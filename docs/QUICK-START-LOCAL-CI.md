# 🚀 本地 CI 快速开始

> 3 分钟配置，立即开始使用本地 CI，避免 GitHub Actions 配额限制

---

## ⚡ 快速配置（3 步）

### 1️⃣ 切换 Node.js 版本

```bash
nvm use 20
```

### 2️⃣ 验证环境

```bash
node --version  # 应该显示 v20.x.x
pnpm --version  # 应该显示 10.13.1
```

### 3️⃣ 运行检查

```bash
pnpm ci:local:quick
```

---

## 📝 常用命令

```bash
# 快速检查（2-3 分钟）
pnpm ci:local:quick

# 完整检查（5-10 分钟）
pnpm ci:local

# 自动修复
pnpm ci:local:fix

# 单独检查
pnpm format:check    # 格式
pnpm lint:check      # 质量
pnpm type-check      # 类型
pnpm build:check     # 构建
pnpm test:coverage   # 测试
```

---

## 🔄 日常工作流

```bash
# 1. 写代码
# ...

# 2. 快速检查
pnpm ci:local:quick

# 3. 如果失败，自动修复
pnpm ci:local:fix

# 4. 重新检查
pnpm ci:local:quick

# 5. 提交
git commit -m "feat: ..."

# 6. 推送
git push
```

---

## ❌ 常见错误

### 错误 1: Node.js 版本不对

```bash
❌ Node.js 版本过高: v24 (CI 使用 v20)

# 解决
nvm use 20
```

### 错误 2: 格式检查失败

```bash
❌ 代码格式检查失败

# 解决
pnpm format:write
```

### 错误 3: ESLint 错误

```bash
❌ 代码质量检查失败

# 解决
pnpm lint:fix
```

---

## 💡 提示

- ✅ 提交前运行 `pnpm ci:local:quick`
- ✅ 使用 `nvm use` 自动切换版本
- ✅ Git Hooks 会自动检查
- ✅ 节省 50-80% 的 CI 分钟数

---

## 📚 详细文档

- [完整指南](development/local-ci-guide.md)
- [配置总结](CI-LOCAL-SETUP-SUMMARY.md)

---

**更新**: 2025-10-28

