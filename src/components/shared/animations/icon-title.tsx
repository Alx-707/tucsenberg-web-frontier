/**
 * 图标和标题动画组件
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, Zap } from 'lucide-react';
import React from 'react';

// 1. 主图标动画组合
export const AnimatedHeroIcon = ({ className }: { className?: string }) => (
  <div className={cn("flex justify-center", className)}>
    <div className="relative group cursor-pointer">
      <div className="relative">
        {/* 多层动画效果容器 */}
        <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5
                        flex items-center justify-center
                        group-hover:from-primary/20 group-hover:to-primary/10
                        transition-all duration-500 group-hover:scale-110
                        shadow-lg group-hover:shadow-xl">

          {/* 背景脉冲效果 */}
          <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping" />

          {/* 旋转光环效果 */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/20
                          animate-spin opacity-0 group-hover:opacity-100
                          transition-opacity duration-500"
               style={{ animationDuration: '3s' }} />

          {/* 主图标 */}
          <Zap className="relative h-10 w-10 text-primary
                          animate-pulse group-hover:animate-bounce
                          transition-all duration-300 z-10" />
        </div>

        {/* 状态徽章 */}
        <div className="absolute -top-2 -right-2 animate-in slide-in-from-top-2 duration-700">
          <Badge variant="secondary"
                 className="animate-bounce hover:animate-pulse
                           transition-all duration-200 hover:scale-105
                           shadow-md">
            <Clock className="mr-1 h-3 w-3 animate-spin"
                   style={{ animationDuration: '3s' }} />
            进行中
          </Badge>
        </div>
      </div>
    </div>
  </div>
);

// 2. 渐变文字动画
export const AnimatedTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h1 className={cn(
    "text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl",
    "animate-in fade-in slide-in-from-bottom-4 duration-1000",
    className
  )}>
    <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60
                     bg-clip-text text-transparent
                     animate-pulse hover:from-primary/80 hover:to-primary
                     transition-all duration-500">
      {children}
    </span>
  </h1>
);
