'use client';

import { useCallback, useRef, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { requestIdleCallback } from '@/lib/idle-callback';

// 懒加载 Turnstile 组件（进入视口或空闲时）
const DynamicTurnstile = dynamic(
  () =>
    import('@/components/security/turnstile').then((m) => m.TurnstileWidget),
  {
    ssr: false,
    loading: () => (
      <div
        className='h-12 w-full animate-pulse rounded-md bg-muted'
        aria-hidden='true'
      />
    ),
  },
);

interface LazyTurnstileProps {
  onSuccess: (token: string) => void;
  onError: (reason?: string) => void;
  onExpire: () => void;
  onLoad: () => void;
}

/**
 * 使用 useSyncExternalStore 管理延迟渲染状态
 * 避免在 effect 中初始化状态
 */
function useLazyRender(containerRef: React.RefObject<HTMLDivElement | null>) {
  const shouldRenderRef = useRef(false);
  const subscribersRef = useRef(new Set<() => void>());

  const subscribe = useCallback(
    (callback: () => void) => {
      subscribersRef.current.add(callback);

      // 设置观察器
      const el = containerRef.current;
      if (
        typeof IntersectionObserver !== 'undefined' &&
        el &&
        !shouldRenderRef.current
      ) {
        const io = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting && !shouldRenderRef.current) {
                shouldRenderRef.current = true;
                io.disconnect();
                subscribersRef.current.forEach((cb) => cb());
                break;
              }
            }
          },
          { rootMargin: '200px' },
        );
        io.observe(el);

        return () => {
          subscribersRef.current.delete(callback);
          io.disconnect();
        };
      }

      // 退化：空闲时加载
      const cleanup = requestIdleCallback(
        () => {
          if (!shouldRenderRef.current) {
            shouldRenderRef.current = true;
            subscribersRef.current.forEach((cb) => cb());
          }
        },
        { timeout: 1500 },
      );

      return () => {
        subscribersRef.current.delete(callback);
        cleanup();
      };
    },
    [containerRef],
  );

  const getSnapshot = useCallback(() => shouldRenderRef.current, []);
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * 延迟加载 Turnstile CAPTCHA 组件
 * 优先在进入视口时加载，退化为空闲时加载
 */
export function LazyTurnstile({
  onSuccess,
  onError,
  onExpire,
  onLoad,
}: LazyTurnstileProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shouldRender = useLazyRender(containerRef);

  return (
    <div
      className='space-y-2'
      ref={containerRef}
    >
      {shouldRender ? (
        <DynamicTurnstile
          onSuccess={onSuccess}
          onError={onError}
          onExpire={onExpire}
          onLoad={onLoad}
          className='w-full'
          action='contact_form'
          theme='auto'
          size='normal'
        />
      ) : (
        <div
          className='h-12 w-full animate-pulse rounded-md bg-muted'
          aria-hidden='true'
        />
      )}
    </div>
  );
}
