/**
 * TypeScript类型定义统一导出
 * 提供项目中所有类型定义的统一入口
 */

// 导出全局类型
export type { ApiResponse, PaginatedResponse, DeepPartial, RequiredKeys, OptionalKeys, Brand, UserId, Email, Theme, Locale, Environment, ErrorType, LoadingState, FormState, FormErrors, EventHandler, AsyncFunction, ConfigOptions } from './global';

// 导出测试相关类型
// 导出测试工具函数
export { isMockDOMElement, isMockKeyboardEvent, isValidThemeMode } from './test-types';
// 导出测试类型定义
export type { MockDOMElement, MockKeyboardEvent, MockMouseEvent, MockProcessEnv, MockCrypto, MockGlobal, ThemeMode, MockPerformanceMetric, MockSwitchPattern, MockAnalyticsConfig, MockFunction, TestCallback, TestConfig, MockColorData, AccessibilityManagerPrivate, AccessibilityTestConfig, ThemeAnalyticsPrivate, ThemeAnalyticsInstance, IncompleteThemeColors, CSSVariablesTest, ExtendedMockFunction, SpyFunction, TestSuiteConfig, PatternMatchResult, TestDataGenerator, TestAssertion, AllTestTypes } from './test-types';

// 未来可以添加更多类型模块的导出
// export * from './api';
// export * from './auth';
// export * from './forms';
// export * from './components';
