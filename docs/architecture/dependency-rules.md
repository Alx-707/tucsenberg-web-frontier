# 架构一致性检查配置

## 概述

本项目使用 `dependency-cruiser` 和 `madge` 工具来确保代码架构的一致性和质量。

## 配置的规则

### 1. 禁止循环依赖 (no-circular)

- **严重级别**: Error
- **描述**: 防止模块间相互引用导致的架构问题
- **检测**: 任何形式的循环依赖都会被标记为错误

### 2. 孤立文件检测 (no-orphans)

- **严重级别**: Warning
- **描述**: 识别未被引用的代码文件
- **排除**: 测试文件、类型定义文件、故事文件

### 3. 特性间依赖隔离 (feature-isolation)

- **严重级别**: Error
- **描述**: 确保功能模块间的清晰边界
- **规则**: `src/features/` 下的不同特性不能相互引用
- **例外**: 可以引用
  `src/shared/`、`src/lib/`、`src/components/`、`src/utils/`、`src/types/`、`src/hooks/`

### 4. 禁止外部访问内部模块 (no-external-to-internal)

- **严重级别**: Error
- **描述**: 禁止外部依赖直接访问内部模块
- **规则**: 非 `src/` 目录的文件不能访问 `src/lib/internal`

### 5. 禁止生产代码导入测试文件 (no-test-imports-in-production)

- **严重级别**: Error
- **描述**: 防止测试代码泄露到生产环境

### 6. 禁止生产代码导入开发依赖 (no-dev-dependencies-in-production)

- **严重级别**: Error
- **描述**: 确保生产代码不依赖开发时依赖

## 可用命令

### 基础检查

```bash
# 运行架构一致性检查
pnpm arch:check

# 检查循环依赖
pnpm circular:check

# 组合架构验证
pnpm arch:validate
```

### 可视化分析

```bash
# 生成架构依赖图 (DOT格式)
pnpm arch:graph

# 生成循环依赖报告 (JSON格式)
pnpm circular:report
```

### 集成到质量检查

```bash
# 完整质量检查 (包含架构验证)
pnpm quality:full
```

## 架构最佳实践

### 目录结构建议

```
src/
├── app/           # Next.js App Router
├── components/    # 可复用组件
├── features/      # 功能模块 (相互隔离)
├── shared/        # 共享工具和配置
├── lib/           # 工具库
├── types/         # TypeScript 类型
└── hooks/         # 自定义 Hooks
```

### 特性模块设计

- 每个特性应该是自包含的
- 特性间通过共享模块通信
- 避免直接的特性间依赖

### 依赖管理

- 优先使用共享模块
- 保持依赖关系单向
- 定期检查和清理未使用的代码

## 故障排除

### 常见问题

1. **特性隔离违规**

   - 检查是否有特性直接引用其他特性
   - 将共同依赖移至 `src/shared/`

2. **循环依赖**

   - 使用 `pnpm circular:check` 定位问题
   - 重构代码结构，打破循环

3. **孤立文件警告**
   - 检查文件是否真的未被使用
   - 删除无用文件或添加引用

## 配置文件

主要配置文件位于 `.dependency-cruiser.js`，包含所有架构规则的详细定义。
