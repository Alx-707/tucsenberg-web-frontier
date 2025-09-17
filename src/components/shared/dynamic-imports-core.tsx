/**
 * 核心动态导入组件 - 主入口
 *
 * 重新导出所有动态导入组件
 */

// 重新导出高优先级组件
export {
  DynamicAnimatedIcon,
  DynamicProgressIndicator,
} from '@/components/shared/dynamic-imports/high-priority';

// 重新导出UI组件
export {
  DynamicAnimatedCounter,
  DynamicCarousel,
  DynamicDropdownMenu,
  DynamicTabs,
} from '@/components/shared/dynamic-imports/ui-components';

// 重新导出配置
export { CoreDynamicComponents } from '@/components/shared/dynamic-imports/exports';
