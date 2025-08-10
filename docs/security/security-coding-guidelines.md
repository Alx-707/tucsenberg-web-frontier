# 安全编码指南

## 概述

本文档提供了在Next.js项目中进行安全编码的最佳实践和指南，帮助开发团队避免常见的安全漏洞。

## 安全扫描工具

### 已配置的安全工具

1. **ESLint Security Plugin** - 实时代码安全检查（14条规则）
2. **ESLint Security Node Plugin** - Node.js特定安全规则（5条核心规则）
3. **Semgrep** - 静态安全分析（10条规则）

#### 安全架构优化

项目采用**优化的三层安全检测架构**：

- **第一层**: ESLint Security Plugin - 核心安全检查，覆盖通用安全漏洞
- **第二层**: ESLint Security Node Plugin -
  Node.js特定检查，仅保留无替代的核心规则
- **第三层**: Semgrep静态分析 - 灵活的模式匹配，覆盖框架特定的安全问题

**优化策略**: 禁用重复规则，减少检查开销，总计29条安全规则提供全面保护

### 可用命令

```bash
# 运行ESLint安全检查
pnpm security:eslint

# 运行Semgrep静态分析
pnpm security:semgrep

# 运行完整安全检查
pnpm security:check

# 自动修复可修复的安全问题
pnpm security:fix
```

## 安全最佳实践

### 1. 输入验证和XSS防护

#### ❌ 避免的做法

```typescript
// 危险：直接使用dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{__html: userInput}} />

// 危险：直接设置innerHTML
element.innerHTML = userInput;
```

#### ✅ 推荐的做法

```typescript
// 安全：使用React的默认转义
<div>{userInput}</div>

// 安全：使用DOMPurify清理HTML
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(userInput)}} />
```

### 2. 密钥和敏感信息管理

#### ❌ 避免的做法

```typescript
// 危险：硬编码API密钥
const apiKey = 'sk-1234567890abcdef1234567890abcdef';

// 危险：在日志中暴露环境变量
console.log(process.env.DATABASE_PASSWORD);
```

#### ✅ 推荐的做法

```typescript
// 安全：使用环境变量
const apiKey = process.env.API_KEY;

// 安全：避免在日志中暴露敏感信息
console.log('Database connection established');
```

### 3. 代码注入防护

#### ❌ 避免的做法

```typescript
// 危险：使用eval
eval(userInput);

// 危险：使用Function构造器
new Function(userInput)();
```

#### ✅ 推荐的做法

```typescript
// 安全：使用JSON.parse进行数据解析
try {
  const data = JSON.parse(userInput);
} catch (error) {
  // 处理解析错误
}
```

### 4. 安全的随机数生成

#### ❌ 避免的做法

```typescript
// 危险：不安全的随机数生成
const token = Math.random().toString(36);
const sessionId = Date.now().toString();
```

#### ✅ 推荐的做法

```typescript
// 安全：使用crypto模块
import crypto from 'crypto';

const token = crypto.randomBytes(32).toString('hex');
const sessionId = crypto.randomUUID();
```

### 5. 加密算法选择

#### ❌ 避免的做法

```typescript
// 危险：使用弱加密算法
const hash = crypto.createHash('md5').update(data).digest('hex');
const hmac = crypto.createHmac('sha1', key);
```

#### ✅ 推荐的做法

```typescript
// 安全：使用强加密算法
const hash = crypto.createHash('sha256').update(data).digest('hex');
const hmac = crypto.createHmac('sha256', key);
```

### 6. SQL注入防护

#### ❌ 避免的做法

```typescript
// 危险：字符串拼接查询
const query = `SELECT * FROM users WHERE id = ${userId}`;
db.query(query);
```

#### ✅ 推荐的做法

```typescript
// 安全：使用参数化查询
const query = 'SELECT * FROM users WHERE id = ?';
db.query(query, [userId]);

// 安全：使用ORM
const user = await User.findById(userId);
```

### 7. 重定向安全

#### ❌ 避免的做法

```typescript
// 危险：未验证的重定向
router.push(userProvidedUrl);
```

#### ✅ 推荐的做法

```typescript
// 安全：验证重定向URL
const allowedDomains = ['example.com', 'app.example.com'];
const url = new URL(userProvidedUrl);
if (allowedDomains.includes(url.hostname)) {
  router.push(userProvidedUrl);
}
```

## Next.js特定安全考虑

### 1. Server Actions安全

```typescript
// 安全的Server Action
export async function updateUser(formData: FormData) {
  // 验证用户权限
  const session = await getServerSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  // 验证和清理输入
  const name = formData.get('name')?.toString().trim();
  if (!name || name.length > 100) {
    throw new Error('Invalid name');
  }

  // 安全的数据库操作
  await db.user.update({
    where: { id: session.user.id },
    data: { name },
  });
}
```

### 2. API路由安全

```typescript
// 安全的API路由
export async function POST(request: Request) {
  try {
    // 验证Content-Type
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return Response.json({ error: 'Invalid content type' }, { status: 400 });
    }

    // 限制请求大小
    const body = await request.json();

    // 验证输入
    const { email, password } = body;
    if (!email || !password) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    // 处理业务逻辑
    // ...
  } catch (error) {
    // 不暴露内部错误信息
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## 安全检查清单

### 开发阶段

- [ ] 运行 `pnpm security:check` 确保无安全问题
- [ ] 检查是否有硬编码的密钥或敏感信息
- [ ] 验证所有用户输入都经过适当的验证和清理
- [ ] 确保使用安全的加密算法和随机数生成

### 代码审查阶段

- [ ] 检查是否正确处理了错误和异常
- [ ] 验证权限检查是否到位
- [ ] 确保没有信息泄露风险
- [ ] 检查重定向和URL处理的安全性

### 部署前

- [ ] 运行完整的安全扫描
- [ ] 检查环境变量配置
- [ ] 验证HTTPS配置
- [ ] 确保安全头部设置正确

## 安全配置优化

### 配置优化历史

项目安全配置经过优化，从原有的双重插件架构升级为三层安全检测架构：

**优化前**：

- ESLint Security Plugin: 14条规则
- ESLint Security Node Plugin: 8条规则
- 总计: 22条安全规则

**优化后**：

- ESLint Security Plugin: 14条规则
- ESLint Security Node Plugin: 5条核心规则（禁用3条重复规则）
- Semgrep静态分析: 10条规则
- 总计: 29条安全规则

### 优化效果

- ✅ **减少重复检查**: 禁用3条与Semgrep重复的规则
- ✅ **提升检测能力**: 新增10条Semgrep规则，覆盖框架特定安全问题
- ✅ **保持安全水平**: 总规则数从22条增加到29条
- ✅ **提升性能**: 减少重复检查开销

### 回滚指南

如需回滚到优化前的配置，请按以下步骤操作：

1. **恢复ESLint配置**：

   ```javascript
   // 在 eslint.config.mjs 中恢复以下规则为 'error'
   'security-node/detect-sql-injection': 'error',
   'security-node/detect-html-injection': 'error',
   'security-node/detect-dangerous-redirects': 'error',
   ```

2. **验证配置**：

   ```bash
   pnpm security:check
   pnpm lint:strict
   ```

3. **更新文档**: 相应更新安全规则数量说明

## 应急响应

### 发现安全问题时

1. 立即停止相关功能的部署
2. 评估问题的严重性和影响范围
3. 制定修复计划
4. 实施修复并进行测试
5. 更新安全文档和培训材料

### 联系方式

- 安全团队邮箱: security@company.com
- 紧急联系人: [待填写]

## 参考资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/authentication)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [ESLint Security Plugin](https://github.com/eslint-community/eslint-plugin-security)
- [Semgrep Rules](https://semgrep.dev/explore)
