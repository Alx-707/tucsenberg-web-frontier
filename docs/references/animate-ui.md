# Animate UI 简介（供 AI 使用）

> 用途：帮助 AI 在对话中正确理解并引用 Animate UI，避免将其误认为传统 npm 组件库。

## 1. Animate UI 是什么？

- Animate UI 是一套 **“可复制源码的动画组件分发（open component distribution）”**，不是传统的黑盒 UI 库。
- 设计思路与 **shadcn/ui** 类似：
  - 通过 **shadcn CLI** 把组件源码拷贝进项目；
  - 在本地按需要自由修改样式、交互和类型；
  - 组件以 **React + TypeScript + Tailwind CSS + Motion** 为基础实现。
- 官方定位：为 React 项目提供一套 **动画优先（animation‑first）** 的 primitives、组件和图标集合。

## 2. 主要能力与内容结构

大致分三层能力（AI 在对话中可以按此结构理解）：

1. **Animated Primitives（基础动画单元）**
   - 例如：`fade`、`slide`、`zoom`、`shine`、`tilt`、`image-zoom`、`magnetic`、`particles` 等效果；
   - `texts/` 中提供文字/数字动画，如 `typing`、`sliding-number`；
   - 这些 primitives 一般是 **Client Component**，内部使用 `motion` 实现动画。

2. **Components（组合组件）**
   - 基于 primitives 和 Radix UI 等 primitives 封装的完整 UI 组件；
   - 典型示例：`Avatar Group`、`Tabs`、`Tooltip`、`Cursor`、`Code`、`Code Tabs`、`GitHub Stars Wheel` 等；
   - 适合用于首页 hero、KPI 区、产品/方案切换区等高曝光区域。

3. **Animated Icons（动态图标）**
   - 基于 `lucide-react` 图标 + Motion 动画；
   - 支持 hover / loop / scroll 等触发方式，用于强化品牌细节和交互反馈。

## 3. 与本项目技术栈的关系

- Animate UI 的技术栈与本项目 **高度兼容**：
  - React 19 + TypeScript 5 + Tailwind CSS 4；
  - 使用 Radix UI、`lucide-react`、`tailwind-merge`、`clsx` 等，都已在本项目生态中出现；
  - 动画库采用 `motion`（Framer 新一代动画库），可作为本项目默认动画基建候选。
- 唯一明显差异在于文档站使用的是 **Next.js 15**，而本项目是 **Next.js 16 + Cache Components**：
  - 但 Animate UI 组件本质是普通 React Client Components，对 Next 版本并不强耦合；
  - 在本项目中应将其作为 **Client Component 小岛**，挂载在 Server Component 页面上。

## 4. 正确的使用/集成心智模型（给 AI 的规则）

1. **永远把 Animate UI 当作“源码分发 + 动画模式集合”，不要当作单一 npm UI 库。**
   - 典型使用方式是：通过 shadcn CLI `add @animate-ui/...` 把组件复制到 `src/components/animate-ui/...`，然后按项目规范改造。

2. **在本项目中，它是对现有 shadcn/ui 设计系统的“补充动画层”，不是替代品。**
   - shadcn/ui：负责结构、可访问性、基础 UI 形态；
   - Animate UI：提供统一、可复用的 **动效 primitives 和动画模式**；
   - 推荐用法：在业务组件中组合使用（例如 KPI 数字区、CTA 按钮、产品卡片），而不是大面积替换全部组件。

3. **所有 Animate UI 组件应视为 Client Components，并严格遵守本项目的 RSC 边界与 i18n 规范。**
   - 页面与布局保持 Server Components + Cache Components；
   - 动画组件在独立 `"use client"` 包装中使用；
   - 组件内部不要硬编码展示文案，文案应通过 next-intl 或 props 传入。

## 5. 适合回答中的典型使用场景（示例级别）

在对话里，AI 可以优先将 Animate UI 与以下业务场景绑定：

- 首页 KPI/统计区：使用 `sliding-number` 等数字动画凸显指标；
- 主 CTA 按钮：使用 `shine` / 轻量 hover 动画提高点击意愿；
- 产品/方案卡片：使用 `tilt` / `magnetic` 等微交互提升交互感；
- 图文详情与图库：使用 `image-zoom` 等动效突出产品细节；
- 专业术语解释：结合带动画的 `Tooltip` / `Hover Card`，提升可读性与专业度。

> AI 在引用 Animate UI 时，应围绕“**动画模式 + primitives + 与 shadcn/ui 协同使用**”这几个关键词展开，而不是将其描述为一个完全独立、封闭的 UI 框架。
