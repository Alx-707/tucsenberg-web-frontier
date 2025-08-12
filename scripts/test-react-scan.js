#!/usr/bin/env node

/**
 * React Scan 集成测试脚本
 *
 * 验证 React Scan 的正确集成和配置
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing React Scan Integration...\n');

// 测试结果收集
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function test(name, condition, message) {
  const passed = condition();
  results.tests.push({
    name,
    passed,
    message: passed ? '✅ PASS' : `❌ FAIL: ${message}`,
  });

  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
}

// 测试 1: 检查 React Scan 依赖是否安装
test(
  'React Scan dependency installed',
  () => {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return (
        packageJson.devDependencies && packageJson.devDependencies['react-scan']
      );
    } catch (error) {
      return false;
    }
  },
  'react-scan not found in devDependencies',
);

// 测试 2: 检查开发脚本是否配置
test(
  'Development script configured',
  () => {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return packageJson.scripts && packageJson.scripts['dev:no-scan'];
    } catch (error) {
      return false;
    }
  },
  'dev:no-scan script not found in package.json',
);

// 测试 3: 检查配置文件是否存在
test(
  'React Scan config file exists',
  () => {
    return fs.existsSync('src/lib/react-scan-config.ts');
  },
  'src/lib/react-scan-config.ts not found',
);

// 测试 4: 检查 Provider 组件是否存在
test(
  'React Scan Provider component exists',
  () => {
    return fs.existsSync('src/components/dev-tools/react-scan-provider.tsx');
  },
  'src/components/dev-tools/react-scan-provider.tsx not found',
);

// 测试 5: 检查环境变量配置
test(
  'Environment variable configured',
  () => {
    try {
      const envExample = fs.readFileSync('.env.example', 'utf8');
      return envExample.includes('NEXT_PUBLIC_DISABLE_REACT_SCAN');
    } catch (error) {
      return false;
    }
  },
  'NEXT_PUBLIC_DISABLE_REACT_SCAN not found in .env.example',
);

// 测试 6: 检查动态导入配置
test(
  'Dynamic imports configured',
  () => {
    try {
      const dynamicImports = fs.readFileSync(
        'src/components/shared/dynamic-imports.tsx',
        'utf8',
      );
      return dynamicImports.includes('DynamicReactScanProvider');
    } catch (error) {
      return false;
    }
  },
  'DynamicReactScanProvider not found in dynamic-imports.tsx',
);

// 测试 7: 检查布局集成
test(
  'Layout integration configured',
  () => {
    try {
      const layout = fs.readFileSync('src/app/[locale]/layout.tsx', 'utf8');
      return layout.includes('DynamicReactScanProvider');
    } catch (error) {
      return false;
    }
  },
  'DynamicReactScanProvider not found in layout.tsx',
);

// 测试 8: 检查文档是否存在
test(
  'Documentation exists',
  () => {
    return fs.existsSync('docs/development/react-scan.md');
  },
  'docs/development/react-scan.md not found',
);

// 输出测试结果
console.log('Test Results:');
console.log('='.repeat(50));

results.tests.forEach((test) => {
  console.log(`${test.message} ${test.name}`);
});

console.log('\n' + '='.repeat(50));
console.log(`Total: ${results.tests.length} tests`);
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);

if (results.failed === 0) {
  console.log('\n🎉 All tests passed! React Scan is properly integrated.');
  console.log('\n📝 Next steps:');
  console.log('1. Run: pnpm dev (React Scan auto-enabled in development)');
  console.log(
    '2. To disable: set NEXT_PUBLIC_DISABLE_REACT_SCAN=true in .env.local',
  );
  console.log('3. Open your browser and look for the React Scan indicators');
} else {
  console.log('\n⚠️  Some tests failed. Please check the configuration.');
  process.exit(1);
}

// 额外的配置验证
console.log('\n🔧 Configuration Check:');
console.log('='.repeat(50));

try {
  // 检查 TypeScript 配置
  const configContent = fs.readFileSync('src/lib/react-scan-config.ts', 'utf8');
  if (configContent.includes('DEFAULT_REACT_SCAN_CONFIG')) {
    console.log('✅ Default configuration found');
  } else {
    console.log('⚠️  Default configuration not found');
  }

  // 检查 Provider 配置
  const providerContent = fs.readFileSync(
    'src/components/dev-tools/react-scan-provider.tsx',
    'utf8',
  );
  if (providerContent.includes('onRender')) {
    console.log('✅ Custom render callback configured');
  } else {
    console.log('ℹ️  Using default render behavior');
  }

  // 检查指示器组件
  if (providerContent.includes('ReactScanIndicator')) {
    console.log('✅ Status indicator component found');
  } else {
    console.log('⚠️  Status indicator component not found');
  }
} catch (error) {
  console.log('⚠️  Error reading configuration files:', error.message);
}

console.log('\n📚 Documentation: docs/development/react-scan.md');
console.log('🔗 Repository: https://github.com/aidenybai/react-scan');
