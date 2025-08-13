# 测试最佳实践指南

本文档记录了Tucsenberg Web Frontier项目中的测试最佳实践，特别是React Server Components的测试方法。

## 🎯 测试覆盖率目标

- **总体目标**: 60%+ 行覆盖率
- **函数覆盖率**: 80%+ 
- **分支覆盖率**: 85%+
- **关键组件**: 90%+ 覆盖率

## 🛠️ 技术栈

- **测试框架**: Vitest 3.2.4
- **测试库**: @testing-library/react 16.3.0
- **Mock工具**: vi.hoisted 模式
- **覆盖率**: @vitest/coverage-v8

## 📋 Mock配置标准

### vi.hoisted 模式

所有Mock必须使用`vi.hoisted`确保在模块导入前设置：

```typescript
// ✅ 正确的Mock配置
const {
  mockUseTranslations,
  mockUseIntersectionObserver,
} = vi.hoisted(() => ({
  mockUseTranslations: vi.fn(),
  mockUseIntersectionObserver: vi.fn(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: mockUseTranslations,
}));
```

### 常用Mock模板

#### 1. next-intl Mock
```typescript
vi.mock('next-intl', () => ({
  useTranslations: mockUseTranslations,
}));

vi.mock('next-intl/server', () => ({
  getTranslations: mockGetTranslations,
}));
```

#### 2. UI组件Mock
```typescript
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, className, onClick, ...props }: any) => (
    <button data-testid="button" className={className} onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));
```

#### 3. Hooks Mock
```typescript
vi.mock('@/hooks/use-intersection-observer', () => ({
  useIntersectionObserver: mockUseIntersectionObserver,
}));
```

## 🧪 React Server Components 测试

### 基本模式

```typescript
// 异步服务器组件测试
describe('ServerComponent', () => {
  it('应该正确渲染', async () => {
    const Component = await ServerComponent({ 
      params: Promise.resolve({ locale: 'en' }) 
    });
    
    render(Component);
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### 元数据生成测试

```typescript
describe('generateMetadata', () => {
  it('应该生成正确的元数据', async () => {
    const metadata = await generateMetadata({ 
      params: Promise.resolve({ locale: 'en' }) 
    });
    
    expect(metadata).toEqual({
      title: 'Expected Title',
      description: 'Expected Description',
    });
  });
});
```

## 📝 测试用例分类

### 1. 基础渲染测试
- 组件正确渲染
- 必要元素存在
- 基本结构正确

### 2. 交互功能测试
- 用户交互响应
- 状态变化处理
- 事件处理器调用

### 3. 国际化测试
- 翻译键正确使用
- 多语言支持
- 缺失翻译处理

### 4. 错误处理测试
- 异常情况处理
- 错误边界测试
- 降级方案验证

### 5. 可访问性测试
- 语义结构正确
- ARIA属性设置
- 键盘导航支持

### 6. 性能测试
- 组件渲染性能
- 内存泄漏检查
- 优化效果验证

## 🎨 测试文件组织

### 目录结构
```
src/
├── components/
│   ├── home/
│   │   ├── __tests__/
│   │   │   ├── hero-section.test.tsx
│   │   │   ├── project-overview.test.tsx
│   │   │   └── tech-stack-section.test.tsx
│   │   ├── hero-section.tsx
│   │   └── ...
│   └── ...
├── app/
│   └── [locale]/
│       └── contact/
│           ├── __tests__/
│           │   └── page.test.tsx
│           └── page.tsx
```

### 命名约定
- 测试文件: `*.test.tsx`
- 测试目录: `__tests__/`
- Mock文件: `*.mock.ts`

## 🔍 覆盖率分析

### 查看覆盖率报告
```bash
pnpm test:coverage
pnpm test:coverage:report  # 打开HTML报告
```

### 覆盖率验证脚本
```bash
node scripts/verify-coverage-improvement.js
```

### 关键指标监控
- 行覆盖率 (Lines)
- 函数覆盖率 (Functions) 
- 分支覆盖率 (Branches)
- 语句覆盖率 (Statements)

## 🚀 持续改进

### 覆盖率提升策略

1. **快速胜利**: 高覆盖率文件优化至100%
2. **稳步推进**: 中等覆盖率文件提升至90%+
3. **核心突破**: 零覆盖率文件建立基础测试

### 质量保障

1. **CI/CD集成**: 覆盖率门禁检查
2. **定期审查**: 测试质量定期评估
3. **团队培训**: 测试最佳实践分享

## 📚 参考资源

- [Vitest 官方文档](https://vitest.dev/)
- [Testing Library 指南](https://testing-library.com/)
- [React Server Components 测试](https://nextjs.org/docs/app/building-your-application/testing)
- [项目测试配置](../vitest.config.ts)

## 🎯 成功案例

### 已完成的高质量测试

1. **hero-section.tsx**: 100% 覆盖率，17个测试用例
2. **project-overview.tsx**: 100% 覆盖率，12个测试用例
3. **enhanced-locale-switcher.tsx**: 100% 覆盖率
4. **contact-form.tsx**: 98.63% 覆盖率

这些组件的测试可以作为新测试的参考模板。
