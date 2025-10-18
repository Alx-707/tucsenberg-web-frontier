/**
 * 表单和状态动画组件
 */

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// 5. 进度条动画
export const AnimatedProgress = ({
  value,
  className,
}: {
  value: number;
  className?: string;
}) => (
  <div className={cn('space-y-3', className)}>
    <div className='bg-secondary relative h-4 w-full overflow-hidden rounded-full transition-all duration-1000 ease-out'>
      <div
        className='bg-primary h-full transition-all duration-1000 ease-out'
        style={{ width: `${value}%` }}
      />
    </div>
    <div className='text-muted-foreground flex justify-between text-xs'>
      <span className='animate-in fade-in duration-500'>开始</span>
      <span className='animate-in fade-in text-primary font-medium duration-700'>
        {value}%
      </span>
      <span className='animate-in fade-in duration-500'>完成</span>
    </div>
  </div>
);

// 6. 表单输入动画
export const AnimatedInput = ({
  className,
  ...props
}: React.ComponentProps<'input'>) => (
  <input
    className={cn(
      'border-input bg-background flex h-10 w-full rounded-md border px-3 py-2',
      'ring-offset-background text-sm file:border-0 file:bg-transparent',
      'placeholder:text-muted-foreground file:text-sm file:font-medium',
      'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
      'focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      // 动画增强
      'transition-all duration-200 ease-out',
      'focus:ring-primary/20 focus:border-primary/50 focus:ring-2',
      'hover:border-primary/30',
      'focus:scale-[1.02] focus:shadow-sm',
      className,
    )}
    {...props}
  />
);

// 7. 成功状态动画
export const AnimatedSuccess = ({ message }: { message: string }) => (
  <div className='animate-in fade-in slide-in-from-bottom-2 flex items-center justify-center gap-2 text-green-600 duration-500'>
    <CheckCircle className='animate-in zoom-in h-5 w-5 delay-200 duration-300' />
    <span className='animate-in fade-in delay-300 duration-500'>{message}</span>
  </div>
);
