/**
 * 偏好事件创建函数
 * Preference Event Creator Functions
 */

'use client';

import type { Locale } from '@/types/i18n';
;
import type {
  UserLocalePreference,
  StorageEvent,
} from '../locale-storage-types';

/**
 * 事件创建工具
 * Event creation utilities
 */

/**
 * 创建偏好保存事件
 * Create preference saved event
 */
export function createPreferenceSavedEvent(
  preference: UserLocalePreference,
  source: string
): StorageEvent {
  return {
    type: 'preference_saved',
    data: {
      locale: preference.locale,
      source: preference.source,
      confidence: preference.confidence,
      storageSource: source,
      action: 'save',
    },
    timestamp: Date.now(),
    source: 'preference_manager',
  };
}

/**
 * 创建偏好加载事件
 * Create preference loaded event
 */
export function createPreferenceLoadedEvent(
  preference: UserLocalePreference,
  source: string
): StorageEvent {
  return {
    type: 'preference_loaded',
    data: {
      locale: preference.locale,
      source: preference.source,
      confidence: preference.confidence,
      storageSource: source,
      action: 'load',
    },
    timestamp: Date.now(),
    source: 'preference_manager',
  };
}

/**
 * 创建覆盖设置事件
 * Create override set event
 */
export function createOverrideSetEvent(
  locale: Locale,
  metadata?: Record<string, unknown>
): StorageEvent {
  return {
    type: 'override_set',
    data: {
      locale,
      metadata,
      action: 'set_override',
    },
    timestamp: Date.now(),
    source: 'preference_manager',
  };
}

/**
 * 创建覆盖清除事件
 * Create override cleared event
 */
export function createOverrideClearedEvent(): StorageEvent {
  return {
    type: 'override_cleared',
    data: {
      action: 'clear_override',
    },
    timestamp: Date.now(),
    source: 'preference_manager',
  };
}

/**
 * 创建同步事件
 * Create sync event
 */
export function createSyncEvent(
  synced: boolean,
  details: Record<string, unknown>
): StorageEvent {
  return {
    type: 'preference_sync',
    data: {
      synced,
      details,
      action: 'sync',
    },
    timestamp: Date.now(),
    source: 'preference_manager',
  };
}

/**
 * 创建错误事件
 * Create error event
 */
export function createPreferenceErrorEvent(
  operation: string,
  error: string
): StorageEvent {
  return {
    type: 'preference_error',
    data: {
      operation,
      error,
      action: 'error',
    },
    timestamp: Date.now(),
    source: 'preference_manager',
  };
}
