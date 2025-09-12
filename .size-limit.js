module.exports = [
  {
    name: 'Main App Bundle (First Load JS)',
    path: '.next/static/chunks/main-app-*.js',
    limit: '50 KB',
    webpack: false,
    running: false,
  },
  {
    name: 'Framework Bundle',
    path: '.next/static/chunks/framework-*.js',
    limit: '130 KB',
    webpack: false,
    running: false,
  },
  {
    name: 'Main Bundle',
    path: '.next/static/chunks/main-*.js',
    limit: '40 KB',
    webpack: false,
    running: false,
  },
  {
    name: 'Locale Page Bundle',
    path: '.next/static/chunks/app/\\[locale\\]/page-*.js',
    limit: '15 KB',
    webpack: false,
    running: false,
  },
  {
    name: 'Total CSS Bundle',
    path: '.next/static/css/*.css',
    limit: '50 KB',
    webpack: false,
    running: false,
  },
  {
    name: 'Shared Chunks (excluding framework)',
    path: '.next/static/chunks/!(framework|main|main-app|polyfills|webpack)-*.js',
    limit: '320 KB', // 临时调整：当前310.31KB + 10KB缓冲，需要进一步优化
    webpack: false,
    running: false,
  },
  {
    name: 'Polyfills Bundle',
    path: '.next/static/chunks/polyfills-*.js',
    limit: '50 KB',
    webpack: false,
    running: false,
  },
  {
    name: 'Webpack Runtime',
    path: '.next/static/chunks/webpack-*.js',
    limit: '10 KB',
    webpack: false,
    running: false,
  },
];
