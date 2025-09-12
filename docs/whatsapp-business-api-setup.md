# WhatsApp Business API 配置指导

## 📋 概述

本文档提供完整的WhatsApp Business API配置指导，包括Meta开发者账号设置、应用创建、Webhook配置、测试步骤等详细操作指南。

## 🎯 前置要求

### 必需条件
- Meta开发者账号
- 有效的Facebook Business Manager账号
- 已验证的电话号码
- HTTPS域名（用于Webhook）
- 服务器环境（支持Node.js）

### 技术要求
- Node.js 18+
- Next.js 15+
- HTTPS SSL证书
- 公网可访问的服务器

## 🚀 第一步：Meta开发者账号设置

### 1.1 创建Meta开发者账号

1. 访问 [Meta for Developers](https://developers.facebook.com/)
2. 点击"开始使用"或"Get Started"
3. 使用Facebook账号登录
4. 完成开发者账号验证：
   - 提供手机号码验证
   - 接受开发者条款
   - 完成身份验证

### 1.2 创建应用

1. 在开发者控制台点击"创建应用"
2. 选择应用类型：**"Business"**
3. 填写应用信息：
   ```
   应用名称: [您的应用名称]
   应用联系邮箱: [您的邮箱]
   Business Manager账号: [选择您的Business Manager]
   ```
4. 点击"创建应用"

### 1.3 添加WhatsApp产品

1. 在应用控制台中，点击"添加产品"
2. 找到"WhatsApp"产品，点击"设置"
3. 选择Business Manager账号
4. 完成WhatsApp Business API设置

## 🔧 第二步：WhatsApp Business API配置

### 2.1 获取访问令牌

1. 在WhatsApp产品页面，进入"API设置"
2. 记录以下信息：
   ```
   应用ID: [您的应用ID]
   应用密钥: [您的应用密钥]
   访问令牌: [临时访问令牌]
   电话号码ID: [测试电话号码ID]
   WhatsApp Business账号ID: [WABA ID]
   ```

### 2.2 配置环境变量

在项目根目录创建 `.env.local` 文件：

```bash
# WhatsApp Business API 配置
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id_here
WHATSAPP_APP_ID=your_app_id_here
WHATSAPP_APP_SECRET=your_app_secret_here

# Webhook 配置
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_custom_verify_token_here
WHATSAPP_WEBHOOK_URL=https://yourdomain.com/api/webhooks/whatsapp
```

### 2.3 创建API路由

创建 `src/app/api/whatsapp/send/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json();

    const response = await fetch(
      `${WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: message
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to send message');
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('WhatsApp API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

## 🔗 第三步：Webhook配置

### 3.1 创建Webhook端点

创建 `src/app/api/webhooks/whatsapp/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Webhook验证
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    return new NextResponse(challenge);
  }

  return new NextResponse('Forbidden', { status: 403 });
}

// 接收Webhook消息
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // 验证签名
    if (!verifySignature(body, signature)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const data = JSON.parse(body);

    // 处理WhatsApp消息
    if (data.object === 'whatsapp_business_account') {
      data.entry?.forEach((entry: any) => {
        entry.changes?.forEach((change: any) => {
          if (change.field === 'messages') {
            const messages = change.value.messages;
            messages?.forEach((message: any) => {
              console.log('Received message:', message);
              // 在这里处理接收到的消息
            });
          }
        });
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.WHATSAPP_APP_SECRET!)
    .update(body)
    .digest('hex');

  return signature === `sha256=${expectedSignature}`;
}
```

### 3.2 在Meta控制台配置Webhook

1. 在WhatsApp产品页面，进入"Webhook"设置
2. 填写Webhook配置：
   ```
   回调URL: https://yourdomain.com/api/webhooks/whatsapp
   验证令牌: [您在环境变量中设置的WHATSAPP_WEBHOOK_VERIFY_TOKEN]
   ```
3. 点击"验证并保存"
4. 订阅以下字段：
   - `messages`
   - `message_deliveries`
   - `message_reads`

## 🧪 第四步：测试配置

### 4.1 发送测试消息

创建测试页面 `src/app/whatsapp-test/page.tsx`：

```typescript
'use client';

import { useState } from 'react';

export default function WhatsAppTest() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const sendMessage = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          message: message,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">WhatsApp API 测试</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            电话号码 (包含国家代码)
          </label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="例如: 8613800138000"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            消息内容
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="输入要发送的消息"
            className="w-full p-2 border rounded h-24"
          />
        </div>

        <button
          onClick={sendMessage}
          disabled={loading || !phoneNumber || !message}
          className="w-full bg-green-600 text-white p-2 rounded disabled:opacity-50"
        >
          {loading ? '发送中...' : '发送消息'}
        </button>

        {result && (
          <div className="mt-4 p-4 border rounded">
            <h3 className="font-medium mb-2">结果:</h3>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 4.2 测试步骤

1. 启动开发服务器：`pnpm dev`
2. 访问 `http://localhost:3000/whatsapp-test`
3. 输入测试电话号码（必须是已验证的号码）
4. 输入测试消息
5. 点击"发送消息"
6. 检查返回结果

## 🔒 第五步：生产环境配置

### 5.1 获取永久访问令牌

1. 在Meta Business Manager中创建系统用户
2. 为系统用户分配WhatsApp Business管理权限
3. 生成永久访问令牌
4. 更新环境变量中的访问令牌

### 5.2 电话号码验证

1. 在WhatsApp Business API设置中添加电话号码
2. 完成电话号码验证流程
3. 更新环境变量中的电话号码ID

### 5.3 安全配置

1. 启用IP白名单（如果需要）
2. 配置Webhook签名验证
3. 设置访问令牌权限范围
4. 定期轮换访问令牌

## 📚 常见问题

### Q1: Webhook验证失败
**解决方案**:
- 确保Webhook URL可公网访问
- 检查验证令牌是否正确
- 确认HTTPS证书有效

### Q2: 消息发送失败
**解决方案**:
- 检查访问令牌是否有效
- 确认电话号码格式正确（包含国家代码）
- 验证电话号码是否已添加到测试列表

### Q3: 接收不到Webhook消息
**解决方案**:
- 检查Webhook订阅字段
- 确认签名验证逻辑正确
- 查看服务器日志排查错误

## 🔗 相关资源

- [WhatsApp Business API 官方文档](https://developers.facebook.com/docs/whatsapp)
- [Meta for Developers](https://developers.facebook.com/)
- [WhatsApp Business API 定价](https://developers.facebook.com/docs/whatsapp/pricing)
- [API参考文档](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account)

## 🚀 高级功能配置

### 模板消息

创建 `src/app/api/whatsapp/template/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { to, templateName, languageCode, parameters } = await request.json();

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: languageCode
            },
            components: parameters ? [{
              type: 'body',
              parameters: parameters.map((param: string) => ({
                type: 'text',
                text: param
              }))
            }] : undefined
          }
        })
      }
    );

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### 媒体消息支持

```typescript
// 发送图片消息
export async function sendImageMessage(to: string, imageUrl: string, caption?: string) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'image',
        image: {
          link: imageUrl,
          caption: caption
        }
      })
    }
  );

  return response.json();
}
```

## 🛠️ 故障排除

### 常见错误代码

| 错误代码 | 描述 | 解决方案 |
|---------|------|----------|
| 100 | 无效参数 | 检查请求参数格式 |
| 131000 | 收件人不可用 | 确认电话号码有效且已注册WhatsApp |
| 131005 | 消息发送失败 | 检查消息内容和格式 |
| 131008 | 用户选择退出 | 用户已屏蔽或退出接收消息 |
| 131047 | 重新验证访问令牌 | 访问令牌已过期，需要重新获取 |

### 调试技巧

1. **启用详细日志**：
```typescript
// 在API路由中添加详细日志
console.log('Request payload:', JSON.stringify(payload, null, 2));
console.log('Response:', JSON.stringify(response, null, 2));
```

2. **使用Graph API Explorer**：
   - 访问 [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
   - 测试API调用和参数

3. **监控Webhook状态**：
```typescript
// 添加Webhook状态监控
export async function POST(request: NextRequest) {
  console.log('Webhook received:', new Date().toISOString());
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  // ... 其他处理逻辑
}
```

## 📊 监控和分析

### 消息状态跟踪

```typescript
// 处理消息状态更新
function handleMessageStatus(status: any) {
  const { id, status: messageStatus, timestamp, recipient_id } = status;

  switch (messageStatus) {
    case 'sent':
      console.log(`Message ${id} sent to ${recipient_id}`);
      break;
    case 'delivered':
      console.log(`Message ${id} delivered to ${recipient_id}`);
      break;
    case 'read':
      console.log(`Message ${id} read by ${recipient_id}`);
      break;
    case 'failed':
      console.error(`Message ${id} failed to send to ${recipient_id}`);
      break;
  }
}
```

### 性能监控

```typescript
// API响应时间监控
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // API调用逻辑
    const result = await sendWhatsAppMessage(data);

    const duration = Date.now() - startTime;
    console.log(`WhatsApp API call completed in ${duration}ms`);

    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`WhatsApp API call failed after ${duration}ms:`, error);
    throw error;
  }
}
```

## 📝 更新日志

- **v1.0.0** (2025-01-01): 初始版本，包含基础配置指导
- **v1.1.0** (2025-01-01): 添加高级功能配置（模板消息、媒体消息等）
- **v1.2.0** (2025-01-01): 添加故障排除和监控功能
