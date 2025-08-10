import React from 'react';

/**
 * 加载状态组件
 * 显示TinaCMS初始化时的加载动画
 */
export function LoadingState() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='text-center'>
        <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
        <p className='text-gray-600'>Initializing TinaCMS...</p>
      </div>
    </div>
  );
}

/**
 * 警告图标组件
 * 用于显示配置警告信息
 */
export function WarningIcon() {
  return (
    <svg
      className='h-5 w-5 text-yellow-400'
      viewBox='0 0 20 20'
      fill='currentColor'
    >
      <path
        fillRule='evenodd'
        d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
        clipRule='evenodd'
      />
    </svg>
  );
}

/**
 * 成功图标组件
 * 用于显示配置成功状态
 */
export function SuccessIcon() {
  return (
    <svg
      className='h-5 w-5 text-green-400'
      viewBox='0 0 20 20'
      fill='currentColor'
    >
      <path
        fillRule='evenodd'
        d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
        clipRule='evenodd'
      />
    </svg>
  );
}

/**
 * 设置步骤组件属性接口
 */
export interface StepComponentProps {
  stepNumber: number;
  title: string;
  children: React.ReactNode;
}

/**
 * 设置步骤组件
 * 用于显示配置步骤信息
 */
export function SetupStep({ stepNumber, title, children }: StepComponentProps) {
  return (
    <div className='flex items-start space-x-3'>
      <div className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100'>
        <span className='text-sm font-medium text-blue-600'>{stepNumber}</span>
      </div>
      <div>
        <h3 className='font-medium'>{title}</h3>
        {children}
      </div>
    </div>
  );
}

/**
 * 服务信息组件
 * 用于显示TinaCMS服务相关信息
 */
export function ServiceInfo({ stepNumber, title, children }: StepComponentProps) {
  return (
    <div className='flex items-start space-x-3'>
      <div className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100'>
        <span className='text-sm font-medium text-blue-600'>{stepNumber}</span>
      </div>
      <div>
        <h3 className='font-medium'>{title}</h3>
        {children}
      </div>
    </div>
  );
}
