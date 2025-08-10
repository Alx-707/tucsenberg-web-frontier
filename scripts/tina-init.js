#!/usr/bin/env node

/**
 * TinaCMS 初始化脚本
 * 用于设置 TinaCMS 开发环境和配置
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Initializing TinaCMS for Tucsenberg Web Frontier...\n');

// 检查必要的文件
const requiredFiles = ['tina/config.ts', 'src/app/admin/page.tsx'];

console.log('📋 Checking required files...');
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    process.exit(1);
  }
}

// 检查环境变量
console.log('\n🔧 Checking environment variables...');
const requiredEnvVars = ['NEXT_PUBLIC_TINA_CLIENT_ID', 'TINA_TOKEN'];

const envFile = '.env.local';
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  for (const envVar of requiredEnvVars) {
    if (envContent.includes(envVar)) {
      console.log(`✅ ${envVar} configured`);
    } else {
      console.log(`⚠️  ${envVar} not found in ${envFile}`);
    }
  }
} else {
  console.log(
    `⚠️  ${envFile} not found. Please create it based on .env.example`,
  );
}

// 检查 package.json 脚本
console.log('\n📦 Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const recommendedScripts = {
  'tina:dev': 'tinacms dev -c "next dev --turbo"',
  'tina:build': 'tinacms build',
  'tina:admin': 'tinacms admin',
};

let scriptsToAdd = [];
for (const [scriptName, scriptCommand] of Object.entries(recommendedScripts)) {
  if (packageJson.scripts[scriptName]) {
    console.log(`✅ ${scriptName} script exists`);
  } else {
    console.log(`⚠️  ${scriptName} script missing`);
    scriptsToAdd.push({ name: scriptName, command: scriptCommand });
  }
}

if (scriptsToAdd.length > 0) {
  console.log('\n🔧 Adding missing scripts to package.json...');
  for (const script of scriptsToAdd) {
    packageJson.scripts[script.name] = script.command;
    console.log(`✅ Added ${script.name}: ${script.command}`);
  }
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('📝 package.json updated');
}

// 创建 .gitignore 条目
console.log('\n📝 Checking .gitignore...');
const gitignoreFile = '.gitignore';
const tinaIgnoreEntries = [
  '# TinaCMS',
  '.tina/__generated__',
  'tina/__generated__',
  '.env.local',
];

if (fs.existsSync(gitignoreFile)) {
  let gitignoreContent = fs.readFileSync(gitignoreFile, 'utf8');
  let needsUpdate = false;

  for (const entry of tinaIgnoreEntries) {
    if (!gitignoreContent.includes(entry)) {
      gitignoreContent += `\n${entry}`;
      needsUpdate = true;
    }
  }

  if (needsUpdate) {
    fs.writeFileSync(gitignoreFile, gitignoreContent);
    console.log('✅ Updated .gitignore with TinaCMS entries');
  } else {
    console.log('✅ .gitignore already contains TinaCMS entries');
  }
} else {
  fs.writeFileSync(gitignoreFile, tinaIgnoreEntries.join('\n'));
  console.log('✅ Created .gitignore with TinaCMS entries');
}

// 生成 TinaCMS 类型
console.log('\n🔄 Generating TinaCMS types...');
try {
  execSync('npx @tinacms/cli init', { stdio: 'inherit' });
  console.log('✅ TinaCMS types generated');
} catch (error) {
  console.log(
    '⚠️  Failed to generate TinaCMS types. Run manually: npx @tinacms/cli init',
  );
}

console.log('\n🎉 TinaCMS initialization complete!');
console.log('\n📋 Next steps:');
console.log('1. Set up your TinaCMS Cloud account at https://app.tina.io');
console.log('2. Add your TINA_CLIENT_ID and TINA_TOKEN to .env.local');
console.log('3. Run: pnpm run tina:dev');
console.log('4. Visit http://localhost:3000/admin to access TinaCMS');
console.log('\n🔗 Useful links:');
console.log('- TinaCMS Docs: https://tina.io/docs/');
console.log('- TinaCMS Cloud: https://app.tina.io');
console.log(
  '- GitHub Integration: https://tina.io/docs/tina-cloud/connecting-site/',
);
