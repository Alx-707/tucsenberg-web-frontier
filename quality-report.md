# 项目质量报告

**生成时间**: 2025-08-11T10:17:18.443Z
**项目**: tucsenberg-web-frontier

## 📊 总体评分

**总分**: 45/100
**检查项**: 10 (通过: 4, 失败: 6)

## 📋 分类评分

❌ **codeQuality**: 25/100
❌ **security**: 0/100
✅ **performance**: 100/100
✅ **architecture**: 100/100
❌ **testing**: 0/100

## 🔍 详细检查结果

### codeQuality

✅ TypeScript严格类型检查
❌ ESLint代码质量检查
   错误: Command failed: pnpm lint:strict
❌ Prettier代码格式检查
   错误: Command failed: pnpm format:check
❌ 代码重复度检查
   错误: Command failed: pnpm duplication:check

### security

❌ 安全漏洞扫描
   错误: Command failed: pnpm security:check
❌ 依赖安全审计
   错误: Command failed: pnpm audit --audit-level moderate

### performance

✅ 包大小检查
✅ 性能审计

### architecture

✅ 架构一致性验证

### testing

❌ 单元测试执行
   错误: spawnSync /bin/sh ETIMEDOUT

## 💡 改进建议

- 建议改进代码质量：修复ESLint警告，优化TypeScript类型定义
- 建议加强安全措施：更新依赖包，修复安全漏洞
- 建议增加测试覆盖率：编写更多单元测试和集成测试
