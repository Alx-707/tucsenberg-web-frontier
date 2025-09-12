/**
 * 表单和状态动画组件
 */

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';
import React from 'react';

// 5. 进度条动画
export const AnimatedProgress = ({
  value,
  className
}: {
  value: number;
  className?: string
}) => (
  <div className={cn("space-y-3", className)}>
    <Progress
      value={value}
      className="transition-all duration-1000 ease-out
                 [&>div]:transition-all [&>div]:duration-1000 [&>div]:ease-out"
    />
    <div className="flex justify-between text-xs text-muted-foreground">
      <span className="animate-in fade-in duration-500">开始</span>
      <span className="animate-in fade-in duration-700 font-medium text-primary">
        {value}%
      </span>
      <span className="animate-in fade-in duration-500">完成</span>
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
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
      "text-sm ring-offset-background file:border-0 file:bg-transparent",
      "file:text-sm file:font-medium placeholder:text-muted-foreground",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      // 动画增强
      "transition-all duration-200 ease-out",
      "focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
      "hover:border-primary/30",
      "focus:scale-[1.02] focus:shadow-sm",
      className
    )}
    {...props}
  />
);

// 7. 成功状态动画
export const AnimatedSuccess = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center gap-2 text-green-600
                  animate-in fade-in slide-in-from-bottom-2 duration-500">
    <CheckCircle className="h-5 w-5 animate-in zoom-in duration-300 delay-200" />
    <span className="animate-in fade-in duration-500 delay-300">{message}</span>
  </div>
);
