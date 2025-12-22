# Vercel 文本选中高亮效果调研与集成方案

> 目的：沉淀对 vercel.com 文本选中高亮（selection highlight）效果的调研结论，并给出适配当前项目（Next.js 16 + React 19 + TS + Tailwind 4 + shadcn/ui）的集成建议，供后续功能实现参考。

---

## 1. Vercel 官网选中高亮实现方式（结论）

### 1.1 实际抓到的关键 CSS

通过浏览器自动化在 `https://vercel.com` 页面内遍历 `document.styleSheets` 和 `cssRules`，过滤包含 `::selection` / `::-moz-selection` 的规则，得到核心实现：

```css
/* 全局选中样式 */
::-moz-selection {
  background-color: var(--geist-selection);
  color: var(--geist-selection-text-color);
}
::selection {
  background-color: var(--geist-selection);
  color: var(--geist-selection-text-color);
}
```

`--geist-selection` 与 `--geist-selection-text-color` 来自 Vercel 自家的 Geist Design System 颜色变量，例如（节选）：

```css
:root,
:host,
.dark .invert-theme,
.dark-theme .invert-theme,
.geist-disabled .geist-disabled-skip {
  /* ... 其它 DS 颜色变量 ... */
  --geist-selection: var(--ds-gray-1000);
  --geist-selection-text-color: var(--ds-gray-100);
}

.dark-theme,
.invert-theme,
.dark,
.dark-theme .geist-disabled .geist-disabled-skip {
  --geist-selection: var(--ds-gray-1000);
  --geist-selection-text-color: var(--ds-gray-100);
}
```

部分模块有额外覆盖，例如渐变数字、代码块：

```css
/* 渐变数字高亮时，强制使用普通前景色 */
.stats-module__...__highlight.stats-module__...__gradient::selection {
  -webkit-text-fill-color: var(--geist-foreground);
}

/* 代码 snippet */
.snippet-module__...__snippet pre::selection {
  background: var(--geist-selection);
}
```

### 1.2 关键结论

- **没有使用任何第三方 JS 选区库**（没有监听 `selectionchange` 或插入额外 DOM）
- **实现方案 = 原生 CSS 伪元素 + Geist 设计系统变量**：
  - 全局统一：`::selection` / `::-moz-selection`
  - 颜色来自：`--geist-selection` / `--geist-selection-text-color`
  - 部分模块进行局部覆盖（渐变文本、代码块、特定 hero/统计模块等）
- 这些样式位于 `_next/static/chunks/*.css` 中，属于 Vercel 营销站样式的一部分，**不是单独的 npm 库**。

> 总结：Vercel 文本选中高亮效果 **不是某个开源包**，而是 Geist Design System 内部的 CSS 规则。

---

## 2. 与当前项目技术栈的兼容性分析

当前项目栈：Next.js 16（App Router + Cache Components）+ React 19 + TypeScript 5 + Tailwind CSS 4 + shadcn/ui。

### 2.1 与框架 / RSC 的关系

- `::selection` / `::-moz-selection` 是浏览器原生 CSS 伪元素：
  - 与 React 19 / Server Components / Client Components 完全解耦；
  - 不依赖 JS / hydration，不引入新的运行时风险。

### 2.2 与 TypeScript / ESLint 的关系

- 实现全部在 CSS 中完成：
  - 不引入新的 TS 类型声明；
  - 不会触发 ESLint / TS strict 模式问题；
  - 不改变任何组件 API。

### 2.3 与 Tailwind 4 + 现有主题系统

- 项目当前通过 `globals.css` + OKLCH 变量管理主题色：
  - 已有 `--background` / `--foreground` / `--primary` 等语义变量；
  - `@layer base` 中用 `body { @apply bg-background text-foreground; }` 等将变量接入 Tailwind。
- Tailwind 自带 `selection:` 变体，可以在**组件级**增加选中样式；
- 新增少量全局 `::selection` 样式，与 Tailwind 的 `@layer base` 完全兼容。

### 2.4 额外依赖与质量标准

- 采纳 Vercel 的思路不需要安装任何 npm 包；
- 不会增加 JS bundle 体积，也不改变 webpack/Turbopack 分包策略；
- 性能和可维护性均符合本项目的质量门槛。

---

## 3. 推荐集成方案

### 3.1 方案 A（推荐起步）：最小成本全局 `::selection` 方案

**目标**：
- 整站统一、品牌感一致的文本选中高亮效果；
- 只改全局 CSS，零 JS、零依赖、可随时调整。

**实现步骤：**

1. 在 `src/app/globals.css` 中为 light / dark 模式新增语义变量（示意）：

```css
:root {
  /* ...已有颜色变量... */
  --selection-background: oklch(0.90 0.03 260);  /* 浅品牌色或浅灰 */
  --selection-foreground: oklch(0.18 0.03 260);  /* 深前景，保证对比度 */
}

.dark {
  /* ...已有暗色变量... */
  --selection-background: oklch(0.35 0.05 260);
  --selection-foreground: oklch(0.97 0.02 260);
}
```

> 具体 OKLCH 数值建议与设计同学确认，对齐现有 `--primary` / `--foreground` 体系，确保 WCAG 对比度。

2. 在同一文件的 `@layer base` 中增加全局选中样式：

```css
@layer base {
  /* ...已有 base 样式... */

  ::selection {
    background-color: var(--selection-background);
    color: var(--selection-foreground);
  }

  ::-moz-selection {
    background-color: var(--selection-background);
    color: var(--selection-foreground);
  }
}
```

**影响范围：**
- 所有文本节点（包括：页面文案、MDX 内容、i18n 翻译、shadcn 组件文本）在选中时，都使用统一的品牌选中色；
- 不需要修改 Tailwind 配置、layout 组件或 TS 代码。

**复杂度 / 风险评估：**
- 复杂度：★☆☆☆☆（1/5）
- 风险点：仅限“颜色是否符合品牌&可读性”，可通过设计评审调整；
- 安全性高，可快速落地，建议作为第一阶段实现。

---

### 3.2 方案 B：设计系统级「选中态」+ 场景化微调

**目标**：
- 将“选中态”纳入设计系统，和 `--primary` 一样作为正式语义；
- 为不同场景（正文、代码、Hero 标题、KPI 渐变数字等）定义不同的选中体验，类似 Vercel。

**思路：**

1. 在 `:root` / `.dark` 中扩展更多语义变量（示意）：

```css
:root {
  --selection-bg: oklch(...);
  --selection-fg: oklch(...);
  --selection-code-bg: oklch(...);
  --selection-hero-bg: oklch(...); /* 如果 hero 标题需要特殊处理 */
}
```

2. 仍然保留统一的全局规则（等价于方案 A）：

```css
@layer base {
  ::selection,
  ::-moz-selection {
    background-color: var(--selection-bg);
    color: var(--selection-fg);
  }
}
```

3. 对特定模块做局部覆盖（类比 Vercel 的 stats/snippet）：

```css
@layer base {
  /* 代码 / snippet 选中时使用不同背景，提升可读性 */
  .prose pre::selection,
  .prose code::selection {
    background-color: var(--selection-code-bg);
  }

  /* 渐变大标题被选中时，强制还原为纯前景色，避免阅读困难 */
  .gradient-heading::selection {
    -webkit-text-fill-color: var(--foreground);
  }
}
```

**复杂度 / 风险评估：**
- 复杂度：★★☆☆☆（2–3/5）
- 需要：
  - 设计侧确认不同场景的视觉规范；
  - 前端维护一份较清晰的语义变量列表；
- 收益：
  - 选中高亮完全融入 Design System，后续改版成本极低。

> 建议在方案 A 跑通、验证体验后，再按需求升级到方案 B。

---

## 4. 其他替代实现方案（不作为主推荐）

### 4.1 只用 Tailwind `selection:` 变体做局部控制

- 不改全局 CSS，只在局部组件上使用 Tailwind 内置变体：

```tsx
<p className="selection:bg-primary/15 selection:text-primary-foreground">
  {t('home.hero.description')}
</p>
```

- 优点：
  - 不触碰全局样式；
  - 可针对关键模块（Hero、CTA、KPI 等）单独优化。
- 缺点：
  - 不易保证全站一致性；
  - 容易遗漏，维护成本高于“设计系统级统一方案”。

### 4.2 引入第三方 UI 库（不推荐）

- 理论上可以引入某些模仿 Vercel / Geist 的 UI 库，它们内部可能已经设置了 `::selection` 样式；
- 但这样会：
  - 引入第二套 UI/样式系统，与现有 shadcn/ui + Tailwind 体系冲突；
  - 增加 bundle 体积和认知负担；
  - 与当前“单一 UI 系统 + 严格质量控制”的方向不符。

> 结论：**不推荐为选中高亮专门引入新的 UI 组件库**。

---

## 5. 建议与后续 TODO

### 5.1 实施建议

1. 采用 **方案 A** 作为首阶段落地：
   - 在 `globals.css` 中增加 `--selection-background` / `--selection-foreground`；
   - 在 `@layer base` 中增加统一的 `::selection` / `::-moz-selection` 样式；
   - 输出一版暗/亮主题下的视觉 preview 供设计确认。

2. 如后续有更精细需求，再评估升级到 **方案 B**：
   - 对代码块、Hero 标题、渐变 KPI 区等模块增加局部覆盖；
   - 同步维护到 UI 设计规范文档。

### 5.2 TODO 列表（功能待办）

- [ ] 与设计确认 OKLCH 选中色（亮/暗模式各一组），是否沿用 `--primary` 色阶；
- [ ] 在 `src/app/globals.css` 中按方案 A 增加变量与全局 `::selection` 规则；
- [ ] 本地验证不同页面（中文/英文、MDX 内容、表格/代码块）在选中时的可读性；
- [ ] 如有需要，为代码区域和渐变标题按方案 B 增加局部覆盖；
- [ ] 将最终规范沉淀到 UI Design System 文档中（例如 `docs/technical-doc/质量保障` 或 UI 规范）。

