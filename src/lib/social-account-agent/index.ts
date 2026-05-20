import { socialAccountKnowledgeBase, issueEscalationMatrix, platformSpecs } from "./knowledge"
import type {
  SocialKnowledgeEntry,
  ChatMessage,
  AgentResponse,
  KnowledgeReference,
  SuggestedAction,
  IssueReport,
  IssueCategory,
  IssueSeverity,
  EscalationTarget,
  CollaborationRequest,
  SocialPlatform,
} from "./types"

function tokenize(text: string): string[] {
  const cleaned = text
    .replace(/[.,?!;:'"()（）【】《》、，。？！；：""']/g, " ")
    .toLowerCase()
  const words = cleaned.split(/\s+/).filter(Boolean)

  const result: string[] = [...words]

  for (let i = 0; i < words.length - 1; i++) {
    result.push(`${words[i]} ${words[i + 1]}`)
  }
  if (words.length >= 3) {
    for (let i = 0; i < words.length - 2; i++) {
      result.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`)
    }
  }

  return result
}

function retrieveKnowledge(
  query: string,
  context?: { platform?: SocialPlatform; taskType?: string; targetRegion?: string }
): Array<{ entry: SocialKnowledgeEntry; score: number }> {
  const queryLower = query.toLowerCase()
  const queryWords = tokenize(queryLower)

  const scored = socialAccountKnowledgeBase.map((entry) => {
    let score = 0

    if (entry.title.toLowerCase().includes(queryLower)) {
      score += 50
    }

    for (const word of queryWords) {
      if (word.length < 2) continue

      if (entry.title.toLowerCase().includes(word)) score += 8
      if (entry.description.toLowerCase().includes(word)) score += 3
      if (entry.practicalGuidance.toLowerCase().includes(word)) score += 2

      for (const concept of entry.keyConcepts) {
        if (concept.toLowerCase().includes(word)) score += 5
      }

      for (const tag of entry.tags) {
        if (tag.toLowerCase().includes(word)) score += 6
      }
    }

    if (context?.platform && entry.platforms.includes(context.platform)) {
      score += 10
    }

    if (context?.targetRegion) {
      const regionLower = context.targetRegion.toLowerCase()
      if (entry.targetRegions.some((r) => r.toLowerCase().includes(regionLower) || regionLower.includes(r.toLowerCase()))) {
        score += 8
      }
    }

    score += entry.keyConcepts.length * 0.1

    return { entry, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
}

function detectPlatformFromQuery(query: string): SocialPlatform | undefined {
  const lower = query.toLowerCase()
  const patterns: Array<{ keywords: string[]; platform: SocialPlatform }> = [
    { keywords: ["twitter", "x平台", "tweet", "推文", "x.com"], platform: "twitter_x" },
    { keywords: ["facebook", "脸书", "fb", "meta"], platform: "facebook" },
    { keywords: ["instagram", "ins", "ig", "reels", "stories"], platform: "instagram" },
    { keywords: ["linkedin", "领英"], platform: "linkedin" },
    { keywords: ["tiktok", "抖音国际版", "tiktok shop"], platform: "tiktok" },
    { keywords: ["youtube", "油管", "youtube shorts"], platform: "youtube" },
    { keywords: ["reddit", "subreddit", "红迪"], platform: "reddit" },
    { keywords: ["pinterest", "拼趣"], platform: "pinterest" },
    { keywords: ["discord"], platform: "discord" },
    { keywords: ["telegram", "电报"], platform: "telegram" },
    { keywords: ["微博", "weibo", "新浪微博"], platform: "weibo" },
    { keywords: ["微信", "公众号", "wechat", "视频号", "小程序"], platform: "wechat" },
    { keywords: ["小红书", "xiaohongshu", "rednote", "薯条", "种草"], platform: "xiaohongshu" },
    { keywords: ["抖音", "douyin", "抖店", "团购"], platform: "douyin" },
    { keywords: ["b站", "bilibili", "哔哩哔哩", "弹幕"], platform: "bilibili" },
    { keywords: ["知乎", "zhihu", "盐选"], platform: "zhihu" },
    { keywords: ["快手", "kuaishou", "老铁"], platform: "kuaishou" },
    { keywords: ["即刻", "jike", "圈子"], platform: "jike" },
    { keywords: ["whatsapp"], platform: "whatsapp" },
    { keywords: ["threads"], platform: "threads" },
  ]

  for (const { keywords, platform } of patterns) {
    if (keywords.some((k) => lower.includes(k))) {
      return platform
    }
  }
  return undefined
}

function detectTaskTypeFromQuery(query: string): string | undefined {
  const lower = query.toLowerCase()
  const patterns: Record<string, string[]> = {
    account_creation: ["创建", "新建", "注册", "开账户", "开账号", "create account", "setup", "new account", "设计账户", "设计账号"],
    social_listening: ["监听", "搜索", "情报", "舆情", "舆情监控", "竞品分析", "趋势", "情报收集", "情报", "social listening", "monitor", "track"],
    content_publishing: ["发布", "发帖", "post", "发内容", "推送", "content", "文案"],
    idea_validation: ["验证", "测试", "test", "validate", "想法", "mvp", "商业化验证", "市场需求"],
    issue_reporting: ["问题", "故障", "报错", "异常", "issue", "problem", "error", "bug"],
    account_management: ["管理", "运营", "manage", "operation", "粉丝", "增长"],
    automation_building: ["自动化", "自动", "automation", "定时", "机器人", "bot"],
  }

  for (const [taskType, keywords] of Object.entries(patterns)) {
    if (keywords.some((k) => lower.includes(k))) {
      return taskType
    }
  }
  return undefined
}

function detectIssuesFromQuery(query: string): IssueReport[] {
  const lower = query.toLowerCase()
  const issues: IssueReport[] = []

  const issueSignals: Array<{
    keywords: string[]
    category: IssueCategory
    severity: IssueSeverity
  }> = [
    {
      keywords: ["封号", "被黑", "密码泄露", "异常登录", "账户被限", "账号被盗", "hacked", "suspended", "locked"],
      category: "account_security",
      severity: "critical",
    },
    {
      keywords: ["内容下架", "违规", "被删", "限流", "shadowban", "审核不通过", "降权"],
      category: "content_compliance",
      severity: "critical",
    },
    {
      keywords: ["舆情危机", "负面爆发", "品牌声誉", "公关危机", "大量投诉", "负面新闻"],
      category: "public_sentiment_crisis",
      severity: "critical",
    },
    {
      keywords: ["api错误", "api调用失败", "api error", "接口异常", "api限额", "rate limit", "连接失败"],
      category: "api_technical",
      severity: "major",
    },
    {
      keywords: ["互动率下降", "粉丝不涨", "粉丝增长停滞", "触达下降", "内容效果差", "没有流量"],
      category: "content_strategy",
      severity: "major",
    },
    {
      keywords: ["数据异常", "数据不准", "数据波动", "数据源不可靠", "数据对不上"],
      category: "data_anomaly",
      severity: "minor",
    },
    {
      keywords: ["平台政策变化", "算法更新", "规则改了", "policy change", "新规定"],
      category: "platform_policy",
      severity: "minor",
    },
    {
      keywords: ["人手不够", "素材不够", "工具缺失", "资源不足", "产能不够", "忙不过来"],
      category: "resource_shortage",
      severity: "minor",
    },
  ]

  for (const { keywords, category, severity } of issueSignals) {
    if (keywords.some((k) => lower.includes(k))) {
      issues.push({
        id: `issue_${Date.now()}_${category}`,
        category,
        severity,
        discoveredAt: Date.now(),
        description: `从用户查询中检测到${category}相关信号`,
        affectedPlatforms: [detectPlatformFromQuery(query) || "twitter_x"],
        affectedAccounts: [],
        attemptedFixes: [],
        currentStatus: "ongoing",
        escalationTargets: [],
        escalationReason: "",
        impactAssessment: "需要进一步评估",
        collaborationStatus: "pending",
      })
    }
  }

  return issues
}

function generateCollaborationRequests(issues: IssueReport[]): CollaborationRequest[] {
  const requests: CollaborationRequest[] = []

  for (const issue of issues) {
    const escalation = issueEscalationMatrix[issue.category]
    if (!escalation) continue

    for (const target of escalation.targets) {
      requests.push({
        targetExpert: target as EscalationTarget,
        reason: `检测到${issue.category}类型问题，需要你的专业支持`,
        urgency: escalation.urgency as CollaborationRequest["urgency"],
        context: issue.description,
        expectedHelp: `请协助诊断和解决${issue.description}的问题`,
        status: "pending",
      })
    }
  }

  return requests
}

function generateAgentResponse(
  query: string,
  relevantEntries: Array<{ entry: SocialKnowledgeEntry; score: number }>
): string {
  if (relevantEntries.length === 0) {
    return noMatchResponse(query)
  }

  const topEntries = relevantEntries.slice(0, 5)
  const responseParts: string[] = []

  responseParts.push(generateOpening(query))

  for (const { entry } of topEntries.slice(0, 3)) {
    responseParts.push(`\n## ${entry.title}\n`)
    responseParts.push(entry.description)
    responseParts.push(`\n**关键要点：** ${entry.keyConcepts.slice(0, 5).join("、")}`)
    responseParts.push(`\n**实操建议：** ${entry.practicalGuidance}`)

    if (entry.tags.length > 0) {
      responseParts.push(`\n**标签：** ${entry.tags.map((t) => `\`${t}\``).join(" ")}`)
    }
  }

  responseParts.push(generateIssuesSection(query))
  responseParts.push(generateClosing(topEntries))

  return responseParts.join("\n")
}

function generateOpening(query: string): string {
  const platform = detectPlatformFromQuery(query)
  const taskType = detectTaskTypeFromQuery(query)

  const parts: string[] = []

  if (platform && platformSpecs[platform]) {
    parts.push(`我理解你关注的是**${platformSpecs[platform].name}**平台`)
  }

  if (taskType) {
    const taskLabels: Record<string, string> = {
      account_creation: "账户创建与设计",
      social_listening: "社交情报收集与监听",
      content_publishing: "社交内容发布",
      idea_validation: "商业想法社交验证",
      issue_reporting: "问题检测与上报",
      account_management: "账户管理与运营",
      automation_building: "自动化建设",
    }
    if (taskLabels[taskType]) {
      parts.push(`，任务类型为**${taskLabels[taskType]}**`)
    }
  }

  parts.push("。让我从社交运营专业角度进行分析。\n")

  return parts.join("")
}

function generateIssuesSection(query: string): string {
  const issues = detectIssuesFromQuery(query)
  if (issues.length === 0) return ""

  let section = "\n---\n## ⚠️ 问题检测与上报建议\n\n"

  for (const issue of issues) {
    const severityLabels: Record<string, string> = { critical: "🔴 严重", major: "🟠 重要", minor: "🟡 一般" }
    const escalation = issueEscalationMatrix[issue.category]

    section += `### ${severityLabels[issue.severity] || "⚠️"} 检测到潜在问题：${issue.category}\n`
    section += `- **问题描述：** ${issue.description}\n`

    if (escalation) {
      section += `- **建议上报：** ${escalation.targets.join("、")}\n`
      section += `- **建议同步：** ${escalation.notify.length > 0 ? escalation.notify.join("、") : "无需同步"}\n`
      section += `- **紧急程度：** ${escalation.urgency}\n`
    }

    section += `- **行动建议：** 我会主动将此问题上报给相关专家，并在他们协助下持续跟踪解决。你不需要独自处理这个问题。\n\n`
  }

  return section
}

function generateClosing(
  topEntries: Array<{ entry: SocialKnowledgeEntry; score: number }>
): string {
  let closing = "\n---\n"

  const collaborationExperts = new Set<string>()
  for (const { entry } of topEntries) {
    for (const tag of entry.tags) {
      if (tag.includes("协同") || tag.includes("美术专家")) collaborationExperts.add("art_expert")
      if (tag.includes("编程") || tag.includes("技术")) collaborationExperts.add("programming_expert")
      if (tag.includes("营销")) collaborationExperts.add("marketing_expert")
      if (tag.includes("验证")) collaborationExperts.add("idea_validation_expert")
      if (tag.includes("数据")) collaborationExperts.add("data_analysis_expert")
      if (tag.includes("本地操作") || tag.includes("自动化")) collaborationExperts.add("local_operations_expert")
    }
  }

  if (collaborationExperts.size > 0) {
    const expertNames: Record<string, string> = {
      art_expert: "美术优化专家",
      programming_expert: "编程专家",
      marketing_expert: "营销专家",
      idea_validation_expert: "想法验证专家",
      data_analysis_expert: "数据分析专家",
      local_operations_expert: "本地操作专家",
    }
    const names = Array.from(collaborationExperts)
      .map((e) => expertNames[e] || e)
      .join("、")

    closing += `\n💡 **协同建议：** 这个任务涉及社交运营的多个维度。如果需要，我可以主动协调${names}等专家一起协作完成。\n`
  }

  closing += "\n🔄 **持续运营保障：** 在执行过程中，我会持续监控账户健康状态，遇到任何问题都会第一时间上报并协调资源解决，确保社交运营体系稳定运行。"

  return closing
}

function noMatchResponse(query: string): string {
  const platform = detectPlatformFromQuery(query)

  let response = "我理解你想了解社交账户运营相关的内容。我可以在以下领域提供帮助：\n\n"

  response += "**📱 社交账户创建与设计：** 平台选择策略、账户资料设计、品牌视觉统一、认证申请\n\n"
  response += "**🔍 社交情报收集：** 品牌舆情监控、竞品社交分析、行业趋势追踪、用户洞察挖掘\n\n"
  response += "**📝 社交内容发布：** 多平台内容策略、内容日历规划、热点借势、文案创作\n\n"
  response += "**🧪 商业想法验证：** 社交内容测试、社区讨论验证、Landing Page引流验证\n\n"
  response += "**⚠️ 问题检测与上报：** 账户安全告警、舆情危机预警、技术故障上报、跨专家协作\n\n"
  response += "**🤖 自动化运营：** 定时发布系统、自动回复、监控告警、数据报表\n\n"

  response += "**支持的主流平台：**\n"
  response += "- 全球：Twitter/X、Facebook、Instagram、LinkedIn、TikTok、YouTube、Reddit、Pinterest、Discord、Telegram\n"
  response += "- 中国：微博、微信公众号/视频号、小红书、抖音、B站、知乎、快手、即刻\n\n"

  if (platform && platformSpecs[platform]) {
    response += `我注意到你提到了**${platformSpecs[platform].name}**。你能告诉我更多关于你想在这个平台上做什么吗？比如是创建新账户、收集情报、发布内容、还是其他需求？这样我可以给你更有针对性的建议。`
  } else {
    response += "你能告诉我更多关于你的品牌/产品和目标用户的信息吗？比如你想在哪个社交平台运营、目前的运营现状如何、遇到了什么具体问题？这样我可以给你更有针对性的建议。"
  }

  return response
}

function generateSuggestedActions(
  _query: string,
  relevantEntries: Array<{ entry: SocialKnowledgeEntry; score: number }>,
  context: { platform?: SocialPlatform; taskType?: string }
): SuggestedAction[] {
  const actions: SuggestedAction[] = []
  const categories = new Set(relevantEntries.map((r) => r.entry.category))

  if (categories.has("account_management") || context.taskType === "account_creation") {
    actions.push({
      type: "create_account",
      title: "创建和设计社交账户",
      description: "根据品牌定位选择最优平台，设计完整的账户资料和视觉形象",
      priority: "high",
    })
  }

  if (categories.has("social_listening") || context.taskType === "social_listening") {
    actions.push({
      type: "gather_intelligence",
      title: "启动社交情报收集",
      description: "建立品牌/竞品/行业关键词监控，追踪关键信号",
      priority: "high",
    })
  }

  if (categories.has("content_strategy")) {
    actions.push({
      type: "publish_content",
      title: "制定内容发布策略",
      description: "设计内容日历、主题配比和发布节奏",
      priority: "medium",
    })
  }

  if (categories.has("idea_validation") || context.taskType === "idea_validation") {
    actions.push({
      type: "validate_idea",
      title: "设计社交验证方案",
      description: "利用社交平台低成本验证商业假设",
      priority: "high",
    })
  }

  if (categories.has("crisis_management")) {
    actions.push({
      type: "monitor",
      title: "建立舆情监控机制",
      description: "设置关键词监控和异常告警规则",
      priority: "high",
    })
    actions.push({
      type: "report_issue",
      title: "配置问题上报流程",
      description: "明确问题分级、上报路由和协作矩阵",
      priority: "high",
    })
  }

  if (categories.has("automation")) {
    actions.push({
      type: "automate",
      title: "搭建自动化运营系统",
      description: "定时发布、自动监控、数据报表自动化",
      priority: "medium",
    })
  }

  const issues = detectIssuesFromQuery(_query)
  if (issues.length > 0 && !actions.some((a) => a.type === "escalate")) {
    actions.push({
      type: "escalate",
      title: `上报${issues.length}个检测到的问题`,
      description: "将检测到的问题主动上报给相关专家，协调资源解决",
      priority: "high",
    })
  }

  if (actions.length < 2) {
    actions.push({
      type: "monitor",
      title: "建立持续监控",
      description: "为社交账户建立健康监控和定期检查机制",
      priority: "low",
    })
  }

  return actions
}

export function processQuery(
  query: string,
  _previousMessages: ChatMessage[] = [],
  userContext?: {
    platform?: SocialPlatform
    taskType?: string
    brandName?: string
    targetRegion?: string
    targetAudience?: string
  }
): AgentResponse {
  const detectedPlatform = detectPlatformFromQuery(query) || userContext?.platform
  const detectedTaskType = detectTaskTypeFromQuery(query) || userContext?.taskType

  const context = {
    platform: detectedPlatform,
    taskType: detectedTaskType,
    brandName: userContext?.brandName,
    targetRegion: userContext?.targetRegion,
    targetAudience: userContext?.targetAudience,
  }

  const relevantEntries = retrieveKnowledge(query, {
    platform: context.platform,
    taskType: context.taskType,
    targetRegion: context.targetRegion,
  })

  const message = generateAgentResponse(query, relevantEntries)

  const references: KnowledgeReference[] = relevantEntries.slice(0, 5).map((r) => ({
    entryId: r.entry.id,
    title: r.entry.title,
    category: r.entry.category,
    relevance: Math.round(r.score),
  }))

  const suggestedActions = generateSuggestedActions(
    query,
    relevantEntries,
    context as { platform?: SocialPlatform; taskType?: string }
  )

  const issues = detectIssuesFromQuery(query)
  const collaborationRequests = generateCollaborationRequests(issues)

  const issuesWithEscalation = issues.map((issue) => {
    const escalation = issueEscalationMatrix[issue.category]
    return {
      ...issue,
      escalationTargets: escalation?.targets.map((t) => t as EscalationTarget) || [],
      escalationReason: escalation
        ? `自动检测到${issue.category}信号，建议上报${escalation.targets.join("、")}，同步${escalation.notify.join("、")}`
        : "",
    }
  })

  return {
    message,
    references,
    suggestedActions,
    ...(issuesWithEscalation.length > 0 && { issuesReported: issuesWithEscalation }),
    ...(collaborationRequests.length > 0 && { collaborationRequests }),
  }
}

export {
  detectPlatformFromQuery,
  detectTaskTypeFromQuery,
  detectIssuesFromQuery,
  generateCollaborationRequests,
  retrieveKnowledge,
  issueEscalationMatrix,
  platformSpecs,
}

export * from "./types"
export { socialAccountKnowledgeBase } from "./knowledge"
