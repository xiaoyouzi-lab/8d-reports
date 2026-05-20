export interface QualityKnowledgeEntry {
  id: string
  category: KnowledgeCategory
  title: string
  description: string
  purpose: string
  applicability: CompanySize[]
  industries: string[]
  countries: string[]
  keyConcepts: string[]
  practicalGuidance: string
  relatedEntries: string[]
  maturityLevel: MaturityLevel
  tags: string[]
}

export type KnowledgeCategory =
  | "quality_system"
  | "certification"
  | "methodology"
  | "tool"
  | "practice"
  | "industry_specific"
  | "country_practice"

export type CompanySize = "world_class" | "medium" | "small"

export type MaturityLevel = "foundational" | "intermediate" | "advanced" | "excellence"

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  references?: KnowledgeReference[]
  timestamp: number
}

export interface KnowledgeReference {
  entryId: string
  title: string
  category: KnowledgeCategory
  relevance: number
}

export interface AgentContext {
  companySize?: CompanySize
  industry?: string
  country?: string
  currentMaturity?: MaturityLevel
  conversationHistory: ChatMessage[]
}

export interface AgentResponse {
  message: string
  references: KnowledgeReference[]
  suggestedActions: SuggestedAction[]
}

export interface SuggestedAction {
  type: "learn" | "implement" | "tool" | "certification" | "next_step"
  title: string
  description: string
  priority: "high" | "medium" | "low"
}
