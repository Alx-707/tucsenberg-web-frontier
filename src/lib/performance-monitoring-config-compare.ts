/**
 * 性能监控配置比较工具
 * Performance Monitoring Config Comparison Utilities
 */

import type { PerformanceConfig } from '@/lib/performance-monitoring-types';

/**
 * 比较 global 配置差异
 */
export function compareGlobalConfig(
  current: PerformanceConfig,
  other: PerformanceConfig,
  differences: string[],
): void {
  if (current.global?.enabled !== other.global?.enabled) {
    differences.push('global.enabled');
  }
  if (current.global?.dataRetentionTime !== other.global?.dataRetentionTime) {
    differences.push('global.dataRetentionTime');
  }
  if (current.global?.maxMetrics !== other.global?.maxMetrics) {
    differences.push('global.maxMetrics');
  }
}

/**
 * 比较 component 配置差异
 */
export function compareComponentConfig(
  current: PerformanceConfig,
  other: PerformanceConfig,
  differences: string[],
): void {
  if (current.component?.enabled !== other.component?.enabled) {
    differences.push('component.enabled');
  }
  if (
    current.component?.thresholds?.renderTime !==
    other.component?.thresholds?.renderTime
  ) {
    differences.push('component.thresholds.renderTime');
  }
}

/**
 * 比较 network 配置差异
 */
export function compareNetworkConfig(
  current: PerformanceConfig,
  other: PerformanceConfig,
  differences: string[],
): void {
  if (current.network?.enabled !== other.network?.enabled) {
    differences.push('network.enabled');
  }
  if (
    current.network?.thresholds?.responseTime !==
    other.network?.thresholds?.responseTime
  ) {
    differences.push('network.thresholds.responseTime');
  }
}

/**
 * 比较 bundle 配置差异
 */
export function compareBundleConfig(
  current: PerformanceConfig,
  other: PerformanceConfig,
  differences: string[],
): void {
  if (current.bundle?.enabled !== other.bundle?.enabled) {
    differences.push('bundle.enabled');
  }
  if (current.bundle?.thresholds?.size !== other.bundle?.thresholds?.size) {
    differences.push('bundle.thresholds.size');
  }
}
