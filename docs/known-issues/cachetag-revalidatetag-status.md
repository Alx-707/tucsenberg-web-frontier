# Cache Components 中 cacheTag / revalidateTag 细粒度失效当前状态说明

## 1. 背景

- 已启用：Next.js 16 + App Router + `cacheComponents: true`。
- 当前实际使用到的 Cache Components 能力：
  - 若干数据函数内使用 `"use cache" + cacheLife()`，例如首页 hero 文案、Contact 文案等；
  - i18n 消息加载使用 `unstable_cache` 的 `revalidate` + `tags` 做基础缓存。
- 规划文档多次提到要在未来接入 `cacheTag()` / `revalidateTag()` 做**更细粒度**的缓存失效控制，但尚未真正落地。

## 2. 代码层面的现状

### 2.1 已存在的缓存相关实现

1. **i18n 外部化消息缓存（使用 `unstable_cache`）**

- 位置：`src/lib/load-messages.ts`
- 关键片段示例：

<augment_code_snippet path="src/lib/load-messages.ts" mode="EXCERPT">
````ts
export const loadCriticalMessages = unstable_cache(
  async (locale: Locale) => { /* ... */ },
  ['i18n-critical'],
  {
    revalidate: getRevalidateTime(),
    tags: ['i18n', 'critical'],
  },
);
````
</augment_code_snippet>

- 说明：
  - 这里使用的是 `unstable_cache` 自带的 `revalidate` + `tags`；
  - **还没有**在应用层显式调用 `revalidateTag()` 去按 tag 触发失效；
  - 更接近“缓存配置 + 定时刷新”，而不是“业务事件驱动的细粒度失效”。

2. **Cache Components 数据函数（仅使用 `cacheLife`）**

- 示例位置：`src/app/[locale]/page.tsx`、`src/lib/contact/getContactCopy.ts` 等。
- 典型模式：

<augment_code_snippet path="src/app/[locale]/page.tsx" mode="EXCERPT">
````ts
async function getHomeHeroMessages(locale: 'en' | 'zh') {
  'use cache';
  cacheLife('days');
  // 加载首页关键文案
}
````
</augment_code_snippet>

- 说明：
  - 目前只用 `cacheLife()` 控制缓存时间；
  - **没有**为这些数据函数添加 `cacheTag()`；
  - 因此也不存在任何 `revalidateTag()` 的实际调用点。

3. **内容 wrapper 设计（为未来 cacheTag 预留）**

- 类型定义：`src/types/content.ts`
- 文档说明：`docs/cache-components-content-wrappers.md`
- 文档中给出了“未来可能的实现示例”：

<augment_code_snippet path="docs/cache-components-content-wrappers.md" mode="EXCERPT">
````ts
import { cacheLife, cacheTag } from 'next/cache';

export const getAllPostsCached: GetAllPostsCachedFn = async (locale, options) => {
  'use cache';
  cacheLife('days');
  cacheTag(['blog', locale]);
  // 下面保持与当前实现一致
};
````
</augment_code_snippet>

- 说明：
  - 这只是**文档示例**，真实代码中目前没有 `cacheTag(` / `revalidateTag(` 的实现；
  - blog/products 的 wrapper 目前只在类型与设计层面保证“将来适配 cacheTag 不会打破调用方式”。

### 2.2 明确尚未实现的部分

- 全局检索结果：
  - 源码中没有任何 `cacheTag(` 或 `revalidateTag(` 的真实调用；
  - 只有文档和注释中的示意代码。
- 结论：
  - **“基于 cacheTag / revalidateTag 的细粒度失效”在当前项目中尚未真正启用。**

## 3. 影响与风险评估

- 对当前 B2B 官网场景：
  - 内容更新频率不高，依赖 `cacheLife()` + `revalidate` 的时间维度刷新，已能满足大部分需求；
  - 没有 cacheTag 并不会影响站点可用性和稳定性，只是**“无法精确地只刷新单篇内容 / 单个 locale 片段”**。
- 对未来高频内容更新场景（例如完整 blog / products 系统）：
  - 若没有 cacheTag：
    - 需要更频繁地缩短 `cacheLife()` / `revalidate`，牺牲一部分性能换取更新及时性；
    - 或依赖“全站级别”的 rebuild / 部署来刷新缓存，运维成本更高。

## 4. 后续建议（简要）

> 仅作为备忘，不代表必须立即执行。

1. **选一个切入点试点 cacheTag**
   - 建议先从未来的 blog/products 内容 wrapper 入手：
     - 为列表/详情数据函数设计 tag 规则（如 `['blog', locale]`、`['product', locale, slug]`）。
   - 在 wrapper 内部添加 `cacheTag([...])`，并保留现有 `cacheLife()`。

2. **再引入 revalidateTag 的触发方**
   - 需要一个明确的“谁来触发失效”：
     - 管理后台 API、内容发布脚本、或 CI Hook；
   - 再通过 `revalidateTag('blog')` / `revalidateTag(['product', locale, slug])` 等方式做事件驱动的刷新。

3. **在文档层面保持同步**
   - 一旦有具体模块开始使用 `cacheTag` / `revalidateTag`，建议在：
     - `docs/cache-components-content-wrappers.md`；
     - `docs/known-issues/nextjs-i18n-future-upgrade-checklist.md`
   - 补充对应的“实际实现位置”和“触发策略”说明，以便后续维护。
