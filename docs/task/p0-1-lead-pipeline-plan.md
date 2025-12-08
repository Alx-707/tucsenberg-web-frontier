# P0-1：Lead Pipeline 统一架构 & 产品询盘功能实现

> 用途：实现 B2B 外贸企业网站的统一 Lead 获客系统，包括产品询盘表单、联系表单统一、博客订阅等功能。
>
> 协作方式：Codex 规划/审查 + Gemini 前端设计 + Claude Code 实现

---

## 1. 任务总览（Overview）

- **任务编号 & 标题**：
  - P0-1：Lead Pipeline 统一架构 & 产品询盘功能实现

- **业务背景（为什么要做）**：
  - 当前产品询盘表单仅为 demo 实现（`console.log` + `setTimeout`），无法真正接收客户询盘
  - 联系表单已完整实现，但与产品询盘各自独立，缺乏统一的 Lead Pipeline
  - 邮箱订阅 API 骨架存在但缺少 Resend 集成
  - B2B 外贸场景中，询盘是核心转化路径，必须可靠地捕获并通知销售团队

- **技术背景（在什么环境里做）**：
  - Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4
  - 已有：Resend 邮件服务集成、Airtable CRM 集成、Turnstile CAPTCHA、Zod 验证
  - 现有联系表单 API：`/api/contact`，使用 `processFormSubmission` 处理
  - 现有订阅 API：`/api/subscribe`，待完善

- **最终目标（可量化）**：
  - 统一 Lead Pipeline 服务层：`processLead()` 处理所有 Lead 来源
  - 产品询盘表单接入真实后端，成功率 ≥ 99%（至少邮件或 CRM 成功）
  - 联系表单迁移到统一 `processLead()`
  - 博客页面邮箱订阅功能完整可用
  - 所有质量门禁通过：TS/Lint/Test/Build 全绿

---

## 2. 关键决策（Key Decisions）

### 2.1 CTA 交互方式

| 场景 | 交互方式 | 说明 |
|-----|---------|------|
| **产品页 CTA** | Drawer 弹出 | 点击"获取报价"→ 右侧 Drawer 滑出，保留产品上下文 |
| **导航栏 CTA** | 跳转 /contact | 点击"联系我们"→ 跳转到联系页面（SEO + 信任信号） |

### 2.2 WhatsApp 策略

- **全站小图标（弱化）**：右下角始终显示小型 WhatsApp 图标（48x48px）
- 不自动弹窗提示，视觉层级次于表单 CTA
- 点击时预填消息："您好，我对 [产品名] 感兴趣..."

### 2.3 服务层架构（方案 B：统一处理）

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          Lead Pipeline Architecture                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐     │
│  │ ProductInquiry   │   │ ContactForm      │   │ Newsletter       │     │
│  │ (Drawer Modal)   │   │ (Contact Page)   │   │ (Blog Pages)     │     │
│  └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘     │
│           │                      │                      │               │
│           ▼                      ▼                      ▼               │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  processLead({ type, payload })                                 │    │
│  │  统一业务处理：验证 + 字段映射 + 邮件 + CRM + 日志              │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                   │                                     │
│           ┌───────────────────────┼───────────────────────┐            │
│           ▼                       ▼                       ▼            │
│  ┌──────────────┐       ┌──────────────┐       ┌──────────────┐        │
│  │   Resend     │       │   Airtable   │       │   Logger     │        │
│  │  (邮件通知)   │       │   (CRM)      │       │   (监控)     │        │
│  └──────────────┘       └──────────────┘       └──────────────┘        │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.4 字段映射方案

- **姓名字段**：统一使用 `fullName`，后端自动拆分为 `firstName`/`lastName` 写入 Airtable
- **联系表单前端**：改为单个 `Name` 字段（与产品表单一致）
- **留言字段**：统一内部字段 `message`，产品询盘时合成结构化文本

**名字拆分逻辑：**
```
"张三"         → firstName: "张三",     lastName: ""
"John Doe"     → firstName: "John",     lastName: "Doe"
"John Van Doe" → firstName: "John Van", lastName: "Doe"
```

---

## 3. 表单字段定义（Final）

### 3.1 联系表单（Contact Form）

| 字段 | 必填/选填 | 类型 | 说明 |
|-----|----------|------|------|
| `fullName` | **必填** | 文本 | 联系人姓名（原 firstName + lastName 合并） |
| `email` | **必填** | 邮箱 | 邮箱地址 |
| `company` | 选填 | 文本 | 公司名称 |
| `subject` | **必填** | 下拉选择 | 咨询主题（4个预设选项） |
| `message` | **必填** | 多行文本 | 留言内容（≥10字符） |
| `marketingConsent` | 选填 | 复选框 | 默认不勾选 |
| `turnstileToken` | **必填** | 隐藏 | 验证码 |

**Subject 选项：**
1. Product Inquiry / 产品咨询
2. Distributor Partnership / 代理合作
3. OEM/ODM Customization / OEM/ODM 定制
4. Other / 其他

**移除字段：** `phone`（简化表单）

### 3.2 产品询盘表单（Product Inquiry Form）

| 字段 | 必填/选填 | 类型 | 说明 |
|-----|----------|------|------|
| `productSlug` | **必填** | 隐藏 | 自动填充 |
| `productName` | **必填** | 只读显示 | 自动填充 |
| `fullName` | **必填** | 文本 | 联系人姓名 |
| `email` | **必填** | 邮箱 | 邮箱地址 |
| `company` | 选填 | 文本 | 公司名称 |
| `quantity` | **必填** | 数字/文本 | 采购数量 |
| `requirements` | 选填 | 多行文本 | 具体需求（≤2000字符） |
| `marketingConsent` | 选填 | 复选框 | 默认不勾选 |

**移除字段：** `phone`, `targetPrice`

### 3.3 邮箱订阅（Newsletter）

| 字段 | 必填/选填 | 类型 | 说明 |
|-----|----------|------|------|
| `email` | **必填** | 邮箱 | 邮箱地址 |

---

## 4. 当前状态（Current State）

### 4.1 代码结构 & 相关文件

| 模块 | 文件路径 | 状态 | 本次改动 |
|-----|---------|------|---------|
| 联系表单 API | `src/app/api/contact/route.ts` | ✅ 完整 | 迁移到 processLead |
| 联系表单验证 | `src/app/api/contact/contact-api-validation.ts` | ✅ 完整 | 重构 |
| 联系表单组件 | `src/components/forms/contact-form-container.tsx` | ✅ 完整 | 字段调整 |
| 联系表单配置 | `src/config/contact-form-config.ts` | ✅ 完整 | 字段调整 |
| 产品询盘组件 | `src/components/products/product-inquiry-form.tsx` | ⚠️ Demo | 接入真实 API |
| 产品详情页 | `src/app/[locale]/products/[slug]/page.tsx` | ✅ 存在 | 集成 Drawer |
| 订阅 API | `src/app/api/subscribe/route.ts` | ⚠️ 骨架 | 完善 |
| Resend 服务 | `src/lib/resend-core.ts` | ✅ 完整 | 新增模板 |
| Airtable 服务 | `src/lib/airtable/service.ts` | ✅ 完整 | 统一方法 |
| WhatsApp 按钮 | `src/components/whatsapp/whatsapp-floating-button.tsx` | ✅ 完整 | 保持现状 |

### 4.2 已有约束与规则

- TS 严格模式（`agent_docs/coding-standards.md`）
- Server Components 优先，仅交互组件使用 `"use client"`（`agent_docs/architecture.md`）
- i18n 必须使用翻译键（`agent_docs/i18n.md`）
- 函数 ≤120 行，文件 ≤500 行（`agent_docs/coding-standards.md`）
- 安全规则：输入验证、Turnstile、速率限制（`agent_docs/security.md`）

---

## 5. 目标状态 & 非目标（Target & Non-goals）

### 5.1 目标状态

**代码能力：**
- 统一 Lead Pipeline 服务层：`processLead({ type, payload })`
- 所有 Lead 入口（contact/product/newsletter）共用此函数
- 产品询盘 API：`POST /api/inquiry`
- 产品页 CTA + Drawer 交互模式
- 博客页邮箱订阅组件

**用户体验：**
- 产品页：点击 "Request Quote" → 右侧 Drawer 滑出 → 填写表单 → 成功页
- 导航栏：点击 "联系我们" → 跳转 /contact 页面
- 博客页：文章末尾订阅区块
- WhatsApp：全站弱化图标

**质量指标：**
- 所有质量门禁通过
- 测试覆盖：新增 API/组件的单元测试 + 集成测试
- 无 ESLint error/warning

### 5.2 非目标（本阶段刻意不做）

- ❌ 不添加新的 Airtable 表（使用同表 + Source 字段）
- ❌ 产品询盘暂不启用 Turnstile（简化首版，后续按需添加）
- ❌ 不调整 i18n routing 或 messages 结构（仅新增翻译键）
- ❌ 不做移动端专项优化（Drawer 先用默认响应式）

---

## 6. 阶段划分 / 路线图（Phases / Roadmap）

### Phase 1：后端 Lead Pipeline 统一

- **目标**：建立统一的 Lead 处理服务层
- **主要动作**：
  - 创建 `leadSchema`（discriminated union）
  - 实现 `processLead()` 统一业务函数
  - 实现名字拆分 `splitName()` 工具
  - 扩展 ResendService + AirtableService
  - 迁移联系表单到 `processLead()`
- **完成标志**：
  - 联系表单正常工作（通过 processLead）
  - 单元测试覆盖核心逻辑

### Phase 2：产品询盘功能实现

- **目标**：产品页询盘完整可用
- **主要动作**：
  - 创建 `/api/inquiry` 路由
  - 创建 `InquiryDrawer` 组件
  - 创建 `ProductActions` CTA 组件
  - 修改 `ProductInquiryForm` 接入真实 API
  - 实现成功状态 UI
- **完成标志**：
  - 产品页可完成完整询盘流程
  - Drawer 正常打开/关闭

### Phase 3：博客订阅 & 联系表单 UI 优化

- **目标**：博客订阅可用，联系表单字段调整
- **主要动作**：
  - 完善 `/api/subscribe` 集成（调用 processLead）
  - 创建 `BlogNewsletter` 组件
  - 修改联系表单：Name 单字段 + Subject 下拉
  - 集成到博客布局
- **完成标志**：
  - 博客页可订阅
  - 联系表单新字段生效

---

## 7. 任务拆解（Task Breakdown）

### Task A：创建统一 Lead Schema（Zod discriminated union）

- **任务目标**：建立统一的验证基础，支持 contact/product/newsletter 三种类型
- **主要步骤**：
  1. 创建 `src/lib/lead-pipeline/lead-schema.ts`
  2. 定义 `baseLead` 共享字段
  3. 定义 `contactLead` 扩展（subject, message）
  4. 定义 `productLead` 扩展（productSlug, productName, quantity, requirements）
  5. 定义 `newsletterLead`（仅 email）
  6. 导出 `leadSchema = z.discriminatedUnion('type', [...])`
- **验收标准**：
  - TS 编译通过
  - 三种类型验证正确

### Task B：实现名字拆分工具函数

- **任务目标**：创建 `splitName(fullName)` 工具函数
- **主要步骤**：
  1. 创建 `src/lib/lead-pipeline/utils.ts`
  2. 实现拆分逻辑：单词 → firstName, 多词 → 最后一词为 lastName
  3. 编写单元测试
- **验收标准**：
  - 各种姓名格式正确拆分
  - 测试覆盖边界情况

### Task C：实现统一 processLead 业务函数

- **任务目标**：创建统一的 Lead 处理核心函数
- **主要步骤**：
  1. 创建 `src/lib/lead-pipeline/process-lead.ts`
  2. 实现验证 → 字段映射 → 邮件 + CRM 并行处理
  3. 根据 type 选择邮件模板和记录格式
  4. 实现"至少一个成功"策略
  5. 添加超时包裹和结构化日志
- **验收标准**：
  - 三种 Lead 类型都能正确处理
  - 日志记录完整

### Task D：扩展 ResendService 支持多种邮件模板

- **任务目标**：新增产品询盘邮件模板
- **主要步骤**：
  1. 新增 `sendProductInquiryEmail(data)` 方法
  2. 邮件主题突出产品名 + 数量
  3. 添加对应的 HTML/Text 模板
- **验收标准**：
  - 邮件格式正确
  - 现有联系表单邮件不受影响

### Task E：扩展 AirtableService 统一记录创建

- **任务目标**：支持所有 Lead 类型写入同一表
- **主要步骤**：
  1. 新增 `createLead(type, data)` 方法
  2. 根据 type 填充对应字段
  3. 统一 Source 字段标识来源
  4. 新增产品相关字段映射
- **验收标准**：
  - 三种 Lead 类型正确写入
  - Source 字段区分来源

### Task F：迁移联系表单到 processLead

- **任务目标**：将现有联系表单后端迁移到统一处理
- **主要步骤**：
  1. 修改 `/api/contact/route.ts` 调用 `processLead()`
  2. 调整 `contact-api-validation.ts` 适配新 schema
  3. 保持 Turnstile 验证
  4. 确保向后兼容
- **验收标准**：
  - 联系表单正常工作
  - 邮件和 CRM 记录正确

### Task G：创建 /api/inquiry 路由

- **任务目标**：实现产品询盘 API 端点
- **主要步骤**：
  1. 创建 `src/app/api/inquiry/route.ts`
  2. 实现 POST 处理，调用 `processLead({ type: 'product', ... })`
  3. 添加速率限制
  4. 返回标准响应
- **验收标准**：
  - API 可接收 POST 请求
  - 返回正确的 HTTP 状态码

### Task H：创建 InquiryDrawer 组件

- **任务目标**：实现产品询盘的右侧 Drawer 容器
- **主要步骤**：
  1. 创建 `src/components/products/inquiry-drawer.tsx`
  2. 固定头部：产品缩略图 + 名称 + SKU
  3. 滚动主体：ProductInquiryForm
  4. 动画：右侧滑入
- **验收标准**：
  - Drawer 可正常打开/关闭
  - 产品上下文正确显示

### Task I：创建 ProductActions CTA 组件

- **任务目标**：实现产品页 CTA 按钮 + Sticky 逻辑
- **主要步骤**：
  1. 创建 `src/components/products/product-actions.tsx`
  2. 主 CTA 按钮（"Request for Quotation"）
  3. Sticky 底部栏（Intersection Observer 触发）
  4. 集成 InquiryDrawer
- **验收标准**：
  - 按钮点击打开 Drawer
  - 滚动时 Sticky 栏正确显示/隐藏

### Task J：修改 ProductInquiryForm 接入真实 API

- **任务目标**：将 demo 实现替换为真实 API 调用
- **主要步骤**：
  1. 修改 `handleSubmit` 调用 `/api/inquiry`
  2. 更新字段：移除 phone/targetPrice，保留 quantity
  3. 添加 marketingConsent 复选框
  4. 实现成功状态 UI
- **验收标准**：
  - 表单可成功提交
  - 成功/错误状态正确显示

### Task K：完善 /api/subscribe 集成

- **任务目标**：订阅 API 接入 processLead
- **主要步骤**：
  1. 修改调用 `processLead({ type: 'newsletter', ... })`
  2. 移除模拟延迟
  3. 添加 newsletterSchema 验证
- **验收标准**：
  - API 返回真实结果
  - 邮件发送或 CRM 记录成功

### Task L：创建 BlogNewsletter 组件

- **任务目标**：实现博客页邮箱订阅区块
- **主要步骤**：
  1. 创建 `src/components/blog/blog-newsletter.tsx`
  2. B2B 风格文案
  3. 邮箱输入 + 订阅按钮
  4. 成功/错误状态
- **验收标准**：
  - 组件可正常渲染
  - 订阅成功后显示确认

### Task M：修改联系表单 UI

- **任务目标**：联系表单字段调整
- **主要步骤**：
  1. Name 字段：firstName + lastName → 单个 fullName
  2. 移除 phone 字段
  3. Subject 改为下拉选择（4个选项）
  4. 更新表单配置和验证
  5. 更新 i18n 翻译
- **验收标准**：
  - 新字段正常工作
  - 表单提交成功

### Task N：编写单元测试

- **任务目标**：为新增模块编写测试
- **主要步骤**：
  1. `lead-schema.test.ts` - 三种类型验证
  2. `utils.test.ts` - splitName 边界情况
  3. `process-lead.test.ts` - 成功/失败路径
  4. `route.test.ts` - API 响应
  5. 组件测试
- **验收标准**：
  - `pnpm test` 全部通过
  - 核心逻辑覆盖率 ≥ 80%

---

## 8. 技术实施细节（Implementation Details）

### 8.1 文件级改动清单

| 序号 | 文件路径 | 类型 | 改动内容 |
|-----|---------|------|---------|
| 1 | `src/lib/lead-pipeline/lead-schema.ts` | 新增 | 统一 Lead Schema |
| 2 | `src/lib/lead-pipeline/utils.ts` | 新增 | splitName 等工具 |
| 3 | `src/lib/lead-pipeline/process-lead.ts` | 新增 | 统一业务处理函数 |
| 4 | `src/lib/lead-pipeline/index.ts` | 新增 | 模块导出 |
| 5 | `src/lib/resend-core.ts` | 修改 | 新增 sendProductInquiryEmail |
| 6 | `src/lib/airtable/service.ts` | 修改 | 新增 createLead 方法 |
| 7 | `src/app/api/contact/route.ts` | 修改 | 迁移到 processLead |
| 8 | `src/app/api/contact/contact-api-validation.ts` | 修改 | 适配新 schema |
| 9 | `src/app/api/inquiry/route.ts` | 新增 | 产品询盘 API |
| 10 | `src/app/api/subscribe/route.ts` | 修改 | 接入 processLead |
| 11 | `src/components/products/inquiry-drawer.tsx` | 新增 | Drawer 容器 |
| 12 | `src/components/products/product-actions.tsx` | 新增 | CTA + Sticky |
| 13 | `src/components/products/product-inquiry-form.tsx` | 修改 | 接入真实 API |
| 14 | `src/components/blog/blog-newsletter.tsx` | 新增 | 博客订阅 |
| 15 | `src/components/forms/contact-form-container.tsx` | 修改 | 字段调整 |
| 16 | `src/config/contact-form-config.ts` | 修改 | 字段配置 |
| 17 | `src/app/[locale]/products/[slug]/page.tsx` | 修改 | 集成 ProductActions |

### 8.2 核心接口定义

```typescript
// src/lib/lead-pipeline/lead-schema.ts
import { z } from 'zod';

const baseLead = z.object({
  type: z.enum(['contact', 'product', 'newsletter']),
  fullName: z.string().trim().min(1).max(100).optional(),
  email: z.string().email().max(254),
  company: z.string().trim().max(200).optional(),
  marketingConsent: z.boolean().optional(),
});

const contactLead = baseLead.extend({
  type: z.literal('contact'),
  fullName: z.string().trim().min(1).max(100),
  subject: z.enum(['product_inquiry', 'distributor', 'oem_odm', 'other']),
  message: z.string().trim().min(10).max(5000),
  turnstileToken: z.string().min(1),
});

const productLead = baseLead.extend({
  type: z.literal('product'),
  fullName: z.string().trim().min(1).max(100),
  productSlug: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  quantity: z.union([z.string(), z.coerce.number().positive()]),
  requirements: z.string().trim().max(2000).optional(),
});

const newsletterLead = baseLead.extend({
  type: z.literal('newsletter'),
});

export const leadSchema = z.discriminatedUnion('type', [
  contactLead,
  productLead,
  newsletterLead,
]);

export type LeadInput = z.infer<typeof leadSchema>;
```

```typescript
// src/lib/lead-pipeline/process-lead.ts
export interface LeadResult {
  success: boolean;
  emailSent: boolean;
  recordCreated: boolean;
  referenceId?: string;
  error?: 'VALIDATION_ERROR' | 'PROCESSING_FAILED' | string;
}

export async function processLead(rawInput: unknown): Promise<LeadResult>;
```

### 8.3 架构 & 风格约束

- 保持 RSC 与 Client Component 边界
- 不新增 `any`
- 不引入新的全局单例
- 遵守 i18n 规范（所有用户可见文本使用翻译键）
- 遵守日志规范（logger.info/warn/error）
- 遵守安全规范（输入验证、敏感数据处理）

---

## 9. 质量与验证策略（Quality & Verification）

### 9.1 需要运行的命令

```bash
pnpm type-check        # TypeScript 检查
pnpm lint:check        # ESLint 检查
pnpm test              # 单元测试
pnpm build             # 生产构建
```

### 9.2 验收指标

- TypeScript：零错误
- ESLint：零 error/warning
- 测试：全部通过，新增代码覆盖率 ≥ 80%
- 构建：成功完成
- API：
  - `/api/contact` 正常响应（通过 processLead）
  - `/api/inquiry` 正常响应
  - `/api/subscribe` 正常响应
  - 邮件发送成功（Resend）
  - CRM 记录创建（Airtable）

### 9.3 测试要求

| 测试文件 | 覆盖场景 |
|---------|---------|
| `lead-schema.test.ts` | 三种类型验证、边界情况 |
| `utils.test.ts` | splitName 各种姓名格式 |
| `process-lead.test.ts` | 成功路径、部分失败、全部失败 |
| `inquiry-route.test.ts` | 400/500/200 响应 |
| `inquiry-drawer.test.tsx` | 打开/关闭、产品信息显示 |

---

## 10. 风险、回滚与注意事项（Risks & Rollback）

### 10.1 风险清单

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| 联系表单迁移失败 | 核心功能不可用 | 保持旧逻辑可回滚 |
| Airtable 字段不存在 | 记录创建失败 | 先确认表结构 |
| Resend 配额耗尽 | 邮件发送失败 | "至少一个成功"策略 |
| Spam 攻击（无 Turnstile） | 产品询盘被滥用 | 速率限制 + 后续添加 Turnstile |
| 并发请求超时 | 响应慢 | 添加超时包裹 |

### 10.2 回滚策略

关键切换点文件：
- `src/app/api/contact/route.ts` - 联系表单迁移
- `src/lib/lead-pipeline/process-lead.ts` - 核心逻辑

回滚命令：
```bash
git revert <commit-hash>
```

### 10.3 注意事项

- 禁止绕过 Lefthook / CI（不使用 `--no-verify`）
- 联系表单迁移需分步进行，确保可回滚
- 产品询盘暂不启用 Turnstile（后续 Phase 按需添加）
- WhatsApp 保持现有行为

---

## 11. 协作与交接说明（For Developers & AI）

### 11.1 给人类开发者的说明

**执行顺序建议：**
1. Phase 1 先行（Task A → F）：后端统一
2. Phase 2 跟进（Task G → J）：产品询盘
3. Phase 3 收尾（Task K → M）：博客订阅 + 联系表单 UI
4. Task N 贯穿全程：边开发边写测试

**进度记录：**
在本文件末尾追加 Changelog。

**需额外 Review 的改动：**
- `processLead` 核心逻辑
- 联系表单迁移
- Airtable 字段映射

### 11.2 给 AI Agent / Claude Code 的执行指引

**开始实现前必须阅读：**
- 本规划文档
- `agent_docs/architecture.md`
- `agent_docs/coding-standards.md`
- `agent_docs/security.md`

**允许改动的文件范围：**
- `src/lib/lead-pipeline/`（新增）
- `src/lib/resend-core.ts`（修改）
- `src/lib/airtable/service.ts`（修改）
- `src/app/api/contact/`（修改）
- `src/app/api/inquiry/`（新增）
- `src/app/api/subscribe/route.ts`（修改）
- `src/components/products/`（新增/修改）
- `src/components/blog/`（新增）
- `src/components/forms/`（修改）
- `src/config/contact-form-config.ts`（修改）
- 对应测试文件（新增）
- i18n 翻译文件（新增键）

**禁止触碰的模块：**
- `src/i18n/routing.ts`
- `src/app/[locale]/layout.tsx`（除非集成必要）

**必须执行的命令：**
```bash
pnpm type-check && pnpm lint:check && pnpm test && pnpm build
```

**交付物检查清单：**
- [ ] 代码改动完成
- [ ] 新增测试通过
- [ ] i18n 翻译键添加
- [ ] 本规划文件 Changelog 更新

---

## Changelog

| 日期 | 版本 | 变更内容 | 作者 |
|-----|------|---------|------|
| 2024-12-04 | v1.0 | 初始规划文档 | Claude + Codex + Gemini |
| 2024-12-04 | v2.0 | 根据讨论修正：方案 B 统一处理、字段调整、CTA 交互确认 | Claude + Codex + Gemini |
| 2024-12-04 | v3.0 | **全部实现完成** - Task A-N 全部通过，质量门禁全绿 | Claude Code |

### 实现完成清单

- [x] **Task A**: 创建统一 Lead Schema（`src/lib/lead-pipeline/lead-schema.ts`）
- [x] **Task B**: 实现 splitName 工具函数（`src/lib/lead-pipeline/utils.ts`）
- [x] **Task C**: 实现 processLead 业务函数（`src/lib/lead-pipeline/process-lead.ts`）
- [x] **Task D**: 扩展 ResendService 支持产品询盘邮件（`src/lib/resend-core.ts`）
- [x] **Task E**: 扩展 AirtableService 统一记录创建（`src/lib/airtable/service.ts`）
- [x] **Task F**: 迁移联系表单到 processLead（`src/app/api/contact/route.ts`）
- [x] **Task G**: 创建 /api/inquiry 路由（`src/app/api/inquiry/route.ts`）
- [x] **Task H**: 创建 InquiryDrawer 组件（`src/components/products/inquiry-drawer.tsx`）
- [x] **Task I**: 创建 ProductActions CTA 组件（`src/components/products/product-actions.tsx`）
- [x] **Task J**: 修改 ProductInquiryForm 接入真实 API
- [x] **Task K**: 完善 /api/subscribe 集成
- [x] **Task L**: 创建 BlogNewsletter 组件（`src/components/blog/blog-newsletter.tsx`）
- [x] **Task M**: 修改联系表单 UI（禁用 phone 字段）
- [x] **Task N**: 编写单元测试（64 个新增测试，全部通过）

### 质量验证结果

- TypeScript: ✓ 零错误
- ESLint: ✓ 零 warning
- 测试: ✓ 4773 passed
- 构建: ✓ 成功
