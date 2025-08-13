/// <reference types="vitest" />
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 测试环境配置
    environment: 'jsdom',

    // 全局设置
    globals: true,

    // 设置文件
    setupFiles: ['./src/test/setup.ts'],

    // 测试文件匹配模式
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'src/**/__tests__/**/*.{js,jsx,ts,tsx}',
      'tests/**/*.{test,spec}.{js,jsx,ts,tsx}',
    ],

    // 排除文件
    exclude: [
      'node_modules',
      '.next',
      'dist',
      'build',
      'coverage',
      '**/*.d.ts',
      '**/*.stories.{js,jsx,ts,tsx}',
      // 排除setup文件和工具文件
      '**/setup.{js,jsx,ts,tsx}',
      '**/test-utils.{js,jsx,ts,tsx}',
      '**/__tests__/**/setup.{js,jsx,ts,tsx}',
      '**/__tests__/**/test-utils.{js,jsx,ts,tsx}',
      // 排除E2E测试文件（应该由Playwright运行）
      'tests/e2e/**/*',
    ],

    // 覆盖率配置 - 最简配置
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      reportsDirectory: './coverage',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'dist/',
        'build/',
        'coverage/',
        '**/*.d.ts',
        '**/*.stories.{js,jsx,ts,tsx}',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}',
        'src/test/**',
        'src/testing/**',
        'scripts/**',
        '**/__mocks__/**',
        '**/test-utils/**',
        // 排除配置文件，避免污染覆盖率
        'next.config.ts',
        'tailwind.config.js',
        'postcss.config.mjs',
        'eslint.config.mjs',
        'playwright.config.ts',
        'next-sitemap.config.js',
        'commitlint.config.js',
        'translation.config.js',
        'tsconfig.json',
        'vitest.config.ts',
        'lefthook.yml',
        'semgrep.yml',
        'mdx-components.tsx',
        'middleware.ts',
        'instrumentation.ts',
        'instrumentation-client.ts',
        'sentry.*.config.ts',
        // 排除自动生成的文件

        'content/config/**',
        '**/*.tsbuildinfo',
        // 排除报告和文档目录
        'reports/**',
        'docs/**',
        'test-results/**',
        // 排除配置目录
        'config/**',
        // 排除开发工具 - 仅开发环境使用，不需要测试覆盖率
        'src/components/dev-tools/**',
        'src/app/**/dev-tools/**',
        'src/app/**/react-scan-demo/**',
        'src/app/**/diagnostics/**',
        'src/lib/dev-tools-positioning.ts',
        'src/lib/performance-monitoring-coordinator.ts',
        'src/lib/react-scan-config.ts',
        'src/constants/dev-tools.ts',
      ],
      thresholds: {
        // 全局目标：企业级标准
        'global': {
          branches: 80, // 提升至80%
          functions: 85, // 提升至85%
          lines: 85, // 提升至85%
          statements: 85, // 提升至85%
        },

        // 关键业务逻辑 - 最高标准
        'src/lib/content-parser.ts': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/lib/content-validation.ts': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/lib/seo-metadata.ts': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/lib/structured-data.ts': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },

        // 安全相关 - 最高标准
        'src/lib/accessibility.ts': {
          branches: 95,
          functions: 98,
          lines: 98,
          statements: 98,
        },
        'src/services/url-generator.ts': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },

        // 性能监控 - 高标准
        'src/lib/enhanced-web-vitals.ts': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'src/lib/theme-analytics.ts': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },

        // 国际化功能 - 高标准
        'src/lib/locale-detection.ts': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'src/lib/translation-manager.ts': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },

        // UI组件 - 中等标准
        'src/components/**/*.{ts,tsx}': {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },

        // 工具函数 - 高标准
        'src/lib/utils.ts': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
      },
    },

    // 测试超时设置 - 优化超时时间
    testTimeout: 10000, // 减少到10秒，避免长时间等待
    hookTimeout: 5000, // 减少hook超时时间

    // 并发设置 - 符合规则文件要求
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1,
      },
    },

    // 报告器配置
    reporters: ['verbose', 'json', 'html'],
    outputFile: {
      json: './reports/test-results.json',
      html: './reports/test-results.html',
    },

    // 环境变量
    env: {
      NODE_ENV: 'test',
    },

    // 性能配置
    logHeapUsage: true,
    isolate: true,

    // UI配置
    ui: true,
    open: false,
  },

  // 路径别名配置 - 统一使用单一别名符合规则要求
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  // 定义全局变量
  define: {
    'process.env.NODE_ENV': '"test"',
  },

  // JSX配置
  esbuild: {
    jsxInject: `import React from 'react'`,
  },
});
