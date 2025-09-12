#!/bin/bash

# 修复动态导入中不存在的组件
# 将所有不存在的组件导入注释掉

echo "开始修复动态导入文件..."

# 不存在的组件列表
MISSING_COMPONENTS=(
    "dev-tools-settings"
    "dev-tools-shortcuts" 
    "component-tree-viewer"
    "state-inspector"
    "network-request-monitor"
    "console-viewer"
    "error-boundary-viewer"
    "react-scan-suite"
    "debug-tools-suite"
    "performance-dashboard"
    "locale-detection-demo"
    "translation-preloader"
    "language-switcher"
    "translation-editor"
    "translation-validator"
    "smart-locale-detector"
    "geo-locale-detector"
    "browser-locale-detector"
    "translation-cache-manager"
    "translation-analytics"
    "translation-quality-checker"
    "translation-import-export"
    "multilingual-text"
    "locale-formatter"
    "datetime-localizer"
    "number-localizer"
    "currency-localizer"
    "web-vitals-indicator"
    "theme-performance-monitor"
    "memory-monitor"
    "render-monitor"
    "network-monitor"
    "bundle-analyzer"
    "metrics-collector"
    "performance-alerts"
    "performance-reporter"
    "monitoring-suite"
    "lightweight-monitor"
    "component-showcase"
    "tech-stack-showcase"
    "features-showcase"
    "projects-showcase"
    "team-showcase"
    "interactive-demo"
    "code-demo"
    "api-demo"
    "performance-demo"
    "responsive-demo"
    "form-examples"
    "layout-examples"
    "animation-examples"
    "chart-examples"
    "data-visualization-examples"
    "getting-started-tutorial"
    "advanced-tutorial"
    "best-practices-guide"
)

# 处理每个动态导入文件
for file in src/components/shared/dynamic-imports-*.tsx; do
    if [[ -f "$file" ]]; then
        echo "处理文件: $file"
        
        # 为每个缺失的组件创建注释
        for component in "${MISSING_COMPONENTS[@]}"; do
            # 查找并注释掉包含该组件的动态导入
            sed -i '' "/import.*${component}/,/^);$/s/^/\/\/ /" "$file"
            sed -i '' "/export.*Dynamic.*= dynamic(/,/^);$/s/^/\/\/ /" "$file" 2>/dev/null || true
        done
        
        echo "完成处理: $file"
    fi
done

echo "修复完成！"
