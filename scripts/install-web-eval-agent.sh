#!/bin/bash

# Web Eval Agent MCP 服务器安装脚本
# 自动安装和配置 Web Eval Agent MCP 服务器

set -e

echo "🚀 开始安装 Web Eval Agent MCP 服务器..."

# 配置变量
INSTALL_DIR="/Users/Data/Tool/MCP/web-eval-agent"
API_KEY="op-fkcf158yu3ClkhQfxgRI6dHXIDSTVDZy2016vtTsn_M"
REPO_URL="https://github.com/operative-sh/web-eval-agent"

# 检查 uv 是否安装
echo "🔍 检查 uv 包管理器..."
if ! command -v uv &> /dev/null; then
    echo "❌ uv 未安装，正在安装..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    source ~/.bashrc
else
    echo "✅ uv 已安装: $(uv --version)"
fi

# 创建安装目录
echo "📁 创建安装目录..."
mkdir -p "$(dirname "$INSTALL_DIR")"

# 检查是否已经安装
if [ -d "$INSTALL_DIR" ]; then
    echo "⚠️  Web Eval Agent 目录已存在，正在更新..."
    cd "$INSTALL_DIR"
    git pull origin main || echo "⚠️  Git pull 失败，继续安装..."
else
    echo "📥 克隆 Web Eval Agent 仓库..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# 检查项目文件
echo "🔍 检查项目文件..."
if [ ! -f "pyproject.toml" ]; then
    echo "❌ pyproject.toml 不存在，可能不是正确的 Web Eval Agent 仓库"
    exit 1
fi

# 安装依赖
echo "📦 安装 Python 依赖..."
uv sync

# 检查是否有 Playwright 依赖
echo "🎭 检查 Playwright 依赖..."
if uv run python -c "import playwright" 2>/dev/null; then
    echo "✅ Playwright 已安装"
else
    echo "📦 安装 Playwright..."
    uv add playwright
    uv run playwright install
fi

# 创建启动脚本
echo "📝 创建启动脚本..."
cat > "$INSTALL_DIR/start-web-eval-agent.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
export OPENAI_API_KEY="op-fkcf158yu3ClkhQfxgRI6dHXIDSTVDZy2016vtTsn_M"
uv run web-eval-agent
EOF

chmod +x "$INSTALL_DIR/start-web-eval-agent.sh"

# 测试安装
echo "🧪 测试 Web Eval Agent 安装..."
export OPENAI_API_KEY="$API_KEY"

# 尝试运行帮助命令
if uv run web-eval-agent --help &> /dev/null; then
    echo "✅ Web Eval Agent 安装成功"
else
    echo "⚠️  Web Eval Agent 可能需要额外配置"
fi

# 生成 Claude Desktop 配置
echo "📋 生成 Claude Desktop 配置..."
cat > "$INSTALL_DIR/claude-desktop-config.json" << EOF
{
  "mcpServers": {
    "web-eval-agent": {
      "command": "uv",
      "args": [
        "--directory",
        "$INSTALL_DIR",
        "run",
        "web-eval-agent"
      ],
      "env": {
        "OPENAI_API_KEY": "$API_KEY"
      }
    }
  }
}
EOF

echo "✅ Web Eval Agent MCP 服务器安装完成！"
echo ""
echo "📋 下一步操作："
echo "1. 将以下配置添加到 Claude Desktop 配置文件："
echo "   macOS: ~/Library/Application Support/Claude/claude_desktop_config.json"
echo ""
cat "$INSTALL_DIR/claude-desktop-config.json"
echo ""
echo "2. 重启 Claude Desktop"
echo "3. 在项目中运行: pnpm test:verify-integration"
echo ""
echo "🎯 安装路径: $INSTALL_DIR"
echo "🔑 API Key: $API_KEY"
