您正在处理当前项目。在继续用户的请求 "$ARGUMENTS" 之前，您需要使用自适应子代理策略智能地收集相关项目上下文。

## 自动加载的项目上下文：
@/CLAUDE.md
@/docs/ai-context/project-structure.md
@/docs/ai-context/docs-overview.md

## 第 1 步：智能分析策略决策
基于上面自动加载的项目上下文，深入思考最佳方法。基于用户的请求 "$ARGUMENTS" 和项目结构/文档概述，智能决定最佳方法：

### 策略选项：
**直接方法** (0-1 个子代理)：
- 当请求可以通过有针对性的文档阅读和直接分析高效处理时
- 关于现有代码的简单问题或直接任务

**重点调查** (2-3 个子代理)：
- 当对特定领域的深入分析会有助于响应时
- 对于复杂的单一领域问题或需要彻底探索的任务
- 当依赖关系和影响需要仔细评估时

**多视角分析** (3+ 个子代理)：
- 当请求涉及多个领域、组件或技术领域时
- 当全面理解需要不同的分析视角时
- 对于需要仔细依赖映射和影响评估的任务
- 基于实际复杂度而非预定模式扩展代理数量

## 第 2 步：自主子代理设计

### 对于子代理方法：
您完全有自由根据以下内容设计子代理任务：
- **从自动加载的 `/docs/ai-context/project-structure.md` 文件树发现的项目结构**
- **从自动加载的 `/docs/ai-context/docs-overview.md` 获得的文档架构**
- **特定用户请求要求**
- **您对什么调查方法最有效的评估**

**关键：使用子代理时，始终在包含多个 Task 工具调用的单个消息中并行启动它们。切勿顺序启动。**

### 子代理自主原则：
- **自定义专门化**：基于特定请求和项目结构定义代理关注领域
- **灵活范围**：代理可以分析文档、代码文件和架构模式的任何组合
- **自适应覆盖**：确保用户请求的所有相关方面都得到覆盖，避免重叠
- **文档 + 代码**：每个代理都应该阅读相关文档文件并检查实际实施代码
- **依赖映射**：对于涉及代码更改的任务，分析导入/导出关系并识别所有将受影响的文件
- **影响评估**：考虑整个代码库的连锁效应，包括测试、配置和相关组件
- **模式合规性**：确保解决方案遵循项目现有的命名、结构和架构约定
- **清理规划**：对于结构更改，识别应删除的过时代码、未使用的导入和已弃用文件，以防止代码积累
- **网络研究**：可选择性地部署子代理进行网络搜索，当当前最佳实践、安全建议或外部兼容性研究会增强响应时

### 子代理任务设计模板：
```
任务："分析 [SPECIFIC_COMPONENT(S)] 以完成与用户请求 '$ARGUMENTS' 相关的 [TASK_OBJECTIVE]"

标准调查工作流：
1. 审查自动加载的项目上下文（CLAUDE.md、project-structure.md、docs-overview.md）
2. （可选）阅读额外的相关文档文件以获取架构上下文
3. 分析 [COMPONENT(S)] 中的实际代码文件以了解实施现实
4. 对于代码相关任务：映射导入/导出依赖关系并识别受影响的文件
5. 评估对测试、配置和相关组件的影响
6. 验证与项目模式和约定的一致性
7. 对于结构更改：识别应删除的过时代码、未使用的导入和文件

返回从此组件角度解决用户请求的综合发现，包括架构洞察、实施细节、依赖映射和安全执行的实践考虑。"
```

Example Usage:
```
Analysis Task: "Analyze web-dashboard audio processing components to understand current visualization capabilities and identify integration points for user request about adding waveform display"

Implementation Task: "Analyze agents/tutor-server voice pipeline components for latency optimization related to user request about improving response times, including dependency mapping and impact assessment"

Cross-Component Task: "Analyze Socket.IO integration patterns across web-dashboard and tutor-server to plan streaming enhancement for user request about adding live transcription, focusing on import/export changes, affected test files, and cleanup of deprecated socket handlers"
```

## 第 3 步：执行和综合

### 对于子代理方法：
深入思考如何整合所有调查视角的发现。
1. **基于您的战略分析设计和启动自定义子代理**
2. **从所有成功完成的代理收集发现**
3. **通过结合所有视角综合全面理解**
4. **通过处理可用代理发现来处理部分失败**
5. **创建实施计划**（对于代码更改）：包括依赖更新、受影响文件、清理任务和验证步骤
6. **使用来自所有代理的综合知识执行用户请求**

### 对于直接方法：
1. **基于请求分析加载相关文档和代码**
2. **使用针对性上下文直接进行用户请求

## Step 4: Consider MCP Server Usage (Optional)

After gathering context, you may leverage MCP servers for complex technical questions as specified in the auto-loaded `/CLAUDE.md` Section 4:
- **Gemini Consultation**: Deep analysis of complex coding problems
- **Context7**: Up-to-date documentation for external libraries

## Step 5: Context Summary and Implementation Plan

After gathering context using your chosen approach:
1. **Provide concise status update** summarizing findings and approach:
   - Brief description of what was discovered through your analysis
   - Your planned implementation strategy based on the findings
   - Keep it informative but concise (2-4 sentences max)

Example status updates:
```
"Analysis revealed the voice pipelines use Socket.IO for real-time communication with separate endpoints for each pipeline type. I'll implement the new transcription feature by extending the existing Socket.IO event handling in both the FastAPI backend and SvelteKit frontend, following the established pattern used in the Gemini Live pipeline. This will require updating 3 import statements and adding exports to the socket handler module."

"Found that audio processing currently uses a modular client architecture with separate recorder, processor, and stream-player components. I'll add the requested audio visualization by creating a new component that taps into the existing audio stream data and integrates with the current debug panel structure. The implementation will follow the existing component patterns and requires updates to 2 parent components for proper integration."
```

2. **Proceed with implementation** of the user request using your comprehensive understanding

## Optimization Guidelines

- **Adaptive Decision-Making**: Choose the approach that best serves the specific user request
- **Efficient Resource Use**: Balance thoroughness with efficiency based on actual complexity
- **Comprehensive Coverage**: Ensure all aspects relevant to the user's request are addressed
- **Quality Synthesis**: Combine findings effectively to provide the most helpful response

This adaptive approach ensures optimal context gathering - from lightweight direct analysis for simple requests to comprehensive multi-agent investigation for complex system-wide tasks.

Now proceed with intelligent context analysis for: $ARGUMENTS
