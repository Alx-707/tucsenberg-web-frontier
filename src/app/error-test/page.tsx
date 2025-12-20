'use client';

import { useState } from 'react';
import * as Sentry from '@/lib/sentry-client';

/**
 * Sentry错误测试页面
 *
 * 提供完整的Sentry错误监控系统测试界面，包括：
 * - 客户端错误触发和捕获
 * - API错误模拟和处理
 * - 用户上下文设置
 * - 面包屑追踪功能
 * - 未处理错误演示
 *
 * 用于验证Sentry集成的正确性和错误监控的有效性
 */

// Types
/** 错误类型枚举 */
type ErrorType = 'none' | 'client' | 'api' | 'breadcrumb' | 'user';

interface ErrorState {
  type: ErrorType;
  message: string;
}

// Custom hooks
function useErrorTesting() {
  const [errorState, setErrorState] = useState<ErrorState>({
    type: 'none',
    message: '',
  });

  const triggerClientError = () => {
    try {
      throw new Error('This is a test client-side error');
    } catch (error) {
      if (error instanceof Error) {
        Sentry.captureException(error);
        setErrorState({ type: 'client', message: error.message });
      }
    }
  };

  const triggerApiError = async () => {
    try {
      const response = await fetch('/api/non-existent-endpoint');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        Sentry.captureException(error);
        setErrorState({ type: 'api', message: error.message });
      }
    }
  };

  const triggerUnhandledError = () => {
    const obj: unknown = null;
    (obj as { nonExistentMethod: () => void }).nonExistentMethod();
  };

  const addBreadcrumb = () => {
    Sentry.addBreadcrumb({
      category: 'ui',
      message: 'User clicked breadcrumb button',
      level: 'info',
    });
    setErrorState({
      type: 'breadcrumb',
      message: 'Breadcrumb added - now trigger an error to see it in Sentry',
    });
  };

  const setUserContext = () => {
    Sentry.setUser({
      id: 'test-user-123',
      email: 'test@example.com',
      username: 'testuser',
    });
    setErrorState({
      type: 'user',
      message: 'User context set - now trigger an error to see it in Sentry',
    });
  };

  return {
    errorState,
    triggerClientError,
    triggerApiError,
    triggerUnhandledError,
    addBreadcrumb,
    setUserContext,
  };
}

// Components
interface ErrorButtonsProps {
  onTriggerClientError: () => void;
  onTriggerApiError: () => void;
  onTriggerUnhandledError: () => void;
  onAddBreadcrumb: () => void;
  onSetUserContext: () => void;
}

function ErrorButtons({
  onTriggerClientError,
  onTriggerApiError,
  onTriggerUnhandledError,
  onAddBreadcrumb,
  onSetUserContext,
}: ErrorButtonsProps) {
  return (
    <div className='mb-8 grid grid-cols-1 gap-4 md:grid-cols-2'>
      <button
        onClick={onTriggerClientError}
        className='rounded bg-blue-500 p-4 text-white hover:bg-blue-600'
      >
        Trigger Client Error
      </button>
      <button
        onClick={onTriggerApiError}
        className='rounded bg-purple-500 p-4 text-white hover:bg-purple-600'
      >
        Trigger API Error
      </button>
      <button
        onClick={onTriggerUnhandledError}
        className='rounded bg-red-500 p-4 text-white hover:bg-red-600'
      >
        Trigger Unhandled Error
      </button>
      <button
        onClick={onAddBreadcrumb}
        className='rounded bg-green-500 p-4 text-white hover:bg-green-600'
      >
        Add Breadcrumb
      </button>
      <button
        onClick={onSetUserContext}
        className='rounded bg-yellow-500 p-4 text-white hover:bg-yellow-600'
      >
        Set User Context
      </button>
    </div>
  );
}

function ErrorDisplay({ errorState }: { errorState: ErrorState }) {
  if (errorState.type === 'none') return null;

  const getErrorStyles = (type: ErrorType) => {
    switch (type) {
      case 'client':
        return 'border border-blue-500 bg-blue-100';
      case 'api':
        return 'border border-purple-500 bg-purple-100';
      case 'breadcrumb':
        return 'border border-green-500 bg-green-100';
      case 'user':
        return 'border border-yellow-500 bg-yellow-100';
      case 'none':
      default:
        return 'border border-red-500 bg-red-100';
    }
  };

  const getErrorTitle = (type: ErrorType) => {
    switch (type) {
      case 'client':
        return 'Client Error Triggered';
      case 'api':
        return 'API Error Triggered';
      case 'breadcrumb':
        return 'Breadcrumb Added';
      case 'user':
        return 'User Context Set';
      case 'none':
      default:
        return 'Unhandled Error Triggered';
    }
  };

  return (
    <div className={`mb-4 rounded p-4 ${getErrorStyles(errorState.type)}`}>
      <h2 className='mb-2 text-xl font-semibold'>
        {getErrorTitle(errorState.type)}
      </h2>
      <p className='text-gray-700'>{errorState.message}</p>
      <p className='mt-2 text-sm text-gray-500'>
        Check your Sentry dashboard to see the captured error and context.
      </p>
    </div>
  );
}

function AboutSection() {
  return (
    <div className='mt-8 rounded bg-gray-100 p-4'>
      <h2 className='mb-2 text-xl font-semibold'>About Sentry Integration</h2>
      <p className='mb-2'>
        This page demonstrates how Sentry captures different types of errors and
        context in a Next.js application.
      </p>
      <ul className='list-disc space-y-1 pl-5'>
        <li>Client errors are captured with full stack traces</li>
        <li>API errors show network request details</li>
        <li>Unhandled errors are automatically captured</li>
        <li>Breadcrumbs help trace user actions before an error</li>
        <li>User context associates errors with specific users</li>
      </ul>
    </div>
  );
}

export default function ErrorTestPage() {
  const {
    errorState,
    triggerClientError,
    triggerApiError,
    triggerUnhandledError,
    addBreadcrumb,
    setUserContext,
  } = useErrorTesting();

  return (
    <div className='mx-auto max-w-4xl p-8'>
      <h1 className='mb-6 text-3xl font-bold'>Sentry Error Testing Page</h1>
      <ErrorButtons
        onTriggerClientError={triggerClientError}
        onTriggerApiError={triggerApiError}
        onTriggerUnhandledError={triggerUnhandledError}
        onAddBreadcrumb={addBreadcrumb}
        onSetUserContext={setUserContext}
      />
      <ErrorDisplay errorState={errorState} />
      <AboutSection />
    </div>
  );
}
