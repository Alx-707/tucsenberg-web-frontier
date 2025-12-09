# Changelog

本项目的所有重要变更将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Changed
- 升级 Next.js 16.0.7 → 16.0.8（补丁版本，CNA 模板 React canary 更新）

### Security
- **[CRITICAL]** 升级 Next.js 16.0.4 → 16.0.7，修复 CVE-2025-66478（CVSS 10.0）
  - 漏洞类型：React Server Components (RSC) "Flight" 协议反序列化漏洞
  - 影响：未认证远程代码执行 (RCE)
  - 相关 CVE：CVE-2025-55182 (React)
  - 参考：https://nextjs.org/blog/CVE-2025-66478

### Added
- 产品目录系统：6 个示例产品（变频器、液压泵站、不锈钢紧固件、LED 工业照明、气缸、工业阀门组）
- 博客系统：4 篇 B2B 外贸主题文章（国际贸易术语、质量控制、供应商选择、出口单证）
- FAQ 页面：涵盖订购、付款、物流、质量四大类常见问题
- 隐私政策页面：符合 GDPR/CCPA 规范的隐私声明
- 完整的英中双语内容支持
- 内容管理系统文档（README.md 更新）
- 贡献指南（CONTRIBUTING.md）

## [1.0.0] - 2024-12-02

### Added

#### 核心功能
- Next.js 16 + React 19 + TypeScript 5.9 技术栈
- App Router 架构，支持 Server Components
- 英中双语国际化（next-intl）
- 明暗主题切换
- 响应式设计

#### 内容系统
- MDX 内容管理系统
- 产品目录页面
- 博客文章系统
- 静态页面支持

#### B2B 功能
- 联系表单（Cloudflare Turnstile 验证）
- 产品询价功能
- WhatsApp 浮动按钮（可配置）

#### 质量保障
- ESLint 9 + 9 个插件
- TypeScript 严格模式
- Vitest 单元测试
- Playwright E2E 测试
- 循环依赖检测
- 安全扫描（npm audit + Semgrep）

#### 性能优化
- 翻译文件分层加载（critical/deferred）
- 包大小预算控制
- Lighthouse CI 集成

### Security
- 联系表单蜜罐字段防垃圾邮件
- Turnstile 人机验证
- 输入验证与清理
- CSP 内容安全策略

---

## 版本说明

### 主版本号 (MAJOR)
当进行不兼容的 API 变更时递增。

### 次版本号 (MINOR)
当以向后兼容的方式添加功能时递增。

### 修订号 (PATCH)
当进行向后兼容的 Bug 修复时递增。

## 贡献

如果您想贡献代码，请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。
