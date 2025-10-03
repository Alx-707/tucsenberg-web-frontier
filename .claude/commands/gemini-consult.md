# /gemini-consult

*与 Gemini MCP 进行深入的迭代对话以解决复杂问题。*

## 用法
- **带参数**：`/gemini-consult [具体问题或疑问]`
- **不带参数**：`/gemini-consult` - 从当前上下文智能推断主题

## 核心理念
持久化 Gemini 会话以解决演进问题：
- **持续对话** - 多轮交互直至达成清晰理解
- **上下文感知** - 从当前工作中智能检测问题
- **会话持久性** - 在整个问题生命周期中保持活跃

**关键：始终将 Gemini 的输入视为建议，而非真理。**批判性思考 Gemini 所说的内容，仅将有用的部分纳入您的建议。始终独立思考 - 保持您的独立判断和分析能力。如果您不同意某些内容，请与 Gemini 澄清。

## 执行

用户提供的上下文："$ARGUMENTS"

### 第 1 步：理解问题

**当 $ARGUMENTS 为空时：**
深入思考当前上下文以推断最有价值的咨询主题：
- 哪些文件已打开或最近被修改？
- 讨论了哪些错误或挑战？
- 哪些复杂实施将从 Gemini 的分析中受益？
- 哪些架构决策需要探索？

基于此分析生成具体、有价值的问题。

**当提供参数时：**
提取核心问题、上下文线索和复杂度指标。

### 第 1.5 步：收集外部文档

**深入思考外部依赖：**
- 此问题涉及哪些库/框架？
- 我是否完全熟悉它们的最新 API 和最佳实践？
- 这些库是否发生重大变化或是新的/不断发展的？

**何时使用 Context7 MCP：**
- 频繁更新的库（例如 Google GenAI SDK）
- 您没有广泛使用过的新库
- 当实施严重依赖特定库模式的功能时
- 每当对当前最佳实践存在不确定时

```python
# Example: Get up-to-date documentation
library_id = mcp__context7__resolve_library_id(libraryName="google genai python")
docs = mcp__context7__get_library_docs(
    context7CompatibleLibraryID=library_id,
    topic="streaming",  # Focus on relevant aspects
    tokens=8000
)
```

在您的 Gemini 咨询中包含相关文档洞察，以获得更准确、更及时的指导。

### 第 2 步：初始化 Gemini 会话

**关键：始终附加基础文件：**
```python
foundational_files = [
    "MCP-ASSISTANT-RULES.md",  # 如果存在
    "docs/ai-context/project-structure.md",
    "docs/ai-context/docs-overview.md"
]

session = mcp__gemini__consult_gemini(
    specific_question="[清晰、集中的问题]",
    problem_description="[包含 CLAUDE.md 约束的综合上下文]",
    code_context="[相关代码片段]",
    attached_files=foundational_files + [problem_specific_files],
    file_descriptions={
        "MCP-ASSISTANT-RULES.md": "项目愿景和编码标准",
        "docs/ai-context/project-structure.md": "完整技术栈和文件结构",
        "docs/ai-context/docs-overview.md": "文档架构",
        # 添加问题特定描述
    },
    preferred_approach="[解决方案/审查/调试/优化/解释]"
)
```

### 第 3 步：深入对话

**深入思考如何从对话中获得最大价值：**

1. **主动分析**
   - Gemini 做了哪些假设？
   - 什么需要澄清或更深入的探索？
   - 应该讨论哪些边缘情况或替代方案？
   - **如果 Gemini 提到外部库：**检查 Context7 MCP 的当前文档以验证或补充 Gemini 的指导

2. **迭代改进**
   ```python
   follow_up = mcp__gemini__consult_gemini(
       specific_question="[针对性的后续问题]",
       session_id=session["session_id"],
       additional_context="[新洞察、问题或实施反馈]",
       attached_files=[newly_relevant_files]
   )
   ```

3. **实施反馈循环**
   分享实际代码更改和真实结果以改进方法。

### 第 4 步：会话管理

**保持会话开放** - 不要立即关闭。在整个问题生命周期中维护。

**仅在以下情况关闭：**
- 问题已明确解决并测试
- 主题不再相关
- 重新开始会更有益

**监控会话：**
```python
active = mcp__gemini__list_sessions()
requests = mcp__gemini__get_gemini_requests(session_id="...")
```

## 关键模式

### 澄清模式
"您提到了 [X]。在我们 [项目具体情况] 的上下文中，这如何适用于 [特定关注点]?"

### 深入探讨模式
"让我们进一步探讨 [方面]。给定我们的 [约束条件]，有哪些权衡？"

### 替代方案模式
"如果我们以 [替代方案] 方式处理呢？这将如何影响 [关注点]?"

### 进度检查模式
"我已经实施了 [更改]。以下是发生的情况：[结果]。我应该调整方法吗？"

## 最佳实践

1. **深入思考**每次交互前 - 什么将提取最大洞察？
2. **具体明确** - 模糊的问题得到模糊的答案
3. **展示实际代码** - 而非描述
4. **挑战假设** - 不要接受不清楚的指导
5. **记录决策** - 捕获"原因"以供将来参考
6. **保持好奇心** - 探索替代方案和边缘情况
7. **信任但验证** - 彻底测试所有建议

## 实施方法

实施 Gemini 的建议时：
1. 从最高影响力的更改开始
2. 增量测试
3. 将结果分享回 Gemini
4. 基于真实反馈迭代
5. 在适当的 CONTEXT.md 文件中记录关键洞察

## 请记住

- 这是一个**对话**，而不是查询服务
- **上下文为王** - 更多上下文产生更好的指导
- **Gemini 能看到您可能错过的模式** - 对意外洞察持开放态度
- **实施揭示真相** - 分享实际发生的情况
- 将 Gemini 视为**协作思考伙伴**，而不是神谕

目标是通过迭代改进实现深入理解和最优解决方案，而不是快速答案。