#!/usr/bin/env node

/**
 * TinaCMS 部署前检查脚本
 * 确保所有配置正确，依赖完整，可以安全部署
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 TinaCMS Deployment Readiness Check\n');

let checksPassed = 0;
let checksTotal = 0;
const issues = [];

function runCheck(name, checkFn) {
  checksTotal++;
  console.log(`📋 Checking ${name}...`);

  try {
    const result = checkFn();
    if (result === true || result === undefined) {
      console.log(`✅ ${name} - PASSED`);
      checksPassed++;
    } else {
      console.log(`❌ ${name} - FAILED: ${result}`);
      issues.push(`${name}: ${result}`);
    }
  } catch (error) {
    console.log(`❌ ${name} - ERROR: ${error.message}`);
    issues.push(`${name}: ${error.message}`);
  }
  console.log('');
}

// 检查必要文件存在
runCheck('Required Files', () => {
  const requiredFiles = [
    'tina/config.ts',
    'src/app/admin/page.tsx',
    'package.json',
    '.env.example',
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      return `Missing required file: ${file}`;
    }
  }
  return true;
});

// 检查 TinaCMS 配置
runCheck('TinaCMS Configuration', () => {
  try {
    const configPath = path.resolve('tina/config.ts');
    const configContent = fs.readFileSync(configPath, 'utf8');

    // 检查必要的配置项
    const requiredConfigs = [
      'defineConfig',
      'collections',
      'schema',
      'branch',
      'clientId',
    ];

    for (const config of requiredConfigs) {
      if (!configContent.includes(config)) {
        return `Missing configuration: ${config}`;
      }
    }

    return true;
  } catch (error) {
    return `Failed to read config: ${error.message}`;
  }
});

// 检查环境变量
runCheck('Environment Variables', () => {
  const requiredEnvVars = ['NEXT_PUBLIC_TINA_CLIENT_ID', 'TINA_TOKEN'];

  // 检查 .env.example 中是否包含必要的环境变量
  if (fs.existsSync('.env.example')) {
    const envExample = fs.readFileSync('.env.example', 'utf8');
    for (const envVar of requiredEnvVars) {
      if (!envExample.includes(envVar)) {
        return `Missing environment variable in .env.example: ${envVar}`;
      }
    }
  }

  // 检查 .env.local 文件是否存在并包含必要的环境变量
  if (fs.existsSync('.env.local')) {
    const envLocal = fs.readFileSync('.env.local', 'utf8');
    const missingVars = [];

    for (const envVar of requiredEnvVars) {
      // 检查变量是否在文件中定义且不是占位符
      const regex = new RegExp(`^${envVar}=(.+)$`, 'm');
      const match = envLocal.match(regex);

      if (
        !match ||
        match[1].trim() === '' ||
        match[1].includes('your_') ||
        match[1].includes('test_')
      ) {
        missingVars.push(envVar);
      }
    }

    if (missingVars.length > 0) {
      return `Environment variables in .env.local need real values (not placeholders): ${missingVars.join(', ')}`;
    }
  } else {
    return 'Missing .env.local file. Please create it based on .env.example';
  }

  return true;
});

// 检查依赖包
runCheck('Dependencies', () => {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = ['tinacms', '@tinacms/cli', '@tinacms/mdx'];

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    for (const dep of requiredDeps) {
      if (!allDeps[dep]) {
        return `Missing dependency: ${dep}`;
      }
    }

    // 检查是否安装了依赖
    try {
      execSync('pnpm list tinacms', { stdio: 'pipe' });
    } catch (error) {
      return 'TinaCMS dependencies not installed. Run: pnpm install';
    }

    return true;
  } catch (error) {
    return `Failed to check dependencies: ${error.message}`;
  }
});

// 检查 package.json 脚本
runCheck('Package Scripts', () => {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['tina:dev', 'tina:build', 'tina:admin'];

  for (const script of requiredScripts) {
    if (!packageJson.scripts[script]) {
      return `Missing script: ${script}`;
    }
  }

  return true;
});

// 检查 Next.js 配置
runCheck('Next.js Configuration', () => {
  if (!fs.existsSync('next.config.ts') && !fs.existsSync('next.config.js')) {
    return 'Missing Next.js configuration file';
  }

  const configFile = fs.existsSync('next.config.ts')
    ? 'next.config.ts'
    : 'next.config.js';
  const configContent = fs.readFileSync(configFile, 'utf8');

  // 检查是否包含 webpack 配置（用于 TinaCMS）
  if (!configContent.includes('webpack')) {
    return 'Next.js config missing webpack configuration for TinaCMS';
  }

  return true;
});

// 检查内容结构
runCheck('Content Structure', () => {
  const contentDirs = [
    'content/posts/en',
    'content/posts/zh',
    'content/pages/en',
    'content/pages/zh',
  ];

  for (const dir of contentDirs) {
    if (!fs.existsSync(dir)) {
      return `Missing content directory: ${dir}`;
    }
  }

  // 检查是否有示例内容
  const sampleFiles = [
    'content/posts/en/welcome-to-tucsenberg.mdx',
    'content/posts/zh/welcome-to-tucsenberg.mdx',
  ];

  let hasContent = false;
  for (const file of sampleFiles) {
    if (fs.existsSync(file)) {
      hasContent = true;
      break;
    }
  }

  if (!hasContent) {
    return 'No sample content found. Consider adding some test content.';
  }

  return true;
});

// 检查构建能力
runCheck('Build Test', () => {
  try {
    console.log('   Running build test...');
    execSync('pnpm run build', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return `Build failed: ${error.message}`;
  }
});

// 检查 TypeScript 类型
runCheck('TypeScript Types', () => {
  try {
    console.log('   Checking TypeScript types...');
    execSync('pnpm run type-check', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return `TypeScript type check failed: ${error.message}`;
  }
});

// 检查 Git 配置
runCheck('Git Configuration', () => {
  try {
    // 检查是否在 Git 仓库中
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });

    // 检查是否有远程仓库
    const remotes = execSync('git remote -v', { encoding: 'utf8' });
    if (!remotes.trim()) {
      return 'No Git remotes configured. TinaCMS requires Git integration.';
    }

    // 检查当前分支
    const branch = execSync('git branch --show-current', {
      encoding: 'utf8',
    }).trim();
    if (!branch) {
      return 'Not on a Git branch. Please checkout a branch.';
    }

    return true;
  } catch (error) {
    return `Git configuration issue: ${error.message}`;
  }
});

// 生成报告
console.log('📊 DEPLOYMENT READINESS REPORT');
console.log('='.repeat(50));
console.log(`✅ Checks Passed: ${checksPassed}/${checksTotal}`);
console.log(`❌ Checks Failed: ${checksTotal - checksPassed}/${checksTotal}`);

if (issues.length > 0) {
  console.log('\n🚨 ISSUES FOUND:');
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });

  console.log('\n📋 RECOMMENDED ACTIONS:');
  console.log('1. Fix all issues listed above');
  console.log('2. Run this script again to verify fixes');
  console.log('3. Test TinaCMS functionality in development');
  console.log('4. Proceed with deployment only after all checks pass');

  process.exit(1);
} else {
  console.log('\n🎉 ALL CHECKS PASSED!');
  console.log('✅ TinaCMS is ready for deployment');

  console.log('\n📋 NEXT STEPS:');
  console.log('1. Deploy to staging environment first');
  console.log('2. Test TinaCMS functionality in staging');
  console.log('3. Train team members on TinaCMS usage');
  console.log('4. Deploy to production when ready');

  console.log('\n🔗 USEFUL COMMANDS:');
  console.log('• Start development: pnpm run tina:dev');
  console.log('• Access admin: http://localhost:3000/admin');
  console.log('• Build for production: pnpm run tina:build');
  console.log('• Run health check: node scripts/tinacms-deployment-check.js');

  process.exit(0);
}
