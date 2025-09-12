/**
 * 社交和交互动画组件
 */

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import React from 'react';

// 8. 社交链接动画
export const AnimatedSocialLink = ({
  icon: Icon,
  href,
  label
}: {
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  label: string
}) => (
  <Button
    variant="ghost"
    size="sm"
    asChild
    className="h-9 w-9 rounded-full
               hover:bg-primary/10 hover:scale-110
               transition-all duration-200 ease-out
               hover:shadow-md hover:shadow-primary/20"
  >
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
    >
      <Icon className="h-4 w-4 transition-transform duration-200
                       group-hover:rotate-12" />
    </a>
  </Button>
);

// 9. 可折叠内容动画
export const AnimatedCollapsible = ({
  isOpen,
  children
}: {
  isOpen: boolean;
  children: React.ReactNode
}) => (
  <div className={cn(
    "overflow-hidden transition-all duration-300 ease-out",
    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
  )}>
    <div className={cn(
      "transition-transform duration-300 ease-out",
      isOpen ? "translate-y-0" : "-translate-y-4"
    )}>
      {children}
    </div>
  </div>
);

// 10. 骨架屏动画
export const AnimatedSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("space-y-3", className)}>
    <Skeleton className="h-4 w-[250px] animate-pulse" />
    <Skeleton className="h-4 w-[200px] animate-pulse delay-75" />
    <Skeleton className="h-4 w-[150px] animate-pulse delay-150" />
  </div>
);
