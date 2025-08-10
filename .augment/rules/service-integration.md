---
type: "auto"
description: "Service integration guidelines: Resend email delivery, Vercel Analytics, state management (Zustand/Redux Toolkit), API route patterns, error handling"
---

# Service Integration Guidelines

## Email Service Integration

### Resend API Integration

- Call the **Resend** API inside API routes to send emails
- Manage email templates as standalone React components
- Implement proper error handling and retry logic
- Use environment variables for API keys and configuration

#### Resend Setup and Configuration

```typescript
// src/lib/resend.ts
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'noreply@example.com',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@example.com',
} as const;
```

#### Email Template Components

```typescript
// src/components/emails/ContactFormEmail.tsx
import { Html, Head, Body, Container, Text, Button } from '@react-email/components';

interface ContactFormEmailProps {
  name: string;
  email: string;
  message: string;
  submittedAt: string;
}

export function ContactFormEmail({ name, email, message, submittedAt }: ContactFormEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
          <Text style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
            New Contact Form Submission
          </Text>
          <Text><strong>Name:</strong> {name}</Text>
          <Text><strong>Email:</strong> {email}</Text>
          <Text><strong>Submitted:</strong> {submittedAt}</Text>
          <Text style={{ marginTop: '20px' }}>
            <strong>Message:</strong>
          </Text>
          <Text style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '5px',
            whiteSpace: 'pre-wrap'
          }}>
            {message}
          </Text>
          <Button
            href={`mailto:${email}`}
            style={{
              backgroundColor: '#007ee6',
              color: 'white',
              padding: '12px 20px',
              textDecoration: 'none',
              borderRadius: '5px',
              marginTop: '20px'
            }}
          >
            Reply to {name}
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
```

#### API Route Implementation

```typescript
// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { resend, EMAIL_CONFIG } from '@/lib/resend';
import { ContactFormEmail } from '@/components/emails/ContactFormEmail';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(1000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message } = contactSchema.parse(body);

    const emailData = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [EMAIL_CONFIG.replyTo],
      replyTo: email,
      subject: `Contact Form: ${name}`,
      react: ContactFormEmail({
        name,
        email,
        message,
        submittedAt: new Date().toISOString(),
      }),
    });

    return NextResponse.json({ 
      success: true, 
      messageId: emailData.data?.id 
    });

  } catch (error) {
    console.error('Contact form error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid form data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
```

## Analytics Integration

### Vercel Analytics Setup

- Initialize **Vercel Analytics** in the layout component for performance monitoring
- Track key business events with **Vercel Analytics** custom events
- Implement privacy-compliant analytics tracking

```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Custom Event Tracking

```typescript
// src/lib/analytics.ts
import { track } from '@vercel/analytics';

export const trackEvent = {
  contactFormSubmit: (success: boolean) => {
    track('contact_form_submit', { success });
  },
  
  downloadResource: (resourceName: string) => {
    track('resource_download', { resource: resourceName });
  },
  
  pageView: (page: string, locale: string) => {
    track('page_view', { page, locale });
  },
  
  searchQuery: (query: string, resultsCount: number) => {
    track('search', { query, results: resultsCount });
  },
};

// Usage in components
function ContactForm() {
  const handleSubmit = async (data: FormData) => {
    try {
      await submitForm(data);
      trackEvent.contactFormSubmit(true);
    } catch (error) {
      trackEvent.contactFormSubmit(false);
    }
  };
}
```

## State Management

### Zustand for Lightweight State

- Recommend **Zustand** for lightweight state management
- Use **Redux Toolkit** for complex scenarios
- Implement proper TypeScript integration

```typescript
// src/store/contact-form.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ContactFormState {
  isSubmitting: boolean;
  lastSubmission: Date | null;
  setSubmitting: (submitting: boolean) => void;
  setLastSubmission: (date: Date) => void;
  canSubmit: () => boolean;
}

export const useContactFormStore = create<ContactFormState>()(
  devtools(
    (set, get) => ({
      isSubmitting: false,
      lastSubmission: null,
      
      setSubmitting: (submitting) => set({ isSubmitting: submitting }),
      
      setLastSubmission: (date) => set({ lastSubmission: date }),
      
      canSubmit: () => {
        const { isSubmitting, lastSubmission } = get();
        if (isSubmitting) return false;
        
        // Prevent spam: allow submission only once per minute
        if (lastSubmission) {
          const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
          return lastSubmission < oneMinuteAgo;
        }
        
        return true;
      },
    }),
    { name: 'contact-form-store' }
  )
);
```

### Redux Toolkit for Complex State

```typescript
// src/store/app-store.ts
import { configureStore } from '@reduxjs/toolkit';
import { userSlice } from './slices/user-slice';
import { notificationSlice } from './slices/notification-slice';

export const store = configureStore({
  reducer: {
    user: userSlice.reducer,
    notifications: notificationSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## API Route Patterns

### Standard API Response Format

```typescript
// src/types/api.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: any;
  code?: string;
}
```

### Error Handling Middleware

```typescript
// src/lib/api-error-handler.ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: error.errors,
      },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Internal server error',
    },
    { status: 500 }
  );
}
```

### Rate Limiting Implementation

```typescript
// src/lib/rate-limit.ts
import { NextRequest } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  request: NextRequest,
  limit: number = 10,
  windowMs: number = 60 * 1000 // 1 minute
): boolean {
  const ip = request.ip || 'anonymous';
  const now = Date.now();
  const windowStart = now - windowMs;

  const current = rateLimitMap.get(ip);

  if (!current || current.resetTime < windowStart) {
    rateLimitMap.set(ip, { count: 1, resetTime: now });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count++;
  return true;
}

// Usage in API routes
export async function POST(request: NextRequest) {
  if (!rateLimit(request, 5, 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // Process request...
}
```

## Environment Configuration

### Service Configuration Validation

```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email(),
  EMAIL_REPLY_TO: z.string().email(),
  NEXT_PUBLIC_BASE_URL: z.string().url(),
  VERCEL_ANALYTICS_ID: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

### Service Health Checks

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';

export async function GET() {
  const checks = {
    resend: false,
    database: false,
    timestamp: new Date().toISOString(),
  };

  try {
    // Check Resend service
    await resend.domains.list();
    checks.resend = true;
  } catch (error) {
    console.error('Resend health check failed:', error);
  }

  const allHealthy = Object.values(checks).every(check => 
    typeof check === 'boolean' ? check : true
  );

  return NextResponse.json(
    { healthy: allHealthy, checks },
    { status: allHealthy ? 200 : 503 }
  );
}
```
