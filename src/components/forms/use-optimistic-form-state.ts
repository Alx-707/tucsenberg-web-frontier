'use client';

import { useOptimistic } from 'react';
import { type FormSubmissionStatus } from '@/lib/validations';

/**
 * 乐观更新状态类型
 */
export interface OptimisticFormState {
  status: FormSubmissionStatus;
  message?: string;
  timestamp?: number;
}

const initialOptimisticState: OptimisticFormState = {
  status: 'idle' as FormSubmissionStatus,
  message: '',
  timestamp: 0,
};

/**
 * 乐观状态更新器函数
 * 使用显式字段合并代替对象展开，防止 object-injection 类模式
 */
function optimisticReducer(
  currentState: OptimisticFormState,
  optimisticValue: OptimisticFormState,
): OptimisticFormState {
  const nextState: OptimisticFormState = {
    status: currentState.status,
    timestamp: Date.now(),
  };

  if (currentState.message !== undefined) {
    nextState.message = currentState.message;
  }

  if ('status' in optimisticValue) {
    nextState.status = optimisticValue.status;
  }
  if ('message' in optimisticValue && optimisticValue.message !== undefined) {
    nextState.message = optimisticValue.message;
  }

  return nextState;
}

/**
 * 管理表单的乐观更新状态
 * 使用 React 19 原生 useOptimistic Hook
 */
export function useOptimisticFormState() {
  const [optimisticState, setOptimisticState] = useOptimistic(
    initialOptimisticState,
    optimisticReducer,
  );

  return {
    optimisticState,
    setOptimisticState,
    optimisticMessage: optimisticState.message,
  };
}
