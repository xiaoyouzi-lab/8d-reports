import { qualityKnowledgeBase } from "../quality-knowledge/index"
import type {
  QualityKnowledgeEntry,
  KnowledgeReference,
  KnowledgeCategory,
  CompanySize,
} from "./types"

export function retrieveKnowledge(
  query: string,
  context?: {
    companySize?: CompanySize
    industry?: string
    country?: string
  }
): Array<{ entry: QualityKnowledgeEntry; score: number }> {
  const queryLower = query.toLowerCase()
  const queryWords = tokenize(queryLower)

  const scored = qualityKnowledgeBase.map((entry) => {
    let score = 0

    if (entry.title.toLowerCase().includes(queryLower)) {
      score += 50
    }

    for (const word of queryWords) {
      if (word.length < 2) continue

      if (entry.title.toLowerCase().includes(word)) score += 8
      if (entry.description.toLowerCase().includes(word)) score += 3
      if (entry.purpose.toLowerCase().includes(word)) score += 2
      if (entry.practicalGuidance.toLowerCase().includes(word)) score += 1

      for (const concept of entry.keyConcepts) {
        if (concept.toLowerCase().includes(word)) score += 5
      }

      for (const tag of entry.tags) {
        if (tag.toLowerCase().includes(word)) score += 6
      }

      for (const industry of entry.industries) {
        if (industry.toLowerCase().includes(word)) score += 4
      }
    }

    if (context?.companySize && entry.applicability.includes(context.companySize)) {
      score += 10
    }

    if (context?.industry) {
      const industryLower = context.industry.toLowerCase()
      for (const ind of entry.industries) {
        if (ind.toLowerCase().includes(industryLower) || industryLower.includes(ind.toLowerCase())) {
          score += 8
        }
      }
    }

    if (context?.country) {
      const countryLower = context.country.toLowerCase()
      for (const c of entry.countries) {
        if (c.toLowerCase().includes(countryLower) || countryLower.includes(c.toLowerCase())) {
          score += 6
        }
      }
    }

    score += entry.keyConcepts.length * 0.1

    return { entry, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
}

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

  const synonyms: Record<string, string[]> = {
    iso: ["iso", "国际标准", "iso standard", "管理系统", "认证", "体系认证"],
    iatf: ["iatf", "汽车", "automotive", "16949", "汽车行业"],
    fmea: ["fmea", "失效模式", "失效分析", "风险分析", "failure mode", "预防"],
    spc: ["spc", "统计过程控制", "统计过程", "过程控制", "控制图", "cpk", "ppk", "过程能力"],
    msa: ["msa", "测量系统", "量具", "gage", "grr", "重复性", "再现性"],
    lean: ["lean", "精益", "精益生产", "tps", "丰田", "消除浪费"],
    sixsigma: ["六西格玛", "6sigma", "six sigma", "sigma", "西格玛", "绿带", "黑带"],
    kaizen: ["kaizen", "改善", "持续改善", "改善提案", "持续改进"],
    "8d": ["8d", "八步", "八个步骤", "问题解决", "eight disciplines", "八大步骤"],
    鱼骨: ["鱼骨", "因果图", "ishikawa", "石川", "6m"],
    "5why": ["5why", "五个为什么", "5个为什么", "根因", "根本原因", "why why"],
    apqp: ["apqp", "先期质量", "产品质量先期策划", "前期策划"],
    ppap: ["ppap", "生产件批准", "零件提交", "psw"],
    "5s": ["5s", "整理", "整顿", "清扫", "现场管理", "目视化"],
    防错: ["防错", "pokayoke", "防呆", "差错预防"],
    供应商: ["供应商", "供应商品质", "supplier", "供应链", "sqe", "采购"],
    医疗器械: ["医疗器械", "medical device", "medical", "fda", "gmp"],
    航空航天: ["航空航天", "航天", "航空", "aerospace", "as9100", "nadcap"],
    德国: ["德国", "germany", "vda", "tuv"],
    日本: ["日本", "japan", "toyota", "丰田", "tps"],
    中国: ["中国", "china", "gbt", "国家标准", "ccc"],
    美国: ["美国", "america", "usa", "asq", "aiag"],
    质量成本: ["质量成本", "coq", "报废", "返工", "cost"],
    数字化: ["数字化", "digital", "qms", "系统", "软件", "ai"],
    文化: ["文化", "culture", "领导力", "全员", "质量意识"],
  }

  for (const [_, synonymsList] of Object.entries(synonyms)) {
    if (synonymsList.some((s) => text.includes(s))) {
      for (const syn of synonymsList) {
        if (!result.includes(syn)) result.push(syn)
      }
    }
  }

  return result
}

export function extractContextFromQuery(query: string): {
  companySize?: CompanySize
  industry?: string
  country?: string
} {
  const lower = query.toLowerCase()

  const companySizePatterns: Array<{ keywords: string[]; size: CompanySize }> = [
    {
      keywords: ["大企业", "大公司", "跨国", "世界级", "集团公司", "上市公司", "world class", "multinational", "enterprise"],
      size: "world_class",
    },
    {
      keywords: ["中型", "中等", "mid-size", "medium", "中小企业", "200人", "300人", "500人", "几百人"],
      size: "medium",
    },
    {
      keywords: ["小企业", "小作坊", "小厂", "创业", "startup", "small", "小微", "10人", "20人", "50人", "刚起步", "几个人"],
      size: "small",
    },
  ]

  for (const pattern of companySizePatterns) {
    if (pattern.keywords.some((k) => lower.includes(k))) {
      return { companySize: pattern.size }
    }
  }

  const industryPatterns: Record<string, string[]> = {
    "汽车": ["汽车", "automotive", "整车", "tier", "零部件"],
    "电子": ["电子", "electronics", "pcb", "smt", "半导体"],
    "医疗器械": ["医疗", "medical", "器械", "fda"],
    "航空航天": ["航空", "航天", "aerospace", "飞机"],
    "通用制造": ["制造", "manufacturing", "工厂", "车间"],
    "食品": ["食品", "food", "饮料", "餐饮"],
    "制药": ["制药", "pharma", "药品", "gmp"],
  }

  for (const [industry, keywords] of Object.entries(industryPatterns)) {
    if (keywords.some((k) => lower.includes(k))) {
      return { industry }
    }
  }

  const countryPatterns: Record<string, string[]> = {
    "中国": ["中国", "国内", "china", "中文"],
    "日本": ["日本", "japan", "日企"],
    "德国": ["德国", "germany", "德系", "德企"],
    "美国": ["美国", "usa", "america", "美企", "北美"],
    "韩国": ["韩国", "korea", "韩企"],
  }

  for (const [country, keywords] of Object.entries(countryPatterns)) {
    if (keywords.some((k) => lower.includes(k))) {
      return { country }
    }
  }

  return {}
}

export function generateAgentResponse(
  query: string,
  relevantEntries: Array<{ entry: QualityKnowledgeEntry; score: number }>,
  conversationHistory: string
): string {
  if (relevantEntries.length === 0) {
    return noMatchResponse(query)
  }

  const context = extractContextFromQuery(query)
  const topEntries = relevantEntries.slice(0, 5)
  const topEntry = topEntries[0]

  const responseParts: string[] = []

  responseParts.push(generateOpening(query, topEntry.entry, context))

  for (const { entry } of topEntries.slice(0, 3)) {
    responseParts.push(`\n## ${entry.title}\n`)
    responseParts.push(entry.description)
    responseParts.push(`\n**核心目的：** ${entry.purpose}`)

    if (entry.keyConcepts.length > 0) {
      responseParts.push(
        `\n**关键要点：** ${entry.keyConcepts.slice(0, 5).join("、")}`
      )
    }

    responseParts.push(`\n**实操建议：** ${entry.practicalGuidance}`)
  }

  responseParts.push(generateClosing(topEntries, context))

  return responseParts.join("\n")
}

function generateOpening(
  query: string,
  topEntry: QualityKnowledgeEntry,
  context: { companySize?: CompanySize; industry?: string; country?: string }
): string {
  const parts: string[] = []

  if (context.companySize) {
    const sizeLabels: Record<CompanySize, string> = {
      world_class: "大型企业/世界级公司",
      medium: "中型企业",
      small: "小企业/小作坊",
    }
    parts.push(
      `我理解你关注的是${sizeLabels[context.companySize]}的情况。"`
    )
  }

  parts.push(
    `关于你的问题，让我从质量专业的角度来分析。`
  )

  return parts.join("")
}

function generateClosing(
  topEntries: Array<{ entry: QualityKnowledgeEntry; score: number }>,
  context: { companySize?: CompanySize; industry?: string; country?: string }
): string {
  let closing = "\n---\n"

  if (context.companySize === "small") {
    closing +=
      "\n**给小企业的建议：** 质量管理的核心不是证书和复杂的体系，而是让「第一次就做对」成为习惯。从5S、首件检验、标准化作业这三件零成本的事做起，比花几万块认证ISO更有效。\n"
  } else if (context.companySize === "medium") {
    closing +=
      "\n**给中型企业的建议：** 这个阶段最关键的是在'够用'和'过度'之间找到平衡。先建立核心体系（ISO 9001），再逐步导入关键工具（FMEA、SPC），每个阶段验证效果后再推进下一步。\n"
  } else if (context.companySize === "world_class") {
    closing +=
      "\n**给世界级企业的建议：** 在现有体系基础上，关注三个方向：（1）将质量数据转化为战略决策输入；（2）深度数字化，实现实时质量监控和预警；（3）将质量管理延伸到供应链最上游，建立质量生态圈。\n"
  }

  closing +=
    "\n如果你需要进一步了解某个具体工具的实施细节，或者想讨论如何在你的企业中落地，随时可以继续问我。"

  return closing
}

function noMatchResponse(query: string): string {
  return `我理解你想了解质量相关的内容。我在以下领域可以提供帮助：

**质量体系：** ISO 9001、IATF 16949（汽车）、AS9100（航空航天）、ISO 13485（医疗器械）、VDA 6.3（德系汽车）等

**方法论：** 六西格玛、精益生产、TQM、Kaizen改善、8D问题解决、PDCA、DMAIC、丰田TPS等

**工具：** FMEA、SPC、MSA、APQP、PPAP、控制计划、鱼骨图、5Why、帕累托、防错法、DOE、5S等

**实践：** 供应商质量管理、质量成本管理、质量文化建设、数字化质量管理等

**企业规模：** 小企业/小作坊如何提升质量、中型企业如何建体系、世界级企业质量实践

**国家实践：** 日本（丰田/职人精神）、德国（VDA/精密制造）、美国（六西格玛/ASQ）、中国（GB/T/数字化）

你能告诉我更多关于你的企业情况吗？比如规模、行业、目前面临的具体质量问题？这样我可以给你更有针对性的建议。`
}
