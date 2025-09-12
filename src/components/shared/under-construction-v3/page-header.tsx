import { Zap } from 'lucide-react';
import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="space-y-8">
      {/* 状态图标 - 简化版 */}
      <div className="flex justify-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Zap className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* 标题和描述 - 优化版 */}
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl text-foreground">
          {title}
        </h1>

        <p className="mx-auto max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
          {description}
        </p>
      </div>
    </div>
  );
}
