module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: '禁止循环依赖 - 防止模块间相互引用导致的架构问题',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: '检测孤立文件 - 识别未被引用的代码文件',
      from: {
        orphan: true,
        pathNot: '\\.(d\\.ts|spec\\.ts|test\\.ts|stories\\.ts|stories\\.tsx)$',
      },
      to: {},
    },
    {
      name: 'feature-isolation',
      severity: 'error',
      comment: '特性间依赖隔离 - 确保功能模块间的清晰边界',
      from: { path: '^src/features/[^/]+' },
      to: {
        path: '^src/features/(?!\\1)[^/]+',
        pathNot: '^src/(shared|lib|components|utils|types|hooks)',
      },
    },
    {
      name: 'no-external-to-internal',
      severity: 'error',
      comment: '禁止外部依赖直接访问内部模块',
      from: { pathNot: '^src/' },
      to: { path: '^src/lib/internal' },
    },
    {
      name: 'no-test-imports-in-production',
      severity: 'error',
      comment: '禁止生产代码导入测试文件',
      from: {
        pathNot: '\\.(spec|test|stories)\\.(js|ts|tsx)$',
      },
      to: {
        path: '\\.(spec|test|stories)\\.(js|ts|tsx)$',
      },
    },
    {
      name: 'no-dev-dependencies-in-production',
      severity: 'error',
      comment: '禁止生产代码导入开发依赖',
      from: {
        path: '^src/',
        pathNot: '\\.(spec|test|stories)\\.(js|ts|tsx)$',
      },
      to: {
        dependencyTypes: ['npm-dev'],
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules|\\.(spec|test|stories)\\.(js|ts|tsx)$',
    },
    exclude: {
      path: '\\.(spec|test|stories)\\.(js|ts|tsx)$|node_modules',
    },
    tsPreCompilationDeps: true,
    preserveSymlinks: false,
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
        theme: {
          graph: {
            bgcolor: 'transparent',
            splines: 'ortho',
            rankdir: 'TB',
            fontname: 'Helvetica',
            fontsize: '9',
          },
          modules: [
            {
              criteria: { source: '^src/app' },
              attributes: { fillcolor: '#ffcccc', style: 'filled' },
            },
            {
              criteria: { source: '^src/components' },
              attributes: { fillcolor: '#ccffcc', style: 'filled' },
            },
            {
              criteria: { source: '^src/lib' },
              attributes: { fillcolor: '#ccccff', style: 'filled' },
            },
            {
              criteria: { source: '^src/features' },
              attributes: { fillcolor: '#ffffcc', style: 'filled' },
            },
          ],
        },
      },
    },
  },
};
