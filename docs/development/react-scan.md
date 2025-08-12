# React Scan 性能监控工具

React Scan 是一个强大的开发工具，用于实时监控 React 组件的渲染性能，帮助识别不必要的重新渲染和性能瓶颈。

## 🚀 快速开始

### 自动启用 React Scan

React Scan 现在**自动跟随开发服务器启用**，无需手动配置！

1. **启动开发服务器**：
   ```bash
   # React Scan 自动启用
   pnpm dev
   ```

2. **查看监控界面**：
   - 打开浏览器开发者工具
   - 在页面左下角会显示 "🔍 React Scan Active" 指示器
   - 右下角会显示控制面板

3. **可选：禁用 React Scan**：
   ```bash
   # 方式一：环境变量禁用
   echo "NEXT_PUBLIC_DISABLE_REACT_SCAN=true" >> .env.local
   pnpm dev

   # 方式二：使用禁用脚本
   pnpm dev:no-scan
   ```

### 工作流程详解

#### 第一步：自动启用机制
React Scan 现在**自动跟随开发服务器启用**，设计原则：
- **开发环境自动启用**：启动 `pnpm dev` 即自动启用
- **生产环境强制禁用**：确保生产构建不包含监控代码
- **可选择性禁用**：开发者可以选择在开发环境中禁用

#### 第二步：启用/禁用方式

**默认启用（推荐）**
```bash
# React Scan 自动启用
pnpm dev
```

**可选禁用方式**
```bash
# 方式一：环境变量禁用
echo "NEXT_PUBLIC_DISABLE_REACT_SCAN=true" >> .env.local
pnpm dev

# 方式二：使用禁用脚本
pnpm dev:no-scan
```

#### 第三步：视觉标识
启动后，你会看到以下标识：

1. **左下角蓝色指示器**：
   ```
   🔍 React Scan Active
   ```
   - 带有脉动动画的白色圆点
   - 确认 React Scan 已成功启动

2. **右下角控制面板**：
   ```
   React Scan Controls
   • Press Ctrl+Shift+X to toggle
   • Red highlights = unnecessary renders
   • Green highlights = optimized renders
   ```

3. **组件高亮效果**：
   - **红色高亮**：检测到不必要的重新渲染
   - **绿色高亮**：组件渲染已优化
   - **动画效果**：渲染频率的视觉反馈

#### 第四步：性能分析
React Scan 会自动：
- 监控所有 React 组件的渲染
- 检测不必要的重新渲染
- 在浏览器控制台输出性能警告
- 提供实时的视觉反馈

## 🎯 功能特性

### 实时渲染监控
- **红色高亮**：标识不必要的重新渲染
- **绿色高亮**：标识优化良好的渲染
- **动画效果**：直观显示渲染频率

### 性能分析
- **渲染次数统计**：跟踪组件渲染频率
- **性能警告**：自动检测渲染次数过多的组件
- **回调集成**：与现有性能监控系统集成

### 开发者友好
- **零配置**：开箱即用的默认配置
- **动态加载**：不影响生产构建
- **可视化指示器**：清晰的状态显示

## ⚙️ 配置选项

### 基础配置

React Scan 的配置位于 `src/lib/react-scan-config.ts`：

```typescript
export const DEFAULT_REACT_SCAN_CONFIG: ReactScanConfig = {
  enabled: process.env.NODE_ENV === 'development',
  showToolbar: true,
  log: false, // 避免控制台噪音
  trackUnnecessaryRenders: true, // 检测不必要的渲染
  animationSpeed: 'fast',
};
```

### 自定义配置

可以通过修改 `ReactScanProvider` 组件来自定义配置：

```typescript
scan({
  enabled: true,
  showToolbar: true,
  log: false,
  trackUnnecessaryRenders: true,
  animationSpeed: 'fast',

  // 自定义回调
  onRender: (fiber, renders) => {
    if (renders.length > 5) {
      console.warn(`🐌 Component ${fiber.type?.name || 'Unknown'} rendered ${renders.length} times`);
    }
  },
});
```

## 🔧 使用指南

### 键盘快捷键
- **Ctrl+Shift+X**：切换 React Scan 显示/隐藏
- **Ctrl+Shift+C**：清除渲染历史记录

### 性能优化建议

当 React Scan 检测到性能问题时：

1. **识别问题组件**：
   - 红色高亮的组件需要优化
   - 关注渲染次数过多的组件

2. **常见优化方法**：
   ```typescript
   // 使用 React.memo 防止不必要的渲染
   const OptimizedComponent = React.memo(MyComponent);

   // 使用 useMemo 缓存计算结果
   const expensiveValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

   // 使用 useCallback 缓存函数引用
   const handleClick = useCallback(() => {
     // 处理点击事件
   }, [dependency]);
   ```

3. **检查依赖项**：
   - 确保 useEffect、useMemo、useCallback 的依赖项正确
   - 避免在依赖项中使用对象或数组字面量

## 📊 性能监控集成

### 与现有监控系统集成

React Scan 已与项目的性能监控系统集成：

```typescript
// 在 ReactScanProvider 中
onRender: (fiber, renders) => {
  // 集成到现有的性能监控系统
  if (renders.length > 5) {
    console.warn(`🐌 Component ${fiber.type?.name || 'Unknown'} rendered ${renders.length} times`);
  }
},
```

### Web Vitals 集成

React Scan 与 Web Vitals 监控协同工作：
- 识别影响 CLS（累积布局偏移）的组件
- 监控影响 FCP（首次内容绘制）的渲染
- 跟踪影响 LCP（最大内容绘制）的组件

## 🚫 生产环境安全

### 自动排除机制
- **环境检测**：只在开发环境启用
- **动态导入**：使用 dynamic import 避免打包到生产构建
- **条件渲染**：通过环境变量控制组件渲染

### 构建优化
```typescript
// 生产构建时自动排除
if (process.env.NODE_ENV === 'development') {
  // React Scan 相关代码
}
```

## 🛠️ 故障排除

### 常见问题

1. **React Scan 未启动**：
   - 检查环境变量 `NEXT_PUBLIC_ENABLE_REACT_SCAN=true`
   - 确认在开发环境运行 `NODE_ENV=development`
   - 查看控制台是否有错误信息

2. **指示器未显示**：
   - 刷新页面重新加载组件
   - 检查浏览器控制台错误
   - 确认组件正确导入

3. **性能影响**：
   - React Scan 仅在开发环境运行
   - 如需临时禁用，设置 `NEXT_PUBLIC_ENABLE_REACT_SCAN=false`

### 调试模式

启用详细日志：

```typescript
// 在 react-scan-config.ts 中
export const DEFAULT_REACT_SCAN_CONFIG: ReactScanConfig = {
  // ...其他配置
  log: true, // 启用详细日志
};
```

## 📚 相关资源

- [React Scan GitHub](https://github.com/aidenybai/react-scan)
- [React 性能优化指南](https://react.dev/learn/render-and-commit)
- [项目性能监控文档](./performance-monitoring.md)

## 🤝 贡献

如需改进 React Scan 集成：

1. 修改配置文件：`src/lib/react-scan-config.ts`
2. 更新组件：`src/components/dev-tools/react-scan-provider.tsx`
3. 测试功能：`pnpm dev:scan`
4. 提交更改：遵循项目的提交规范
