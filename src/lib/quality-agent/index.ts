import {
  retrieveKnowledge,
  extractContextFromQuery,
  generateAgentResponse,
} from "./retrieval"
import type {
  AgentResponse,
  ChatMessage,
  AgentContext,
  KnowledgeReference,
  SuggestedAction,
} from "./types"

export function processQuery(
  query: string,
  previousMessages: ChatMessage[] = [],
  userContext?: {
    companySize?: AgentContext["companySize"]
    industry?: string
    country?: string
  }
): AgentResponse {
  const context = {
    ...extractContextFromQuery(query),
    ...(userContext?.companySize && { companySize: userContext.companySize }),
    ...(userContext?.industry && { industry: userContext.industry }),
    ...(userContext?.country && { country: userContext.country }),
  }

  const relevantEntries = retrieveKnowledge(query, {
    companySize: context.companySize,
    industry: context.industry,
    country: context.country,
  })

  const conversationHistory = previousMessages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n")

  const message = generateAgentResponse(query, relevantEntries, conversationHistory)

  const references: KnowledgeReference[] = relevantEntries.slice(0, 5).map((r) => ({
    entryId: r.entry.id,
    title: r.entry.title,
    category: r.entry.category,
    relevance: Math.round(r.score),
  }))

  const suggestedActions = generateSuggestedActions(
    query,
    relevantEntries,
    context
  )

  return { message, references, suggestedActions }
}

function generateSuggestedActions(
  _query: string,
  relevantEntries: Array<{ entry: { id: string; title: string; category: string; tags: string[] }; score: number }>,
  context: { companySize?: string; industry?: string; country?: string }
): SuggestedAction[] {
  const actions: SuggestedAction[] = []

  const categories = new Set(relevantEntries.map((r) => r.entry.category))

  if (categories.has("quality_system") || categories.has("certification")) {
    actions.push({
      type: "certification",
      title:
        context.companySize === "small"
          ? "先做好基础，暂缓认证"
          : "评估适合的认证路径",
      description:
        context.companySize === "small"
          ? "小企业建议先做好内部标准，等业务需要时再申请认证"
          : "根据客户要求和行业选择最合适的质量管理体系认证",
      priority: "medium",
    })
  }

  if (categories.has("tool")) {
    actions.push({
      type: "tool",
      title: "导入关键质量工具",
      description:
        "根据你的业务特点，选择合适的质量工具在核心流程中导入",
      priority: "high",
    })
  }

  if (categories.has("methodology")) {
    actions.push({
      type: "implement",
      title: "选择合适的方法论框架",
      description:
        "根据企业规模和成熟度选择合适的改善方法论",
      priority: "medium",
    })
  }

  if (context.companySize === "small") {
    actions.push({
      type: "next_step",
      title: "从5S和标准化开始",
      description:
        "小企业质量提升第一步：5S+首件检验+标准化作业，零成本高回报",
      priority: "high",
    })
  } else if (context.companySize === "medium") {
    actions.push({
      type: "next_step",
      title: "建立核心质量管理体系",
      description:
        "建议以ISO 9001为基础，逐步导入FMEA、SPC等工具",
      priority: "high",
    })
  } else if (context.companySize === "world_class") {
    actions.push({
      type: "next_step",
      title: "推进质量数字化转型",
      description:
        "利用大数据和AI技术实现质量管理的预防性监控和智能决策",
      priority: "medium",
    })
  }

  actions.push({
    type: "learn",
    title: "深入了解相关标准和方法",
    description: "查阅相关知识，为团队做培训准备",
    priority: "low",
  })

  return actions
}

export * from "./types"
export { qualityKnowledgeBase } from "../quality-knowledge/index"
