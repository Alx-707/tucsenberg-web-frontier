# 颜色系统文档

## 概述

本项目采用基于 OKLCH 颜色空间的现代颜色系统，确保在不同设备和显示条件下的颜色一致性和可访问性。所有颜色都经过优化以满足 WCAG
2.1 AA 级对比度标准。

## OKLCH 颜色空间

OKLCH（OK Lightness Chroma Hue）是一个感知均匀的颜色空间，具有以下优势：

- **感知均匀性**：颜色变化与人眼感知一致
- **更好的渐变**：避免传统 RGB/HSL 中的色调偏移
- **未来兼容性**：支持更广的色域（P3、Rec2020）
- **可预测性**：亮度调整不会影响色调

### OKLCH 参数说明

```css
oklch(L C H / alpha)
```

- **L (Lightness)**：亮度，范围 0-1（0=黑色，1=白色）
- **C (Chroma)**：色度，范围 0-0.4+（0=灰色，值越大越鲜艳）
- **H (Hue)**：色调，范围 0-360（色轮角度）
- **alpha**：透明度，范围 0-1（可选）

## 颜色变量系统

### 基础颜色

| 变量名         | 明亮模式           | 暗黑模式           | 用途       |
| -------------- | ------------------ | ------------------ | ---------- |
| `--background` | `oklch(1 0 0)`     | `oklch(0.145 0 0)` | 页面背景色 |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | 主要文本色 |

### 组件颜色

| 变量名                                       | 用途               | 对比度要求 |
| -------------------------------------------- | ------------------ | ---------- |
| `--card` / `--card-foreground`               | 卡片背景和文本     | ≥4.5:1     |
| `--popover` / `--popover-foreground`         | 弹出层背景和文本   | ≥4.5:1     |
| `--primary` / `--primary-foreground`         | 主要按钮和强调元素 | ≥4.5:1     |
| `--secondary` / `--secondary-foreground`     | 次要按钮和元素     | ≥4.5:1     |
| `--muted` / `--muted-foreground`             | 静音/次要信息      | ≥4.5:1     |
| `--accent` / `--accent-foreground`           | 强调色和高亮       | ≥4.5:1     |
| `--destructive` / `--destructive-foreground` | 危险操作和错误     | ≥4.5:1     |

### 语义化颜色

| 变量名                               | 用途     | 明亮模式                    | 暗黑模式                    |
| ------------------------------------ | -------- | --------------------------- | --------------------------- |
| `--success` / `--success-foreground` | 成功状态 | `oklch(0.646 0.222 142.5)`  | `oklch(0.7 0.222 142.5)`    |
| `--warning` / `--warning-foreground` | 警告状态 | `oklch(0.828 0.189 84.429)` | `oklch(0.85 0.189 84.429)`  |
| `--error` / `--error-foreground`     | 错误状态 | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` |
| `--info` / `--info-foreground`       | 信息状态 | `oklch(0.6 0.118 184.704)`  | `oklch(0.65 0.118 184.704)` |

### 边框和输入

| 变量名     | 用途       | 明亮模式           | 暗黑模式             |
| ---------- | ---------- | ------------------ | -------------------- |
| `--border` | 边框颜色   | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` |
| `--input`  | 输入框边框 | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` |
| `--ring`   | 焦点环颜色 | `oklch(0.708 0 0)` | `oklch(0.556 0 0)`   |

## 使用指南

### 1. 基本用法

```css
/* 使用颜色变量 */
.my-component {
  background-color: var(--background);
  color: var(--foreground);
  border: 1px solid var(--border);
}

/* 使用语义化颜色 */
.success-message {
  background-color: var(--success);
  color: var(--success-foreground);
}
```

### 2. 自定义颜色

```css
/* 创建自定义颜色时，确保对比度合规 */
:root {
  --custom-brand: oklch(0.6 0.15 280); /* 紫色品牌色 */
  --custom-brand-foreground: oklch(1 0 0); /* 白色文本 */
}

/* 验证对比度：6.8:1 > 4.5:1 ✓ */
```

### 3. 动态颜色调整

```css
/* 使用 OKLCH 的优势：可预测的颜色调整 */
:root {
  --base-color: oklch(0.7 0.15 200);
  --lighter-variant: oklch(0.8 0.15 200); /* 只调整亮度 */
  --more-vibrant: oklch(0.7 0.25 200); /* 只调整色度 */
  --shifted-hue: oklch(0.7 0.15 220); /* 只调整色调 */
}
```

## 对比度合规性

### WCAG 2.1 标准

- **AA 级**：对比度 ≥ 4.5:1（正常文本）
- **AA 级**：对比度 ≥ 3:1（大文本，18pt+ 或 14pt+ 粗体）
- **AAA 级**：对比度 ≥ 7:1（正常文本）
- **AAA 级**：对比度 ≥ 4.5:1（大文本）

### 验证工具

项目提供了内置的对比度验证工具：

```typescript
import { ColorSystem } from '@/lib/colors';

// 检查对比度合规性
const isCompliant = ColorSystem.checkCompliance(
  { l: 0.145, c: 0, h: 0 }, // 前景色
  { l: 1, c: 0, h: 0 }, // 背景色
  'AA', // 标准级别
);

// 验证整个主题
const validation = ColorSystem.validate(ColorSystem.light);
console.log(validation.compliant); // true/false
console.log(validation.issues); // 问题列表
```

## 最佳实践

### 1. 颜色选择

- **优先使用系统颜色变量**，避免硬编码颜色值
- **语义化命名**：使用 `--success` 而不是 `--green`
- **保持一致性**：相同用途使用相同颜色变量

### 2. 对比度优化

- **始终验证对比度**：使用工具确保合规性
- **考虑边缘情况**：高对比度模式、色盲用户
- **测试不同设备**：确保在各种屏幕上的表现

### 3. 主题适配

- **使用相对颜色**：避免在暗黑主题中使用绝对白色/黑色
- **保持品牌一致性**：确保品牌色在两个主题中都清晰可见
- **渐进增强**：为不支持 OKLCH 的浏览器提供回退

## 浏览器兼容性

### 支持情况

- **Chrome/Edge**: 111+ (2023年3月)
- **Firefox**: 113+ (2023年5月)
- **Safari**: 15.4+ (2022年3月)

### 回退策略

```css
/* 为旧浏览器提供回退 */
.component {
  background-color: #f8f9fa; /* 回退值 */
  background-color: var(--background); /* 现代浏览器 */
}

/* 或使用 @supports */
@supports (color: oklch(1 0 0)) {
  .component {
    background-color: var(--background);
  }
}
```

## 工具和资源

### 开发工具

- **颜色选择器**：[OKLCH Color Picker](https://oklch.com/)
- **对比度检查**：[WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- **色盲模拟**：[Coblis](https://www.color-blindness.com/coblis-color-blindness-simulator/)

### 内置工具

```typescript
// 项目内置的颜色工具
import { ColorSystem } from '@/lib/colors';

// 转换为 CSS 字符串
const cssColor = ColorSystem.toCSS({ l: 0.7, c: 0.15, h: 200 });

// 计算对比度
const contrast = ColorSystem.calculateContrast(color1, color2);

// 生成 CSS 变量
const variables = ColorSystem.generateVariables(ColorSystem.light);
```

## 更新日志

### v1.0.0 (2024-01-31)

- ✅ 初始 OKLCH 颜色系统实现
- ✅ WCAG 2.1 AA 级对比度合规
- ✅ 语义化颜色变量
- ✅ 明亮/暗黑主题支持
- ✅ 内置验证工具
- ✅ 完整文档和使用指南

---

_本文档随颜色系统更新而维护。如有问题或建议，请提交 Issue。_
