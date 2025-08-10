'use client';

import { useState } from 'react';
import { ConfiguredState } from './admin-configured-state';
import { LoadingState } from './admin-ui-components';
import { UnconfiguredState } from './admin-unconfigured-state';
import { checkTinaCMSConfiguration } from './admin-utils';







/**
 * AdminPage组件
 * TinaCMS管理页面的主入口组件
 */
export default function AdminPage() {
  const [isLoading] = useState(false);
  const isConfigured = checkTinaCMSConfiguration();

  // 根据状态渲染对应的组件
  if (isLoading) {
    return <LoadingState />;
  }

  if (!isConfigured) {
    return <UnconfiguredState />;
  }

  return <ConfiguredState />;
}
