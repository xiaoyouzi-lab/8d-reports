export type SocialPlatform =
  | "twitter_x"
  | "facebook"
  | "instagram"
  | "linkedin"
  | "tiktok"
  | "youtube"
  | "reddit"
  | "pinterest"
  | "discord"
  | "telegram"
  | "whatsapp"
  | "threads"
  | "weibo"
  | "wechat"
  | "xiaohongshu"
  | "douyin"
  | "bilibili"
  | "zhihu"
  | "kuaishou"
  | "jike"

export type SocialTaskType =
  | "account_creation"
  | "account_management"
  | "social_listening"
  | "content_publishing"
  | "idea_validation"
  | "data_analysis"
  | "sentiment_monitoring"
  | "automation_building"
  | "intelligence_gathering"
  | "issue_reporting"

export type IssueSeverity = "critical" | "major" | "minor"

export type IssueCategory =
  | "account_security"
  | "content_compliance"
  | "public_sentiment_crisis"
  | "api_technical"
  | "content_strategy"
  | "data_anomaly"
  | "platform_policy"
  | "resource_shortage"

export type EscalationTarget =
  | "customer_requirements_expert"
  | "marketing_expert"
  | "idea_validation_expert"
  | "data_analysis_expert"
  | "data_calibration_expert"
  | "art_expert"
  | "ui_expert"
  | "programming_expert"
  | "quality_expert"
  | "project_manager"
  | "cost_expert"
  | "local_operations_expert"

export type AgentCollaborationStatus =
  | "pending"
  | "in_progress"
  | "resolved"
  | "escalated"
  | "closed"

export interface SocialAccount {
  id: string
  platform: SocialPlatform
  username: string
  displayName: string
  bio: string
  avatarUrl: string
  coverUrl: string
  linkBio: string
  verified: boolean
  status: "active" | "inactive" | "limited" | "suspended"
  createdAt: number
  followers: number
  following: number
  postsCount: number
  engagementRate: number
  healthScore: number
}

export interface SocialAccountCreateRequest {
  platform: SocialPlatform
  brandName: string
  brandPositioning: string
  targetAudience: string
  brandColors: string[]
  brandFonts: string[]
  valueProposition: string
}

export interface SocialListeningRequest {
  objective: string
  platforms: SocialPlatform[]
  keywords: string[]
  timeRange: "realtime" | "7d" | "30d" | "90d" | "1y"
  targetType: "competitive" | "industry" | "user_insight" | "sentiment" | "trend"
}

export interface SocialListeningResult {
  totalMentions: number
  sentimentRatio: { positive: number; neutral: number; negative: number }
  topThemes: string[]
  trendDirection: "rising" | "falling" | "stable"
  keyInfluencers: string[]
  competitiveComparison: CompetitiveComparison | null
  dataConfidence: "high" | "medium" | "low"
  sourceTimestamp: number
}

export interface CompetitiveComparison {
  brand: string
  competitors: Array<{
    name: string
    mentionShare: number
    sentimentRatio: { positive: number; neutral: number; negative: number }
    topContent: string[]
  }>
}

export interface ContentPublishRequest {
  platform: SocialPlatform
  content: string
  mediaUrls: string[]
  tags: string[]
  targetAudience: string
  publishTime: number | null
  callToAction: string
}

export interface ContentPublishResult {
  postId: string
  platform: SocialPlatform
  publishedAt: number
  interactions: {
    likes: number
    comments: number
    shares: number
    clicks: number
  }
  reach: number
  conversionRate: number
}

export interface IdeaValidationRequest {
  hypothesis: string
  targetPlatforms: SocialPlatform[]
  validationMethod: "content_test" | "community_discussion" | "landing_page" | "dm_interview"
  successCriteria: string
  duration: string
}

export interface IdeaValidationResult {
  hypothesis: string
  validationMethod: string
  quantitativeMetrics: {
    engagement: number
    conversion: number
    sentiment: { positive: number; neutral: number; negative: number }
    virality: number
  }
  qualitativeFeedback: string[]
  signalStrength: "strong" | "moderate" | "weak" | "noise"
  recommendation: "proceed" | "proceed_with_adjustment" | "pivot" | "abandon"
}

export interface IssueReport {
  id: string
  category: IssueCategory
  severity: IssueSeverity
  discoveredAt: number
  description: string
  affectedPlatforms: SocialPlatform[]
  affectedAccounts: string[]
  attemptedFixes: string[]
  currentStatus: "ongoing" | "mitigated" | "resolved"
  escalationTargets: EscalationTarget[]
  escalationReason: string
  impactAssessment: string
  collaborationStatus: AgentCollaborationStatus
}

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
  category: string
  relevance: number
}

export interface AgentContext {
  platform?: SocialPlatform
  taskType?: SocialTaskType
  brandName?: string
  targetRegion?: string
  targetAudience?: string
  conversationHistory: ChatMessage[]
}

export interface AgentResponse {
  message: string
  references: KnowledgeReference[]
  suggestedActions: SuggestedAction[]
  issuesReported?: IssueReport[]
  collaborationRequests?: CollaborationRequest[]
}

export interface SuggestedAction {
  type: "create_account" | "gather_intelligence" | "publish_content" | "validate_idea" | "report_issue" | "escalate" | "automate" | "monitor"
  title: string
  description: string
  priority: "high" | "medium" | "low"
}

export interface CollaborationRequest {
  targetExpert: EscalationTarget
  reason: string
  urgency: "immediate" | "within_hour" | "within_day" | "within_week"
  context: string
  expectedHelp: string
  status: AgentCollaborationStatus
}

export interface SocialKnowledgeEntry {
  id: string
  category: "platform_specs" | "content_strategy" | "social_listening" | "account_management" | "idea_validation" | "crisis_management" | "automation" | "best_practice"
  title: string
  description: string
  platforms: SocialPlatform[]
  targetRegions: string[]
  keyConcepts: string[]
  practicalGuidance: string
  relatedEntries: string[]
  tags: string[]
}

export interface OperationsDashboard {
  accountHealth: {
    securityScore: number
    complianceRate: number
    apiAvailability: number
    automationUptime: number
  }
  performance: Array<{
    platform: SocialPlatform
    followers: number
    weeklyGrowth: number
    engagementRate: number
    reach: number
    conversionRate: number
  }>
  intelligenceStats: {
    competitiveIntel: { collected: number; delivered: number; pending: number }
    industryTrends: { collected: number; delivered: number; pending: number }
    userInsights: { collected: number; delivered: number; pending: number }
  }
  issueLog: IssueReport[]
}
