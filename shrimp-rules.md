# AI Agent 开发指南

## 项目概述

**项目类型**: Next.js 15 + React 19 + TypeScript 企业级B2B网站模板
**核心特性**: 英中双语国际化、主题切换、MDX内容管理、企业级质量保障 **技术栈**:
Next.js 15.4.6 + React 19.1.1 + TypeScript 5.9.2 + Tailwind CSS 4.1.11

## 强制架构约束

### 技术栈限制

- **必须使用**: Next.js 15 App Router架构，禁止使用Pages Router
- **必须使用**: TypeScript严格模式，禁止any类型
- **必须使用**: Tailwind CSS进行样式开发，禁止内联样式
- **必须使用**: shadcn/ui组件库，禁止引入其他UI库
- **必须使用**: next-intl进行国际化，禁止其他i18n方案

### 目录结构规则

- **src/app/[locale]/** - 国际化路由，必须支持en和zh
- **src/components/** - 组件分层：ui/、theme/、i18n/
- **content/** - MDX内容，必须按语言分目录
- **messages/** - 国际化文件，必须同步更新
- **禁止修改**: next.config.ts、tsconfig.json、eslint.config.mjs核心配置

## 国际化强制同步规则

### 内容文件同步

- **修改content/posts/en/**时，必须同时修改**content/posts/zh/**
- **修改content/pages/en/**时，必须同时修改**content/pages/zh/**
- **修改messages/en.json**时，必须同时修改**messages/zh.json**
- **禁止**: 单独修改一种语言的内容文件

### 组件国际化

- **必须使用**: `useTranslations()`钩子获取翻译
- **必须导入**: `import { useTranslations } from 'next-intl'`
- **禁止**: 硬编码中英文文本
- **示例**:

  ```typescript
  // ✅ 正确
  const t = useTranslations('common');
  return <button>{t('submit')}</button>;

  // ❌ 错误
  return <button>Submit</button>;
  ```

### 路由国际化

- **必须使用**: `src/i18n/routing.ts`中的Link组件
- **禁止使用**: Next.js原生Link组件
- **示例**:

  ```typescript
  // ✅ 正确
  import { Link } from '@/i18n/routing';

  // ❌ 错误
  import Link from 'next/link';
  ```

## 组件开发标准

### shadcn/ui组件使用

- **必须使用**: 现有的src/components/ui/组件
- **添加新组件**: 使用`npx shadcn@latest add [component]`
- **禁止**: 直接修改ui/组件源码
- **自定义组件**: 放置在src/components/对应分类目录

### 主题系统

- **必须支持**: light、dark、system三种主题模式
- **必须使用**: `useTheme()`钩子
- **必须导入**: `import { useTheme } from 'next-themes'`
- **CSS变量**: 使用Tailwind CSS主题变量，禁止硬编码颜色

### 组件命名规范

- **文件名**: kebab-case (例: theme-toggle.tsx)
- **组件名**: PascalCase (例: ThemeToggle)
- **Props接口**: ComponentNameProps (例: ThemeToggleProps)

## 代码质量要求

### TypeScript规则

- **严格模式**: 必须通过`pnpm type-check:strict`
- **禁止any**: 使用具体类型、unknown或泛型，100%类型覆盖
- **必须定义**: 所有Props接口和返回类型
- **React组件类型**: 必须显式定义组件Props接口
- **空值处理**: 必须检查null和undefined，使用可选链和空值合并
- **导入顺序**: React → Next.js → 第三方 → 内部类型 → 内部库 → 组件 → 相对导入
- **示例**:

  ```typescript
  // ✅ 正确：显式React组件类型
  import React from 'react';
  import type { ReactNode, FC } from 'react';

  interface ComponentProps {
    children: ReactNode;
    title: string;
    optional?: string;
  }

  const Component: FC<ComponentProps> = ({ children, title, optional }) => {
    return <div>{title}: {children}</div>;
  };

  // ✅ 正确：空值处理
  function getTitle(content: Content | null): string {
    if (!content) {
      return 'Untitled';
    }
    return content.title ?? 'No Title';
  }

  // ✅ 正确：泛型使用
  interface ApiResponse<T> {
    data: T;
    status: number;
    message: string;
  }
  ```

### ESLint规则

- **必须通过**: `pnpm lint:strict` (0警告标准)
- **复杂度限制**:
  - 循环复杂度 ≤ 15 (优化后，平衡质量与AI友好性)
  - 函数长度 ≤ 120行 (优化后，适应完整业务逻辑)
  - 嵌套深度 ≤ 4层
  - 参数数量 ≤ 5个
  - 文件长度 ≤ 500行
- **安全规则**: 必须通过双重安全插件检查（22条安全规则）
- **React规则**: 必须遵循react-hooks和react-you-might-not-need-an-effect规则

### 属性访问规则配置

项目采用**宽松的dot-notation配置**，遵循Next.js官方推荐：

```javascript
'dot-notation': ['error', {
  allowKeywords: true,
  allowPattern: '^[a-zA-Z_$][a-zA-Z0-9_$]*$'
}]
```

**配置原因**:

- **Next.js官方集成**: 使用next/core-web-vitals和next/typescript配置
- **TypeScript兼容性**: 关闭noPropertyAccessFromIndexSignature以支持点号访问
- **动态数据处理**: API响应、用户配置、国际化等场景
- **业界最佳实践**: Vercel、GitHub、VS Code等大型项目的选择
- **AI开发友好**: 减少配置冲突，提高开发效率
- **测试环境优化**: 测试文件中允许any类型和mock对象

### 代码复杂度控制

- **函数拆分**: 大函数必须拆分为单一职责的小函数
- **策略模式**: 使用策略模式和查找表替代复杂if-else链
- **早期返回**: 使用guard子句减少嵌套深度
- **示例**:

  ```typescript
  // ✅ 正确：使用策略模式
  const processors = {
    markdown: processMarkdown,
    mdx: processMdx,
    html: processHtml,
  } as const;

  // ✅ 正确：早期返回
  function processUser(user: User): ProcessResult {
    if (!user.isActive) {
      return { success: false, error: 'User inactive' };
    }
    return processValidUser(user);
  }
  ```

### 代码格式

- **必须使用**: Prettier格式化
- **必须通过**: `pnpm format:check`
- **字符串引号**: 必须使用单引号
- **尾随逗号**: 多行结构必须包含尾随逗号
- **行宽限制**: 最大80字符
- **缩进规则**: 2个空格，禁止使用Tab
- **导入排序**: React → Next.js → 第三方 → @/types → @/lib → @/components →
  @/app → @/ → 相对导入
- **Tailwind排序**: 使用prettier-plugin-tailwindcss自动排序类名

### 变量和属性访问

- **未使用变量**: 必须删除或使用下划线前缀标记
- **属性访问**: 优先使用点号表示法，动态属性和Record类型使用方括号
- **魔术数字**: 必须定义为常量（例外：0、1、-1、100、常见HTTP状态码、端口号）
- **示例**:

  ```typescript
  // ✅ 正确：常量定义
  const MAX_TITLE_LENGTH = 100;
  const DEFAULT_PAGE_SIZE = 20;

  // ✅ 正确：未使用参数标记
  function handleEvent(_event: Event, data: EventData): void {
    processEventData(data);
  }

  // ✅ 正确：属性访问
  const title = content.metadata.title;
  const nodeEnv = process.env['NODE_ENV']; // 环境变量

  // ✅ 正确：Record类型使用方括号（TypeScript严格模式要求）
  const apiData: Record<string, unknown> = await fetchData();
  if (apiData['status'] === 'success') {
    // 动态数据访问
  }
  ```

## 文件操作规范

### 创建新文件

- **页面文件**: 必须放在src/app/[locale]/目录下
- **组件文件**: 根据功能放在src/components/对应子目录
- **工具函数**: 放在src/lib/目录下
- **类型定义**: 放在src/types/目录下

### 修改现有文件

- **必须检查**: 文件是否有国际化依赖
- **必须同步**: 相关的多语言文件
- **必须验证**: 修改后通过所有质量检查

### MDX内容管理

- **内容结构**: 必须包含frontmatter元数据
- **图片资源**: 放在public/目录下
- **内部链接**: 使用相对路径
- **示例**:

  ```mdx
  ---
  title: '文章标题'
  description: '文章描述'
  date: '2024-01-01'
  ---

  # 文章内容
  ```

## TinaCMS内容管理系统

### 依赖包配置

- **必须安装**: `@tinacms/cli@^1.10.2` (开发依赖)
- **必须安装**: `@tinacms/mdx@^1.8.1` (开发依赖)
- **必须安装**: `tinacms@^2.8.2` (生产依赖)
- **禁止**: 修改TinaCMS版本号，除非有明确的升级需求

### 配置文件结构

- **核心配置**: `tina/config.ts` - TinaCMS主配置文件
- **生成文件**: `tina/__generated__/` - 自动生成的类型和配置
- **性能配置**: `tina/performance.ts` - 缓存和优化配置
- **禁止修改**: 自动生成的文件，仅修改源配置

### 环境变量要求

- **必须配置**: `TINA_CLIENT_ID` - TinaCMS客户端ID
- **必须配置**: `TINA_TOKEN` - TinaCMS访问令牌
- **可选配置**: `TINA_BRANCH` - Git分支名称（默认main）
- **安全要求**: 敏感变量必须放在.env.local，禁止提交到Git

### 开发命令标准

- **启动TinaCMS**: `pnpm run tina:dev` - 启动完整开发环境
- **仅Next.js**: `pnpm run dev` - 仅启动Next.js服务器
- **配置检查**: `pnpm run tina:audit` - 验证TinaCMS配置
- **类型生成**: `pnpm run tina:build` - 重新生成TypeScript类型

### 多语言内容管理配置

- **内容路径**: 必须按语言分目录存储
  - 英文内容: `content/posts/en/` 和 `content/pages/en/`
  - 中文内容: `content/posts/zh/` 和 `content/pages/zh/`
- **语言字段**: 必须在Schema中定义locale字段
- **文件命名**: 使用相同slug，不同语言目录
- **同步要求**: 修改一种语言内容时，必须同时更新另一种语言

### TinaCMS Schema配置标准

- **集合定义**: 必须包含posts和pages两个集合
- **字段类型**: 严格定义所有字段类型和验证规则
- **语言支持**: 每个集合必须包含locale字段
- **SEO配置**: 必须包含完整的SEO字段对象
- **示例**:

  ```typescript
  // ✅ 正确：TinaCMS集合配置
  {
    name: 'posts',
    label: 'Blog Posts',
    path: 'content/posts',
    format: 'mdx',
    match: { include: '{en,zh}/**/*' },
    fields: [
      {
        type: 'string',
        name: 'locale',
        label: 'Language',
        options: [
          { value: 'en', label: 'English' },
          { value: 'zh', label: '中文' }
        ],
        required: true
      },
      // 其他字段...
    ]
  }
  ```

### 内容管理规则

- **MDX文件编辑**: 直接编辑`content/`目录下的MDX文件
- **Front Matter验证**: 使用TypeScript接口验证元数据完整性
- **多语言同步**: 英中文内容必须保持结构一致性
- **文件命名规范**: 使用kebab-case命名，保持语言目录对应

### 媒体文件管理

- **存储路径**: 必须使用`public/images/`目录
- **文件格式**: 支持JPG、PNG、WebP格式
- **大小限制**: 单文件≤5MB
- **命名规范**: 使用kebab-case英文命名
- **组织结构**: 按功能分子目录（blog/、pages/、og/等）
- **引用方式**: 在MDX文件中使用相对路径引用图片

## 质量检查流程

### 开发前检查

- **运行**: `pnpm quality:check:strict`
- **确保**: 所有检查通过后再开始开发

### 开发中检查

- **实时检查**: 使用VS Code ESLint插件
- **定期运行**: `pnpm type-check`和`pnpm lint`

### 开发后验证

- **必须运行**: `pnpm quality:full`
- **必须通过**: 所有自动化检查
- **必须验证**: 功能在两种语言下正常工作

## 修复验证流程（强制）

### 每次修改后的强制验证

- **立即验证**: 每次代码修改后必须立即运行 `pnpm lint && pnpm type-check`
- **零容忍原则**: 修复不能引入新的代码质量问题
- **复杂度监控**: 如果修复导致复杂度超限，必须先重构再修复
- **功能验证**: 确保修复不影响现有功能

### 修复质量门禁

- **TypeScript**: 必须零错误，无例外
- **ESLint**: 必须零警告，无例外
- **复杂度**: 函数复杂度≤15，无例外
- **测试**: 所有相关测试必须通过

### 渐进式修复策略

- **复杂函数**: 复杂度>10的函数，先拆分再修复
- **大型修复**: 分阶段进行，每阶段验证质量
- **重构优先**: 复杂代码先重构再修复类型问题

### 类型安全修复最佳实践

- **复杂函数**: 复杂度>10的函数，先拆分再修复
- **空值安全**: 优先使用辅助函数而非内联条件检查
- **渐进式修复**: 大型修复分阶段进行，每阶段验证质量
- **重构优先**: 如果修复会增加复杂度，必须先重构再修复

### 修复流程标准（六步法）

1. **分析问题** → 理解错误根因和影响范围
2. **评估复杂度** → 检查修复是否会增加代码复杂度
3. **必要时先重构** → 如果复杂度会超限，先重构再修复
4. **实施修复** → 应用最小化、精确的修复
5. **立即验证** → 运行 `pnpm lint && pnpm type-check`
6. **确认无新问题** → 确保没有引入新的质量问题

## 构建和部署规则

### 构建验证

- **必须通过**: `pnpm build`
- **必须检查**: 包大小限制`pnpm size:check`
- **必须验证**: 无循环依赖`pnpm arch:validate`

### 性能要求

- **包大小**: 主应用包≤50KB，框架包≤130KB
- **代码重复**: ≤3%重复率
- **类型覆盖**: 100%类型安全

## 禁止操作清单

### 绝对禁止

- **禁止**: 修改package.json依赖版本
- **禁止**: 绕过ESLint规则使用eslint-disable
- **禁止**: 使用console.log/console.error/console.warn在生产代码中
- **禁止**: 直接修改node_modules文件
- **禁止**: 提交未格式化的代码
- **禁止**: 使用any类型（使用unknown、具体类型或泛型）
- **禁止**: 使用dangerouslySetInnerHTML（除非使用DOMPurify清理）
- **禁止**: 创建循环依赖
- **禁止**: 生产代码导入测试文件或devDependencies
- **禁止**: 使用弱加密算法（MD5、SHA-1、Math.random()）
- **禁止**: 使用HTML img标签（必须使用next/image）
- **禁止**: 使用Tab缩进（必须使用2个空格）

### 条件禁止

- **禁止**: 单独修改一种语言的内容（除非同时修改另一种）
- **禁止**: 添加新的UI库（除非移除shadcn/ui）
- **禁止**: 修改核心配置文件（除非有明确需求）

## AI决策标准

### 优先级判断

1. **最高优先级**: 国际化同步和类型安全
2. **高优先级**: 代码质量和ESLint规则
3. **中优先级**: 性能优化和用户体验
4. **低优先级**: 代码风格和注释

### 冲突解决

- **类型安全 vs 功能实现**: 优先类型安全
- **国际化 vs 开发速度**: 优先国际化完整性
- **代码质量 vs 功能复杂度**: 优先代码质量

### 不确定情况处理

- **缺少翻译**: 使用英文作为fallback，标记TODO
- **组件选择**: 优先使用现有shadcn/ui组件
- **架构决策**: 遵循现有模式，避免引入新概念

## 关键文件交互标准

### 同步修改要求

- **修改README.md** → 必须同时修改docs/zh/README.md
- **修改src/app/[locale]/layout.tsx** → 检查两种语言的元数据
- **修改src/components/theme/** → 确保主题切换在所有语言下正常
- **修改messages/\*.json** → 必须保持键值对一致

### 依赖文件检查

- **修改组件** → 检查相关测试文件
- **修改类型定义** → 检查所有引用文件
- **修改配置文件** → 运行完整质量检查

## 错误处理标准

### 常见错误处理

- **国际化错误**: 提供英文fallback
- **主题切换错误**: 回退到系统主题
- **组件渲染错误**: 使用ErrorBoundary包装

### 调试信息

- **开发环境**: 可以使用console.warn
- **生产环境**: 必须使用结构化日志
- **错误上报**: 集成Sentry错误监控

## 常见问题解决方案

### TypeScript严格模式问题

- **exactOptionalPropertyTypes错误**: 使用条件展开`...(prop && { prop })`避免传递undefined
- **对象注入安全**: 使用switch语句替代对象属性访问，避免`obj[userInput]`模式
- **魔术数字**: 定义常量替代业务逻辑中的数字，允许0/1/-1/100/HTTP状态码

### React组件最佳实践

- **useEffect优化**: 避免在事件处理中使用useEffect，直接调用事件处理函数
- **组件Props**: 使用条件展开传递可选属性，确保类型安全
- **性能优化**: 使用React.memo、useCallback稳定函数引用

### AI编码导入保护策略

- **React导入**: 始终显式导入React，使用`React.FC`类型确保不被误删
- **类型导入**: 使用`import type`语法，并在使用处明确标注类型
- **副作用导入**: 添加行内注释说明用途`import './globals.css'; // Global styles`
- **调试导入**: 临时调试导入使用`// @ts-ignore`或ESLint忽略注释
- **分步开发**: 先完成核心逻辑，再添加导入，避免中途保存导致误删

**AI编码最佳实践**：

```typescript
// ✅ 推荐：明确的React使用
import React from 'react';
export const Component: React.FC<Props> = () => <div />;

// ✅ 推荐：类型导入明确使用
import type { FC, ReactNode } from 'react';
const Component: FC<{ children: ReactNode }> = ({ children }) => <div>{children}</div>;

// ✅ 推荐：副作用导入添加注释
import './component.css'; // Component-specific styles

// ✅ 推荐：调试导入保护
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { debugLog } from './debug'; // Temporary debugging
```

## 测试要求

### 测试文件结构

- **组件测试**: src/components/\*\*/**tests**/
- **工具函数测试**: src/lib/\*\*/**tests**/
- **Hook测试**: src/hooks/\*\*/**tests**/
- **必须使用**: Vitest + Testing Library（禁止Jest）

### 测试覆盖要求

- **组件测试**: 必须测试主要功能和边界情况
- **国际化测试**: 必须测试两种语言的渲染
- **主题测试**: 必须测试三种主题模式
- **类型测试**: 使用TypeScript类型定义，避免any
- **覆盖率标准**: 全局≥85%，关键业务逻辑≥95%

### 测试命名规范

- **测试文件**: component-name.test.tsx
- **测试描述**: 使用英文，描述具体行为
- **Mock配置**: 使用vi.hoisted模式，完整Mock实现
- **示例**:
  ```typescript
  import { describe, it, expect, vi, beforeEach } from 'vitest';

  describe('ThemeToggle', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should switch between light and dark themes', () => {
      // 测试逻辑
    });
  });
  ```

## 性能优化规则

### 包大小限制

- **主应用包**: ≤ 50 KB
- **框架包**: ≤ 130 KB
- **共享块**: ≤ 260 KB
- **CSS包**: ≤ 50 KB
- **代码重复**: ≤ 3%
- **监控工具**: 使用`pnpm size:check`和`pnpm analyze`

### 图片优化

- **必须使用**: next/image组件
- **禁止使用**: HTML img标签
- **格式要求**: WebP/AVIF优先，PNG/JPEG备选
- **尺寸要求**: 提供多种尺寸的响应式图片
- **懒加载**: 自动启用图片懒加载

### 代码分割和导入

- **动态导入**: 大型组件使用React.lazy
- **路由分割**: 页面级别自动分割
- **第三方库**: 按需导入，避免全量导入
- **代码重用**: 提取公共功能到可重用工具函数
- **示例**:

  ```typescript
  // ✅ 正确：按需导入
  // ❌ 错误：全量导入
  import * as Icons from 'lucide-react';

  import { Button } from '@/components/ui/button';

  // ✅ 正确：动态导入大型组件
  const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
  ```

### 缓存策略

- **静态资源**: 使用Next.js内置缓存
- **API响应**: 合理设置revalidate时间
- **国际化**: 使用next-intl缓存机制
- **构建缓存**: 利用增量静态再生(ISR)

### React性能优化

- **Server Components**: 默认使用React Server Components
- **Client Components**: 仅在需要交互时使用'use client'
- **Hook规则**: 遵循React Hooks规则，正确设置依赖数组
- **避免不必要Effect**: 遵循react-you-might-not-need-an-effect规则

## 安全规则

### 输入验证和清理

- **表单数据**: 必须使用Zod验证所有用户输入
- **URL参数**: 必须验证和清理
- **用户输入**: 防止XSS攻击，禁止直接使用dangerouslySetInnerHTML
- **对象注入**: 禁止将用户输入直接作为对象属性键，必须使用白名单验证
- **示例**:

  ```typescript
  // ✅ 正确：输入验证
  const schema = z.object({
    title: z.string().min(1).max(100),
    content: z.string().min(1),
  });

  // ✅ 正确：属性白名单
  const allowedProperties = new Set(['title', 'author', 'date']);
  function getProperty(obj: Content, prop: string) {
    if (!allowedProperties.has(prop)) {
      throw new Error(`Property ${prop} not allowed`);
    }
    return obj[prop as keyof Content];
  }
  ```

### 文件系统安全

- **路径验证**: 必须验证和规范化所有文件路径
- **目录遍历**: 防止..路径遍历攻击
- **扩展名检查**: 限制允许的文件扩展名
- **目录限制**: 限制文件访问在允许的目录内
- **示例**:

  ```typescript
  // ✅ 正确：安全的文件读取
  function readContentFile(filename: string): string {
    const normalizedPath = path.normalize(filename);
    if (normalizedPath.includes('..')) {
      throw new Error('Path traversal detected');
    }

    const ext = path.extname(normalizedPath);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new Error(`Unsupported extension: ${ext}`);
    }

    const fullPath = path.join(CONTENT_DIR, normalizedPath);
    if (!fullPath.startsWith(CONTENT_DIR)) {
      throw new Error('File outside allowed directory');
    }

    return fs.readFileSync(fullPath, 'utf-8');
  }
  ```

### XSS防护

- **禁止dangerouslySetInnerHTML**: 除非使用DOMPurify清理
- **自动转义**: 优先使用React自动转义
- **内容清理**: 使用可信的清理库处理HTML内容

### 加密和随机数

- **加密算法**: 必须使用AES-256
- **哈希算法**: 必须使用SHA-256或更强
- **随机数生成**: 必须使用crypto.randomBytes()
- **禁止弱算法**: 禁止MD5、SHA-1、Math.random()

### 环境变量

- **敏感信息**: 使用.env.local
- **公开变量**: 使用NEXT*PUBLIC*前缀
- **类型安全**: 使用@t3-oss/env-nextjs验证

### 依赖安全

- **定期检查**: 运行pnpm audit
- **版本锁定**: 使用pnpm-lock.yaml
- **安全扫描**: 使用优化的双重安全插件+Semgrep保护（29条安全规则）
- **零容忍**: 注入漏洞、XSS漏洞零容忍

### ESLint安全插件配置

项目采用**优化的双重安全插件**架构，结合Semgrep静态分析，提供全面的安全保护：

#### 主力插件：eslint-plugin-security (14条规则)

- `detect-buffer-noassert` - Buffer安全检查
- `detect-child-process` - 子进程安全
- `detect-disable-mustache-escape` - 模板转义检查
- `detect-eval-with-expression` - eval安全检查
- `detect-new-buffer` - Buffer构造安全
- `detect-no-csrf-before-method-override` - CSRF防护
- `detect-non-literal-fs-filename` - 文件系统安全
- `detect-non-literal-regexp` - 正则表达式安全
- `detect-non-literal-require` - require安全
- `detect-object-injection` - 对象注入防护
- `detect-possible-timing-attacks` - 时序攻击防护
- `detect-pseudoRandomBytes` - 随机数安全
- `detect-unsafe-regex` - 不安全正则检测
- `detect-bidi-characters` - Unicode双向攻击检测

#### 补充插件：eslint-plugin-security-node (5条核心规则)

**启用的核心规则**：

- `detect-nosql-injection` - NoSQL注入防护
- `detect-improper-exception-handling` - 异常处理检测
- `detect-unhandled-event-errors` - 事件错误处理
- `detect-security-missconfiguration-cookie` - Cookie安全配置
- `disable-ssl-across-node-server` - SSL禁用检测

**已迁移到Semgrep的规则**：

- `detect-sql-injection` - 由Semgrep `sql-injection-risk`规则覆盖
- `detect-html-injection` - 由Semgrep `nextjs-unsafe-html-injection`规则覆盖
- `detect-dangerous-redirects` - 由Semgrep `nextjs-unsafe-redirect`规则覆盖

#### Semgrep静态分析 (10条规则)

- `nextjs-unsafe-dangerouslySetInnerHTML` - XSS防护
- `hardcoded-api-keys` - 硬编码密钥检测
- `unsafe-eval-usage` - eval安全检查
- `nextjs-unsafe-redirect` - 重定向安全
- `insecure-random-generation` - 随机数安全
- `nextjs-unsafe-html-injection` - HTML注入检测
- `weak-crypto-algorithm` - 弱加密算法检测
- `sql-injection-risk` - SQL注入防护
- `nextjs-unsafe-server-action` - Server Action安全
- `environment-variable-exposure` - 环境变量暴露检测

#### 配置优化说明

- **总规则数**: 19条ESLint规则 + 10条Semgrep规则 = 29条安全规则
- **优化策略**: 禁用重复规则，减少检查开销，保持安全保护水平
- **主力插件**: eslint-plugin-security作为核心安全检查
- **补充插件**: security-node提供无替代的Node.js特定检查
- **静态分析**: Semgrep提供灵活的安全模式检测
- **已禁用规则**: `detect-unhandled-async-errors` (插件bug)
- **迁移策略**: 渐进式优化，保持向后兼容

## 部署准备规则

### 部署前检查清单

- [ ] 运行`pnpm quality:full`通过
- [ ] 运行`pnpm build`成功
- [ ] 运行`pnpm test`全部通过
- [ ] 检查两种语言功能正常
- [ ] 检查三种主题模式正常
- [ ] 验证响应式设计
- [ ] 检查SEO元数据完整

### 环境配置

- **开发环境**: 使用.env.local
- **生产环境**: 配置Vercel环境变量
- **监控配置**: Sentry错误监控
- **分析配置**: Vercel Analytics

## 维护和更新规则

### 依赖更新

- **主要版本**: 需要全面测试
- **次要版本**: 运行质量检查
- **补丁版本**: 基本验证即可
- **安全更新**: 立即应用

### 代码重构

- **重构前**: 确保测试覆盖充分
- **重构中**: 保持功能不变
- **重构后**: 运行完整质量检查

### 文档更新

- **代码变更**: 同步更新相关文档
- **API变更**: 更新接口文档
- **配置变更**: 更新配置说明

## 应急处理规则

### 生产问题

1. **立即回滚**: 如果影响用户体验
2. **错误监控**: 查看Sentry错误报告
3. **快速修复**: 最小化变更
4. **验证修复**: 完整测试流程

### 构建失败

1. **检查依赖**: 验证package.json
2. **检查配置**: 验证配置文件
3. **检查代码**: 运行本地质量检查
4. **逐步排查**: 二分法定位问题

### 国际化问题

1. **检查翻译**: 验证messages文件
2. **检查路由**: 验证国际化路由配置
3. **检查组件**: 验证useTranslations使用
4. **回退机制**: 确保英文fallback正常

## 架构和依赖规则

### 依赖方向控制

- **组件层**: 可以使用工具库，但工具库不能导入组件
- **循环依赖**: 绝对禁止，使用`pnpm arch:validate`检查
- **测试隔离**: 生产代码禁止导入测试文件
- **依赖层次**: 遵循清晰的依赖方向

### 日志和调试

- **生产环境**: 必须使用结构化日志，禁止console语句
- **开发环境**: 可以使用console.warn进行调试
- **日志格式**: 使用@/lib/logger进行结构化日志记录
- **示例**:

  ```typescript
  // ✅ 正确：结构化日志
  import { logger } from '@/lib/logger';

  logger.info('Processing content', {
    contentId: content.id,
    type: content.type,
  });

  // ❌ 错误：生产环境console
  console.log('Processing content');
  ```

### 质量标准总结

- **类型安全**: 100%类型覆盖，零any类型
- **代码质量**: 循环复杂度≤15，函数长度≤120行
- **安全标准**: 零注入漏洞，零XSS漏洞
- **性能标准**: 主包≤50KB，代码重复≤3%
- **测试覆盖**: 组件、国际化、主题全覆盖
