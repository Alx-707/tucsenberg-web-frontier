# TinaCMS GraphQL 端点使用指南

## 问题解决总结

### 原始问题
访问 `http://localhost:4001/graphql` 显示 `{"errors":[{}]}`

### 根本原因
1. **环境变量配置不匹配**：
   - `tina/config.ts` 使用 `TINA_CLIENT_ID`
   - `.env.local` 定义的是 `NEXT_PUBLIC_TINA_CLIENT_ID`

2. **内容文件缺少必需字段**：
   - MDX 文件的 Front Matter 缺少 `locale` 字段
   - 导致 GraphQL 查询返回 null 值

### 解决方案
1. ✅ **修复环境变量配置**：
   ```typescript
   // tina/config.ts
   clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
   branch: process.env.NEXT_PUBLIC_TINA_BRANCH || 'main',
   ```

2. ✅ **添加缺失的 locale 字段**：
   ```yaml
   # content/posts/en/welcome-to-tucsenberg.mdx
   ---
   locale: 'en'
   title: 'Welcome to Tucsenberg Web Frontier'
   # ... 其他字段
   ```

## GraphQL 端点状态说明

### 正常行为
- 直接访问 `http://localhost:4001/graphql` 显示 `{"errors":[{}]}` 是**正常的**
- 这表示 GraphQL 服务器正在运行，但需要有效的查询才能返回数据

### 正确的访问方式

#### 1. 使用 GraphQL Playground
```
http://localhost:4001/admin/index.html#/graphql
```

#### 2. 发送 POST 请求
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ collections { name label } }"}' \
  http://localhost:4001/graphql
```

#### 3. 示例查询
```graphql
# 获取所有集合
{ 
  collections { 
    name 
    label 
  } 
}

# 获取博客文章
{ 
  postsConnection { 
    totalCount 
    edges { 
      node { 
        title 
        locale 
        slug 
        publishedAt 
      } 
    } 
  } 
}

# 获取页面
{ 
  pagesConnection { 
    totalCount 
    edges { 
      node { 
        title 
        locale 
        slug 
      } 
    } 
  } 
}
```

## 测试验证

运行测试脚本验证所有功能：
```bash
node scripts/test-graphql-endpoint.js
```

## 相关 URL

- **GraphQL API**: http://localhost:4001/graphql
- **TinaCMS 管理界面**: http://localhost:4001/admin/index.html
- **GraphQL Playground**: http://localhost:4001/admin/index.html#/graphql
- **Next.js 应用**: http://localhost:3000
- **Next.js 管理页面**: http://localhost:3000/admin

## 启动命令

```bash
# 启动 TinaCMS 开发服务器（包含 Next.js）
pnpm run tina:dev

# 仅启动 TinaCMS 管理界面
pnpm run tina:admin

# 构建 TinaCMS
pnpm run tina:build
```

## 故障排除

如果遇到问题，请按以下顺序检查：

1. **检查服务器状态**：
   ```bash
   lsof -i :4001  # 检查端口占用
   ```

2. **验证环境变量**：
   ```bash
   node scripts/tina-init.js  # 运行初始化检查
   ```

3. **重新生成类型**：
   ```bash
   npx @tinacms/cli init
   ```

4. **运行部署检查**：
   ```bash
   node scripts/tinacms-deployment-check.js
   ```
