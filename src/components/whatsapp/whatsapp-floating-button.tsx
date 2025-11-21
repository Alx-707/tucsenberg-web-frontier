'use client';

import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { MessageCircle } from 'lucide-react';
import Draggable from 'react-draggable';

export interface WhatsAppFloatingButtonProps {
  number: string;
  label?: string;
  className?: string;
}

const POSITION_STORAGE_KEY = 'whatsapp-button-position';
const DEFAULT_POSITION = { x: 0, y: 0 };

const normalizePhoneNumber = (value: string) => {
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return null;
  return digits;
};

/**
 * 从 localStorage 读取保存的位置
 */
const getStoredPosition = (): { x: number; y: number } => {
  try {
    const saved = localStorage.getItem(POSITION_STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_POSITION;
  } catch {
    return DEFAULT_POSITION;
  }
};

/**
 * 保存位置到 localStorage
 */
const savePosition = (x: number, y: number): void => {
  try {
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify({ x, y }));
    // 触发 storage 事件以通知其他订阅者
    window.dispatchEvent(
      new StorageEvent('storage', { key: POSITION_STORAGE_KEY }),
    );
  } catch {
    // 忽略存储错误（如隐私模式）
  }
};

/**
 * 使用 useSyncExternalStore 安全地读取 localStorage
 * 避免 SSR/hydration 不匹配导致的 CLS
 */
function useStoredPosition() {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
  }, []);

  const getSnapshot = useCallback(() => {
    return JSON.stringify(getStoredPosition());
  }, []);

  const getServerSnapshot = useCallback(() => {
    return JSON.stringify(DEFAULT_POSITION);
  }, []);

  const positionString = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return JSON.parse(positionString) as { x: number; y: number };
}

export function WhatsAppFloatingButton({
  number,
  label = 'Chat with us on WhatsApp',
  className = '',
}: WhatsAppFloatingButtonProps) {
  const normalizedNumber = normalizePhoneNumber(number);
  const nodeRef = useRef<HTMLDivElement>(null);
  // 使用 useSyncExternalStore 安全读取 localStorage，避免 SSR/hydration CLS
  const storedPosition = useStoredPosition();
  const [localPosition, setLocalPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 优先使用本地拖拽位置，否则使用存储的位置
  const position = localPosition ?? storedPosition;

  if (!normalizedNumber) return null;

  const href = `https://wa.me/${normalizedNumber}`;

  // 拖拽开始时标记状态
  const handleStart = () => {
    setIsDragging(false);
  };

  // 拖拽中标记为正在拖拽
  const handleDrag = () => {
    setIsDragging(true);
  };

  // 拖拽结束时保存位置
  const handleStop = (_e: unknown, data: { x: number; y: number }) => {
    const newPosition = { x: data.x, y: data.y };
    setLocalPosition(newPosition);
    savePosition(newPosition.x, newPosition.y);
    // 延迟重置拖拽状态，避免触发点击
    setTimeout(() => setIsDragging(false), 100);
  };

  // 点击处理：如果在拖拽，阻止默认行为
  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      bounds='body'
      position={position}
      onStart={handleStart}
      onDrag={handleDrag}
      onStop={handleStop}
    >
      <div
        ref={nodeRef}
        role='complementary'
        aria-label='Support chat'
        className='fixed bottom-6 right-6 z-[1100]'
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <a
          aria-label={label}
          className={`whatsapp-fab group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${className}`}
          href={href}
          rel='noreferrer'
          target='_blank'
          onClick={handleClick}
        >
          <MessageCircle
            className='h-6 w-6'
            aria-hidden='true'
          />

          {/* Tooltip on hover */}
          <span className='pointer-events-none absolute bottom-full mb-2 w-max rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100'>
            {label}
          </span>

          {/* Breathing animation rings */}
          <span className='absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-20' />
          <span className='absolute inset-0 animate-pulse rounded-full bg-[#25D366] opacity-30' />
        </a>

        <style jsx>{`
          @keyframes breathe {
            0%,
            100% {
              transform: scale(1);
              box-shadow: 0 10px 25px -5px rgba(37, 211, 102, 0.4);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 15px 30px -5px rgba(37, 211, 102, 0.6);
            }
          }

          .whatsapp-fab {
            animation: breathe 3s ease-in-out infinite;
          }

          .whatsapp-fab:hover {
            animation: none;
          }
        `}</style>
      </div>
    </Draggable>
  );
}
