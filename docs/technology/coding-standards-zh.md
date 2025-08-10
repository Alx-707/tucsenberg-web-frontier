---
type: 'always_apply'
description: '适用于本项目所有代码的核心编码标准'
---

# 核心编码标准

始终使用明确的TypeScript类型而不是'any'。保持函数在80行以内。验证所有用户输入并清理文件路径。在Next.js
15中默认使用React服务器组件。

为了安全，通过白名单验证属性名来防止对象注入攻击。始终规范化文件路径并检查目录遍历尝试。

使用结构化日志记录而不是console语句。优先使用点符号访问属性。定义常量而不是魔法数字。

## 代码格式化标准

字符串始终使用单引号。在所有多行结构（对象、数组、函数参数）中包含尾随逗号。将行宽限制为80个字符。使用2个空格缩进，永远不要使用制表符。

对于导入语句，遵循以下确切顺序：首先是React导入，然后是Next.js导入，然后是第三方模块，然后是内部类型(@/types)，然后是内部库(@/lib)，然后是组件(@/components)，然后是应用代码(@/app)，然后是其他内部模块(@/)，最后是相对导入(./)。

## 架构和依赖关系

永远不要在模块之间创建循环依赖。遵循清晰的依赖方向 - 组件可以使用工具，但工具不能导入组件。生产代码绝不能从测试文件或devDependencies导入。

## 类型安全指导原则

### 始终定义React组件类型

每个React组件都必须有明确的类型定义。导入React并为所有props定义适当的接口。

```typescript
// 正确做法：明确的React导入和类型定义
import React from 'react';
import type { ReactNode, FC } from 'react';

interface ComponentProps {
  children: ReactNode;
  title: string;
}

const Component: FC<ComponentProps> = ({ children, title }) => {
  return <div>{title}: {children}</div>;
};
```

### 永远不要使用Any类型

始终使用特定的TypeScript类型而不是'any'。使用接口、联合类型或泛型以获得更好的类型安全性。

```typescript
// 正确做法：使用特定类型或泛型
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

function processData<T>(input: T): T {
  return input;
}

// 错误做法：使用any类型
function processData(input: any): any {
  return input;
}
```

### 处理空值和未定义值

始终检查空值和未定义值。使用可选链和空值合并操作符。

```typescript
// 正确做法：处理null/undefined情况
function getContentTitle(content: Content | null): string {
  if (!content) {
    return 'Untitled';
  }
  return content.title ?? 'No Title';
}

const title = content?.metadata?.title ?? 'Default Title';
```

## 代码复杂度指导原则

### 保持函数在80行以内

将大型函数拆分为更小、更专注的函数。每个函数应该有单一职责。

```typescript
// 正确做法：拆分函数，单一职责
function validateContentMetadata(metadata: ContentMetadata): ValidationResult {
  const titleValidation = validateTitle(metadata.title);
  const authorValidation = validateAuthor(metadata.author);
  const dateValidation = validateDate(metadata.date);

  return combineValidationResults([
    titleValidation,
    authorValidation,
    dateValidation,
  ]);
}

function validateTitle(title: string): FieldValidation {
  if (!title || title.trim().length === 0) {
    return { field: 'title', valid: false, error: 'Title is required' };
  }
  if (title.length > 100) {
    return { field: 'title', valid: false, error: 'Title too long' };
  }
  return { field: 'title', valid: true };
}
```

### 将圈复杂度限制为10

使用策略模式和查找表而不是复杂的if-else链。保持决策逻辑简单。

```typescript
// 正确做法：使用策略模式降低复杂度
const contentProcessors = {
  markdown: processMarkdownContent,
  mdx: processMdxContent,
  html: processHtmlContent,
} as const;

function processContent(content: Content): ProcessedContent {
  const processor = contentProcessors[content.type];
  if (!processor) {
    throw new Error(`Unsupported content type: ${content.type}`);
  }
  return processor(content);
}
```

### 避免超过4层的深度嵌套

使用提前返回和守卫子句来减少嵌套深度。这使代码更易读。

```typescript
// 正确做法：提前返回减少嵌套
function processUserContent(user: User, content: Content): ProcessResult {
  if (!user.isActive) {
    return { success: false, error: 'User inactive' };
  }

  if (!content.isValid) {
    return { success: false, error: 'Invalid content' };
  }

  if (!user.hasPermission(content.type)) {
    return { success: false, error: 'No permission' };
  }

  return processValidContent(user, content);
}
```

## 安全指导原则

### 防止对象注入攻击

永远不要直接使用用户输入作为对象属性键。始终根据白名单验证属性名。

```typescript
// 正确做法：使用白名单验证
const allowedProperties = new Set(['title', 'author', 'date', 'content']);

function getContentProperty(content: Content, property: string): unknown {
  if (!allowedProperties.has(property)) {
    throw new Error(`Property ${property} is not allowed`);
  }
  return content[property as keyof Content];
}

// 正确做法：使用类型安全的属性访问
function getContentProperty<K extends keyof Content>(
  content: Content,
  property: K
): Content[K] {
  return content[property];
}
```

### 安全的文件系统访问

始终验证和规范化文件路径。防止目录遍历攻击并限制文件访问在允许的目录内。

```typescript
// 正确做法：路径验证和规范化
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');
const ALLOWED_EXTENSIONS = ['.md', '.mdx'];

function readContentFile(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename');
  }

  const normalizedPath = path.normalize(filename);
  if (normalizedPath.includes('..')) {
    throw new Error('Path traversal detected');
  }

  const ext = path.extname(normalizedPath);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`Unsupported file extension: ${ext}`);
  }

  const fullPath = path.join(CONTENT_DIR, normalizedPath);
  if (!fullPath.startsWith(CONTENT_DIR)) {
    throw new Error('File outside allowed directory');
  }

  return fs.readFileSync(fullPath, 'utf-8');
}
```

### 验证所有用户输入

对所有用户输入使用模式验证。永远不要信任来自外部源的数据而不进行验证。

```typescript
// 正确做法：验证所有用户输入
function createContent(input: unknown): Content {
  const schema = z.object({
    title: z.string().min(1).max(100),
    content: z.string().min(1),
    author: z.string().min(1),
    tags: z.array(z.string()).optional(),
  });

  const validated = schema.parse(input);
  return new Content(validated);
}
```

### 防止XSS攻击

永远不要在React组件中使用dangerouslySetInnerHTML。如果需要HTML渲染，请先使用DOMPurify等可信的清理库清理内容。

```typescript
// 错误做法：永远不要在没有清理的情况下使用dangerouslySetInnerHTML
function UnsafeComponent({ htmlContent }: { htmlContent: string }) {
  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />; // ❌ XSS风险
}

// 正确做法：使用可信的清理库
import DOMPurify from 'dompurify';

function SafeComponent({ htmlContent }: { htmlContent: string }) {
  const sanitizedHTML = DOMPurify.sanitize(htmlContent);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />;
}

// 正确做法：尽可能使用安全的替代方案
function PreferredComponent({ textContent }: { textContent: string }) {
  return <div>{textContent}</div>; // React自动转义
}
```

## 代码质量指导原则

### 使用结构化日志记录而不是Console

永远不要在生产代码中使用console.log、console.error或console.warn。使用带有结构化数据的适当日志系统。

```typescript
// 正确做法：使用结构化日志记录
import { logger } from '@/lib/logger';

function processContent(content: Content): ProcessedContent {
  logger.info('Processing content', {
    contentId: content.id,
    type: content.type,
  });

  try {
    const result = transform(content);
    logger.debug('Content processed successfully', {
      contentId: content.id,
      resultSize: result.size,
    });
    return result;
  } catch (error) {
    logger.error('Content processing failed', {
      contentId: content.id,
      error: error.message,
    });
    throw error;
  }
}
```

### 优先使用点符号访问属性

使用点符号访问对象属性。只在动态属性或特殊字符时使用括号符号。

```typescript
// 正确做法：使用点符号访问属性
const title = content.metadata.title;
const author = content.metadata.author;

// 例外情况：环境变量
const nodeEnv = process.env['NODE_ENV'];
const apiKey = process.env['API_KEY'];
```

### 定义常量而不是魔法数字

用命名常量替换魔法数字。这使代码更可读和可维护。允许的例外：0、1、-1（常见循环值）、100（百分比）、标准HTTP状态码（200、404、500等）。

```typescript
// 正确做法：为业务逻辑数字定义常量
const MAX_TITLE_LENGTH = 100;
const DEFAULT_PAGE_SIZE = 20;
const CACHE_TTL_SECONDS = 3600;

function validateTitle(title: string): boolean {
  return title.length <= MAX_TITLE_LENGTH;
}

// 正确做法：允许的例外 - 不需要常量
const items = array.slice(0, 1); // 0, 1, -1 是允许的
const percentage = (value / total) * 100; // 100用于百分比是允许的
const isSuccess = response.status === 200; // HTTP状态码是允许的
const hasItems = items.length > 0; // 0比较是允许的

// 错误做法：为业务逻辑使用魔法数字
const isValidAge = age > 18; // ❌ 应该是 const MINIMUM_AGE = 18
```

### 移除或标记未使用的变量

移除未使用的变量，或者如果它们是为了接口兼容性而故意未使用的，则用下划线作为前缀。所有声明的变量和函数参数都必须被使用，或明确标记为故意未使用。

```typescript
// 正确做法：移除未使用的变量或用下划线作为前缀
function processContent(
  content: Content,
  _metadata?: Metadata,
): ProcessedContent {
  // _metadata 是故意未使用的，但为了接口兼容性而保留
  return transform(content);
}

// 正确做法：移除真正未使用的变量
function calculateTotal(items: Item[]): number {
  // const unusedVar = 'remove this'; // ❌ 完全移除
  return items.reduce((sum, item) => sum + item.price, 0);
}

// 正确做法：对故意未使用的参数使用下划线
function handleEvent(_event: Event, data: EventData): void {
  // _event 参数是接口要求的，但在此实现中未使用
  processEventData(data);
}
```

## 性能指导原则

### 遵守Bundle大小限制

保持bundle大小在这些限制内以确保快速加载时间：

- Main App Bundle: ≤ 50 KB
- Framework Bundle: ≤ 130 KB
- Shared Chunks: ≤ 260 KB
- CSS Bundle: ≤ 50 KB

### 最小化代码重复

保持代码重复度在3%以下。将通用功能提取为可重用的工具。

```typescript
// 正确做法：提取通用功能
function createValidator<T>(schema: z.ZodSchema<T>) {
  return (input: unknown): T => {
    try {
      return schema.parse(input);
    } catch (error) {
      logger.error('Validation failed', { error });
      throw new ValidationError('Invalid input');
    }
  };
}

const contentValidator = createValidator(contentSchema);
const userValidator = createValidator(userSchema);
```

## 质量标准

### 代码复杂度限制

- 圈复杂度: ≤ 10
- 函数长度: ≤ 80行
- 嵌套深度: ≤ 4层
- 参数数量: ≤ 5个
- 文件长度: ≤ 500行

### 类型安全要求

- 不允许隐式any类型
- 不允许未使用的变量或参数
- 要求100%类型覆盖

### 安全标准

- 零容忍注入漏洞
- 所有文件系统访问必须验证
- 不允许XSS漏洞
- 所有用户输入必须清理

### 加密安全要求

使用只有经过批准的加密算法和安全随机数生成。加密使用AES-256，哈希使用SHA-256或更强，使用crypto.randomBytes()进行安全随机生成。

```typescript
// 正确做法：使用经过批准的加密算法
import crypto from 'crypto';

// 安全加密
const algorithm = 'aes-256-gcm';
const key = crypto.randomBytes(32); // 256位密钥
const iv = crypto.randomBytes(16);

function encryptData(text: string, key: Buffer): EncryptedData {
  const cipher = crypto.createCipher(algorithm, key);
  // 使用适当的IV和认证标签实现
}

// 安全哈希
function hashPassword(password: string, salt: string): string {
  return crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha256')
    .toString('hex');
}

// 安全随机生成
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// 错误做法：使用弱算法
const weakHash = crypto.createHash('md5'); // ❌ MD5在密码学上已被破解
const insecureRandom = Math.random(); // ❌ 不是密码学安全的
```

## React和Next.js最佳实践

### React Hooks规则

遵循Hooks规则 - 只在React函数的顶层调用hooks，永远不要在循环、条件或嵌套函数内调用。useEffect、useCallback和useMemo的依赖数组必须是详尽的，包含从组件作用域中使用的所有值。

### 组件标准

使用PascalCase命名React组件。始终定义明确的prop接口。在Next.js
15中默认使用React服务器组件，只有在需要交互性时才使用'use client'。

### Next.js模式

对所有新页面使用App
Router。实现适当的SEO元数据生成。对所有图片使用next/image而不是标准img标签。当组件较大或条件渲染时，使用动态导入进行代码分割。
