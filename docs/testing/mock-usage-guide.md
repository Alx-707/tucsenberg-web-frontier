# 测试 Mock 使用指南

本指南说明如何在本项目中使用集中化的测试 mock 消息与工具函数，统一 `next-intl`、主题与浏览器相关的测试行为。

## 1. 集中 mock 常量概述

集中 mock 消息定义在：

- `src/test/constants/mock-messages.ts`

按命名空间组织（节选）：

- `commonMessages`：通用 UI 文本（loading、error、success、toast 文案等）
- `navigationMessages`：导航链接与说明文案
- `accessibilityMessages`：无障碍相关文本（screen reader 等）
- `themeMessages`：主题切换相关文案
- `languageMessages`：语言切换 / 检测相关文案
- `errorBoundaryMessages`：错误边界组件文案
- `seoMessages`：SEO、metadata 相关文案
- `footerMessages`：页脚文案
- `underConstructionMessages`：施工中页面文案
- `combinedMessages`：以上命名空间的聚合对象

典型用法：

```ts
import {
  combinedMessages,
  navigationMessages,
  languageMessages,
} from '@/test/constants/mock-messages';

// 使用全部 mock 消息
renderWithIntl(<Component />, 'en', combinedMessages);

// 只按需使用部分命名空间
renderWithIntl(<Component />, 'en', {
  navigation: navigationMessages,
  language: languageMessages,
});
```

## 2. 测试工具函数使用指南

所有测试工具都从 `src/test/utils.tsx` 导出。

### 2.1 `renderWithIntl(ui, locale?, partialMessages?)`

- **参数**：
  - `ui`：要渲染的 React 元素
  - `locale`：可选语言代码，默认 `'en'`
  - `partialMessages`：可选的局部消息对象，会通过深度合并覆盖 `combinedMessages`

示例：

```ts
import { renderWithIntl } from '@/test/utils';

// 使用默认集中 mock
renderWithIntl(<MyComponent />);

// 指定语言 + 覆写部分命名空间
renderWithIntl(<MyComponent />, 'zh', {
  navigation: { home: '自定义首页' },
});
```

### 2.2 `createMockTranslations(messages?)`

用于构造 `useTranslations` 的返回函数，基于集中 mock 或自定义 key-value：

```ts
import { createMockTranslations } from '@/test/utils';

// 使用默认集中 mock 扁平化
const t = createMockTranslations();

// 覆写个别 key（扁平格式）
const tCustom = createMockTranslations({
  'navigation.home': 'Custom Home',
  'common.loading': 'Custom Loading... ',
});

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => tCustom),
}));
```

### 2.3 `createNextIntlMocks` 与 `applyNextIntlMocks`

`src/test/mock-utils.ts` 提供更完整的 next-intl mock 方案：

```ts
import {
  createNextIntlMocks,
  applyNextIntlMocks,
} from '@/test/mock-utils';

const nextIntlMocks = createNextIntlMocks();

beforeAll(() => {
  applyNextIntlMocks(nextIntlMocks);
});
```

该组合会统一 mock：`useTranslations`、`useLocale`、`useMessages`、`useFormatter`、`useNow`、`useTimeZone`、`next-intl/link` 与 `next-intl/navigation`，并提供一个最小实现的 `NextIntlClientProvider`，保证与 `renderWithIntl` 协同工作。

## 3. 迁移指南

### 3.1 从旧的 layout `test-utils` 迁移

原路径：`src/components/layout/__tests__/test-utils.ts`（现已删除）。

旧用法：

```ts
// 迁移前
import {
  renderWithProviders,
  mockMessages,
} from '@/components/layout/__tests__/test-utils';

renderWithProviders(<Header />);
```

迁移后：

```ts
import { renderWithIntl } from '@/test/utils';
import { combinedMessages } from '@/test/constants/mock-messages';

renderWithIntl(<Header />, 'en', combinedMessages);
```

### 3.2 从内联 `mockMessages` 迁移

典型的“在测试文件里手写翻译表”的写法推荐迁移为：

```ts
import { createMockTranslations } from '@/test/utils';

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() =>
    createMockTranslations({
      'navigation.home': 'Home (Test)',
    }),
  ),
}));
```

### 3.3 何时可以保留局部 mock

以下场景可以保留独立的局部 mock（需在文件顶部加中文注释说明原因）：

- 验证 i18n 核心配置与消息加载形状（如 `tests/unit/i18n.test.ts`）
- 验证“完整的真实消息树行为”的综合集成测试（如 `tests/integration/i18n-components.test.tsx`）
- 需要构造与生产消息结构高度对齐的特殊边界场景

## 4. 推荐验证命令

- Layout 测试：`pnpm vitest run src/components/layout/__tests__/`
- Integration 测试：`pnpm vitest run tests/integration/`
- Unit 测试：`pnpm vitest run tests/unit/`
- 完整测试套件：`pnpm test`
- 类型检查：`pnpm type-check`
- Lint 检查：`pnpm lint:check`

## 5. 常见问题与最佳实践

- **特殊翻译场景**：优先使用 `partialMessages` 或 `createMockTranslations` 的参数覆盖，避免在多个测试文件中重复手写翻译表。
- **深度合并注意事项**：`partialMessages` 会与 `combinedMessages` 进行深度合并，只需要提供需要覆写的最小子树，避免整颗命名空间复制。
- **`vi.hoisted` 中避免引用 import 变量**：在 `vi.hoisted(() => ({ ... }))` 中不要访问 `combinedMessages` 等 import 变量，否则可能触发 `ReferenceError`；在此类场景请直接使用字面量 mock 对象。
- **局部 mock 必须有注释**：如果为了验证配置或行为刻意保留局部 mock，请在测试文件顶部添加注释，说明“不复用集中 mock 的原因”，便于团队后续维护。
