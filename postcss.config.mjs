const config = {
  plugins: [
    '@tailwindcss/postcss',
    // CSS 优化插件
    [
      'cssnano',
      {
        preset: [
          'default',
          {
            // 保留重要的注释
            discardComments: {
              removeAll: false,
            },
            // 优化 calc() 表达式
            calc: true,
            // 合并相同的规则
            mergeRules: true,
            // 压缩颜色值
            colormin: true,
            // 优化字体权重
            minifyFontValues: true,
            // 优化选择器
            minifySelectors: true,
            // 移除未使用的 CSS
            reduceIdents: false, // 保留 CSS 变量名
          },
        ],
      },
    ],
  ],
};

export default config;
