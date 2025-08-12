# Web Eval Agent 测试报告

**生成时间**: 2025-08-11T16:08:57.661Z

## 测试摘要

- **总测试数**: 6
- **通过**: 4
- **失败**: 2
- **成功率**: 66.7%

## 测试详情

### 1. Playwright 包安装检查 ✅

**详情**: Playwright 已安装

**时间**: 2025-08-11T16:08:57.667Z

---

### 2. Playwright 配置文件检查 ✅

**详情**: 配置文件存在

**时间**: 2025-08-11T16:08:57.667Z

---

### 3. E2E 测试目录检查 ✅

**详情**: 测试目录存在

**时间**: 2025-08-11T16:08:57.667Z

---

### 4. 开发服务器检查 ✅

**详情**: 服务器运行在 http://localhost:3000

**时间**: 2025-08-11T16:09:03.294Z

---

### 5. Playwright 基础测试 ❌

**详情**: 测试执行失败

**错误**: `spawnSync /bin/sh ETIMEDOUT`

**时间**: 2025-08-11T16:10:03.598Z

---

### 6. Web Eval Agent 兼容性测试 ❌

**详情**: 兼容性测试失败

**错误**: `Command failed: node /tmp/web-eval-test.js
node:internal/modules/cjs/loader:1215
  throw err;
  ^

Error: Cannot find module 'playwright'
Require stack:
- /private/tmp/web-eval-test.js
    at Module._resolveFilename (node:internal/modules/cjs/loader:1212:15)
    at Module._load (node:internal/modules/cjs/loader:1043:27)
    at Module.require (node:internal/modules/cjs/loader:1298:19)
    at require (node:internal/modules/helpers:182:18)
    at Object.<anonymous> (/private/tmp/web-eval-test.js:2:30)
    at Module._compile (node:internal/modules/cjs/loader:1529:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [ '/private/tmp/web-eval-test.js' ]
}

Node.js v20.19.2
`

**时间**: 2025-08-11T16:10:03.927Z

---

