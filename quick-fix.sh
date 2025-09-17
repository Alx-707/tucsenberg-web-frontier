#!/bin/bash
# quick-fix.sh - 快速修复关键问题

echo "🔧 开始快速修复..."

# 1. 修复导入路径问题
echo "📁 修复导入路径..."
find src -name "*.ts" -type f -exec sed -i 's|@/../env.mjs|../../env.mjs|g' {} \;

# 2. 添加缺失的常量导入
echo "📦 添加缺失常量导入..."

# 修复 DAYS_PER_MONTH 导入
files_with_days_per_month=$(grep -l "DAYS_PER_MONTH" src/lib/*.ts 2>/dev/null || true)
for file in $files_with_days_per_month; do
  if ! grep -q "import.*DAYS_PER_MONTH" "$file"; then
    echo "添加 DAYS_PER_MONTH 导入到 $file"
    sed -i '1i import { DAYS_PER_MONTH } from "@/constants/time";' "$file"
  fi
done

# 修复 MAGIC_16 导入
files_with_magic_16=$(grep -l "MAGIC_16" src/lib/*.ts 2>/dev/null || true)
for file in $files_with_magic_16; do
  if ! grep -q "import.*MAGIC_16" "$file"; then
    echo "添加 MAGIC_16 导入到 $file"
    sed -i '1i import { MAGIC_16 } from "@/constants/count";' "$file"
  fi
done

# 修复 PERCENTAGE_QUARTER 导入
files_with_percentage=$(grep -l "PERCENTAGE_QUARTER" src/lib/*.ts 2>/dev/null || true)
for file in $files_with_percentage; do
  if ! grep -q "import.*PERCENTAGE_QUARTER" "$file"; then
    echo "添加 PERCENTAGE_QUARTER 导入到 $file"
    sed -i '1i import { PERCENTAGE_QUARTER } from "@/constants/decimal";' "$file"
  fi
done

# 修复其他常见的缺失常量
declare -A constant_imports=(
  ["MAGIC_0_9"]="@/constants/decimal"
  ["MAGIC_1_5"]="@/constants/decimal"
  ["MAGIC_80"]="@/constants/count"
  ["MAGIC_40"]="@/constants/count"
  ["MAGIC_0_5"]="@/constants/decimal"
  ["MAGIC_0_6"]="@/constants/decimal"
  ["MAGIC_1_1"]="@/constants/decimal"
  ["MAGIC_0_3"]="@/constants/decimal"
  ["MAGIC_512"]="@/constants/count"
  ["MAGIC_255"]="@/constants/count"
  ["MAGIC_32"]="@/constants/count"
  ["MAGIC_64"]="@/constants/count"
  ["MAGIC_12"]="@/constants/count"
  ["MAGIC_6"]="@/constants/count"
  ["MAGIC_8"]="@/constants/count"
  ["MAGIC_15"]="@/constants/count"
  ["MAGIC_20"]="@/constants/count"
  ["MAGIC_48"]="@/constants/count"
  ["DAYS_PER_YEAR"]="@/constants/time"
  ["HOURS_PER_DAY"]="@/constants/time"
  ["SECONDS_PER_MINUTE"]="@/constants/time"
  ["MINUTES_PER_HOUR"]="@/constants/time"
)

for constant in "${!constant_imports[@]}"; do
  import_path="${constant_imports[$constant]}"
  files_with_constant=$(grep -l "$constant" src/lib/*.ts 2>/dev/null || true)
  for file in $files_with_constant; do
    if ! grep -q "import.*$constant" "$file"; then
      echo "添加 $constant 导入到 $file"
      sed -i "1i import { $constant } from \"$import_path\";" "$file"
    fi
  done
done

# 3. 修复语法错误
echo "🔧 修复语法错误..."
if [ -f "scripts/magic-numbers/collect-existing-constants.ts" ]; then
  sed -i '17s/.*/\/\* 扫描 src\/constants\/**\/*.ts 和 src\/config\/**\/*.ts 的命名导出 \*\//' scripts/magic-numbers/collect-existing-constants.ts
  echo "修复了 collect-existing-constants.ts 的语法错误"
fi

# 4. 修复十六进制常量导入
hex_constants=("HEX_BYTE_MAX" "HEX_JPEG_MARKER_1" "HEX_PNG_SIGNATURE_1" "HEX_PNG_SIGNATURE_2" "HEX_PNG_SIGNATURE_3" "HEX_PNG_SIGNATURE_4" "HEX_PNG_SIGNATURE_5" "HEX_PNG_SIGNATURE_6" "HEX_PDF_MARKER" "HEX_PDF_SIGNATURE_1" "HEX_ZIP_SIGNATURE" "MAGIC_HEX_03" "MAGIC_HEX_04" "MAGIC_HEX_3" "MAGIC_HEX_8" "HEX_MASK_LOW_NIBBLE" "HEX_MASK_BIT_6" "HEX_MASK_6_BITS" "HEX_MASK_HIGH_BIT")

for constant in "${hex_constants[@]}"; do
  files_with_hex=$(grep -l "$constant" src/lib/*.ts 2>/dev/null || true)
  for file in $files_with_hex; do
    if ! grep -q "import.*$constant" "$file"; then
      echo "添加 $constant 导入到 $file"
      sed -i "1i import { $constant } from \"@/constants/hex\";" "$file"
    fi
  done
done

# 5. 清理重复的导入
echo "🧹 清理重复导入..."
find src -name "*.ts" -type f -exec awk '!seen[$0]++' {} \; -exec mv {} {}.tmp \; -exec mv {}.tmp {} \;

# 6. 验证修复结果
echo "✅ 验证修复结果..."
echo "TypeScript 错误数量:"
ts_errors=$(pnpm type-check 2>&1 | grep -c "error TS" || echo "0")
echo "  发现 $ts_errors 个 TypeScript 错误"

echo "ESLint 问题数量:"
eslint_problems=$(pnpm lint:check 2>&1 | grep -o "[0-9]* problems" | head -1 || echo "0 problems")
echo "  发现 $eslint_problems"

echo "构建状态:"
if pnpm build:check >/dev/null 2>&1; then
  echo "  ✅ 构建成功"
else
  echo "  ❌ 构建仍然失败"
fi

echo ""
echo "🎉 快速修复完成！"
echo ""
echo "📋 下一步建议："
echo "1. 运行 'pnpm type-check' 检查剩余的 TypeScript 错误"
echo "2. 运行 'pnpm lint:fix' 自动修复可修复的 ESLint 问题"
echo "3. 运行 'pnpm format:write' 格式化代码"
echo "4. 运行 'pnpm test' 检查测试状态"
echo "5. 运行 'pnpm build' 验证完整构建"
