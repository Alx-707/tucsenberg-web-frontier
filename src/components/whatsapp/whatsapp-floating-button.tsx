'use client';

import { useRef, useState } from 'react';
import { Phone } from 'lucide-react';
import Draggable from 'react-draggable';

export interface WhatsAppFloatingButtonProps {
  number: string;
  label?: string;
  className?: string;
}

const POSITION_STORAGE_KEY = 'whatsapp-button-position';

const normalizePhoneNumber = (value: string) => {
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return null;
  return digits;
};

/**
 * 从 localStorage 读取保存的位置
 */
const loadPosition = (): { x: number; y: number } => {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  try {
    const saved = localStorage.getItem(POSITION_STORAGE_KEY);
    return saved ? JSON.parse(saved) : { x: 0, y: 0 };
  } catch {
    return { x: 0, y: 0 };
  }
};

/**
 * 保存位置到 localStorage
 */
const savePosition = (x: number, y: number): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify({ x, y }));
  } catch {
    // 忽略存储错误（如隐私模式）
  }
};

export function WhatsAppFloatingButton({
  number,
  label = 'Chat with us on WhatsApp',
  className = '',
}: WhatsAppFloatingButtonProps) {
  const normalizedNumber = normalizePhoneNumber(number);
  const nodeRef = useRef<HTMLDivElement>(null);
  // 使用 lazy initializer 从 localStorage 恢复位置（避免 useEffect 初始化状态）
  const [position, setPosition] = useState(() => loadPosition());

  if (!normalizedNumber) return null;

  const href = `https://wa.me/${normalizedNumber}`;

  // 拖拽结束时保存位置
  const handleStop = (_e: unknown, data: { x: number; y: number }) => {
    const newPosition = { x: data.x, y: data.y };
    setPosition(newPosition);
    savePosition(newPosition.x, newPosition.y);
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      bounds='body'
      defaultPosition={position}
      onStop={handleStop}
      handle='.drag-handle'
    >
      <div
        ref={nodeRef}
        role='complementary'
        aria-label='Support chat'
        className='fixed bottom-6 right-6 z-[1100]'
      >
        <a
          aria-label={label}
          className={`flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${className}`}
          href={href}
          rel='noreferrer'
          target='_blank'
        >
          <div
            className='drag-handle cursor-move'
            aria-label='Drag to move'
          >
            <Phone
              className='h-4 w-4'
              aria-hidden='true'
            />
          </div>
          <span>{label}</span>
        </a>
      </div>
    </Draggable>
  );
}
